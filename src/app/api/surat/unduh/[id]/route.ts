// src/app/api/surat/unduh/[id]/route.ts (Versi Final dengan Perbaikan Tanda Tangan)
import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getServerSession } from 'next-auth/next';
import { PDFDocument, rgb, StandardFonts, PageSizes, PDFFont } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Fungsi untuk mengambil gambar dari Supabase Storage
async function fetchImage(filePath: string | null): Promise<Uint8Array | null> {
    if (!filePath) return null;
    try {
        const { data, error } = await supabaseAdmin.storage
            .from('berkas-persyaratan') // Pastikan nama bucket ini benar
            .download(filePath);
        if (error) {
            console.error(`Supabase download error for ${filePath}:`, error.message);
            return null;
        }
        return data ? new Uint8Array(await data.arrayBuffer()) : null;
    } catch (e) {
        console.error(`Failed to fetch image ${filePath}:`, e);
        return null;
    }
}

// Fungsi untuk mengganti placeholder secara dinamis
function replacePlaceholders(text: string, data: Record<string, any>): string {
    return text.replace(/{{(.*?)}}/g, (match, key) => {
        const keys = key.trim().split('.');
        let value: any = data;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return ''; // Jika placeholder tidak ditemukan, ganti dengan string kosong
            }
        }
        return String(value ?? '');
    });
}

// Fungsi untuk menggambar teks dengan word-wrapping
function drawTextAndWrap(page: any, text: string, options: { x: number, y: number, font: PDFFont, size: number, lineHeight: number, maxWidth: number, color?: any }): number {
    const { x, font, size, lineHeight, maxWidth, color } = options;
    let y = options.y;
    const lines = text.split('\n');

    for (const line of lines) {
        const words = line.split(' ');
        let currentLine = '';
        if (words.length === 0 || line.trim() === '') {
            y -= lineHeight;
            continue;
        }
        for (const word of words) {
            const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
            const testWidth = font.widthOfTextAtSize(testLine, size);
            if (testWidth > maxWidth && currentLine.length > 0) {
                page.drawText(currentLine, { x, y, font, size, color: color || rgb(0, 0, 0) });
                y -= lineHeight;
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        page.drawText(currentLine, { x, y, font, size, color: color || rgb(0, 0, 0) });
        y -= lineHeight;
    }
    return y;
}


export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const [surat, pengaturanDesa] = await Promise.all([
            prisma.suratKeluar.findUnique({
                where: { id },
                include: { pemohon: { include: { profile: true } }, template: true, pengesah: { include: { profile: true } } }
            }),
            prisma.pengaturanDesa.findFirst()
        ]);

        if (!surat || !pengaturanDesa || !surat.pengesah?.profile) {
            return new Response(JSON.stringify({ message: "Data surat, pengaturan, atau pengesah tidak lengkap." }), { status: 404 });
        }

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage(PageSizes.A4);
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        const margin = 70;
        let yPosition = height - margin;

        // --- 1. GAMBAR KOP SURAT (TETAP SAMA) ---
        const logoBytes = await fetchImage(pengaturanDesa.logoDesaUrl);
        if (logoBytes) {
            const logoImage = await pdfDoc.embedPng(logoBytes);
            page.drawImage(logoImage, { x: margin, y: height - 120, width: 75, height: 75 });
        }
        
        const centerPos = width / 2;
        yPosition = height - 60;
        const headerTexts = [
            { text: `PEMERINTAH KABUPATEN ${pengaturanDesa.kabupaten?.toUpperCase()}`, font: boldFont, size: 14, yOffset: 0 },
            { text: `KECAMATAN ${pengaturanDesa.kecamatan?.toUpperCase()}`, font: boldFont, size: 16, yOffset: 20 },
            { text: `KEPALA DESA ${pengaturanDesa.namaDesa?.toUpperCase()}`, font: boldFont, size: 20, yOffset: 25 },
            { text: pengaturanDesa.alamatKantor, font: font, size: 10, yOffset: 15 },
        ];
        
        for (const item of headerTexts) {
            yPosition -= item.yOffset;
            const textWidth = item.font.widthOfTextAtSize(item.text, item.size);
            page.drawText(item.text, { x: centerPos - textWidth / 2, y: yPosition, font: item.font, size: item.size });
        }
        yPosition -= 10;
        page.drawLine({ start: { x: margin, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 3 });
        yPosition -= 50;

        // --- 2. JUDUL DAN NOMOR SURAT (TETAP SAMA) ---
        const judulSurat = surat.template.namaSurat.toUpperCase();
        const nomorSurat = `Nomor: ${surat.nomorSurat || '470/___/PEM'}`;
        const judulWidth = boldFont.widthOfTextAtSize(judulSurat, 14);
        page.drawText(judulSurat, { x: (width - judulWidth) / 2, y: yPosition, font: boldFont, size: 14 });
        yPosition -= 15;
        page.drawLine({ start: { x: (width - judulWidth) / 2, y: yPosition }, end: { x: ((width - judulWidth) / 2) + judulWidth, y: yPosition }, thickness: 1 });
        yPosition -= 15;
        const nomorWidth = font.widthOfTextAtSize(nomorSurat, 12);
        page.drawText(nomorSurat, { x: (width - nomorWidth) / 2, y: yPosition, font: font, size: 12 });
        yPosition -= 40;

        // --- 3. ISI SURAT DAN TANDA TANGAN DARI TEMPLATE (PERUBAHAN UTAMA) ---
        const allData = {
            pemohon: surat.pemohon.profile,
            form: surat.formData,
            pengesah: surat.pengesah.profile,
            desa: pengaturanDesa,
            nomorSurat: surat.nomorSurat || '470/___/PEM',
            tanggalSurat: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
        };
        
        // Ambil seluruh konten dari template, bersihkan tag HTML, lalu ganti placeholder
        let fullContent = surat.template.templateHtml
            .replace(/<p>|<\/p>|<br\s*\/?>/gi, '\n') // Ganti tag paragraf & br dengan newline
            .replace(/<strong>(.*?)<\/strong>/gi, '$1') // Implementasi Bold (sederhana)
            .replace(/&nbsp;/g, ' ')
            .replace(/<[^>]+>/g, '') // Hapus sisa tag
            .trim();

        const finalContent = replacePlaceholders(fullContent, allData);
        
        // Gambar seluruh konten yang sudah diproses
        drawTextAndWrap(page, finalContent, {
            x: margin,
            y: yPosition,
            font: font,
            size: 12,
            lineHeight: 18,
            maxWidth: width - (margin * 2),
        });

        // --- 4. BUBUHKAN TANDA TANGAN & STEMPEL (OTOMATIS) ---
        const ttdBytes = await fetchImage(surat.pengesah.profile.urlTandaTangan);
        const stempelBytes = await fetchImage(surat.pengesah.profile.urlStempel);
        
        // Posisi untuk stempel dan ttd (dapat disesuaikan)
        const signatureBlockX = width - margin - 220;
        const signatureBlockY = 150; 

        if (stempelBytes) {
            const stempelImage = await pdfDoc.embedPng(stempelBytes);
            page.drawImage(stempelImage, {
                x: signatureBlockX,
                y: signatureBlockY,
                width: 120,
                height: 120,
                opacity: 0.75,
            });
        }
        if (ttdBytes) {
            const ttdImage = await pdfDoc.embedPng(ttdBytes);
            page.drawImage(ttdImage, {
                x: signatureBlockX - 5,
                y: signatureBlockY + 15, // Sedikit di atas stempel
                width: 130,
                height: 65,
            });
        }
        
        // --- 5. SIMPAN DAN KIRIM PDF (TETAP SAMA) ---
        const pdfBytes = await pdfDoc.save();
        const fileName = `surat-${surat.template.kodeSurat}-${surat.pemohon.profile?.nik}.pdf`;

        return new Response(pdfBytes, {
            headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}"` },
        });

    } catch (error) {
        console.error("PDF_GENERATION_ERROR:", error);
        return new Response(JSON.stringify({ message: "Gagal membuat file PDF." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}