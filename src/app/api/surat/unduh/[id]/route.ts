// src/app/api/surat/unduh/[id]/route.ts (Versi Final dengan Perbaikan Encoding)
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

async function fetchImage(filePath: string | null): Promise<Uint8Array | null> {
    if (!filePath) return null;
    try {
        const { data, error } = await supabaseAdmin.storage
            .from('berkas-persyaratan')
            .download(filePath);
        if (error) {
            console.error(`Supabase download error for ${filePath}:`, error.message);
            return null;
        }
        if (!data) return null;
        return new Uint8Array(await data.arrayBuffer());
    } catch (e) {
        console.error(`Failed to fetch image ${filePath}:`, e);
        return null;
    }
}

/**
 * Fungsi gambar teks yang telah diperbaiki.
 * Ia memecah teks menjadi baris-baris terlebih dahulu, lalu melakukan wrapping per baris.
 * @returns Posisi Y (y-coordinate) setelah semua teks selesai digambar.
 */
function drawTextAndWrap(page: any, text: string, options: { x: number, y: number, font: PDFFont, size: number, lineHeight: number, maxWidth: number }): number {
    const { x, font, size, lineHeight, maxWidth } = options;
    let y = options.y;
    
    // 1. Pecah seluruh teks menjadi paragraf/baris berdasarkan newline character.
    const lines = text.split('\n');

    for (const line of lines) {
        // 2. Untuk setiap baris, lakukan word wrapping.
        const words = line.split(' ');
        let currentLine = '';
        
        if (words.length === 0 || line.trim() === '') {
            y -= lineHeight; // Jika baris kosong, hanya turunkan posisi Y
            continue;
        }

        for (const word of words) {
            const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
            const testWidth = font.widthOfTextAtSize(testLine, size);

            if (testWidth > maxWidth && currentLine.length > 0) {
                page.drawText(currentLine, { x, y, font, size, color: rgb(0, 0, 0) });
                y -= lineHeight;
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        // Gambar sisa baris terakhir
        page.drawText(currentLine, { x, y, font, size, color: rgb(0, 0, 0) });
        y -= lineHeight;
    }

    return y; // Kembalikan posisi Y terakhir
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

        if (!surat) return new Response(JSON.stringify({ message: "Surat tidak ditemukan." }), { status: 404 });
        if (!pengaturanDesa) return new Response(JSON.stringify({ message: "Pengaturan desa belum dikonfigurasi." }), { status: 404 });
        if (!surat.pengesah?.profile) return new Response(JSON.stringify({ message: "Data pengesah (Kepala Desa) tidak lengkap." }), { status: 404 });

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage(PageSizes.A4);
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        const margin = 70;
        let yPosition = height - margin;

        const logoBytes = await fetchImage(pengaturanDesa.logoDesaUrl);
        if (logoBytes) {
            const logoImage = await pdfDoc.embedPng(logoBytes);
            page.drawImage(logoImage, { x: margin, y: height - 120, width: 75, height: 75 });
        }

        const centerPos = width / 2;
        yPosition = height - 60;
        
        let text = `PEMERINTAH KABUPATEN ${pengaturanDesa.kabupaten?.toUpperCase()}`;
        let textWidth = boldFont.widthOfTextAtSize(text, 14);
        page.drawText(text, { x: centerPos - textWidth / 2, y: yPosition, font: boldFont, size: 14, color: rgb(0, 0, 0) });
        
        yPosition -= 20;
        text = `KECAMATAN ${pengaturanDesa.kecamatan?.toUpperCase()}`;
        textWidth = boldFont.widthOfTextAtSize(text, 16);
        page.drawText(text, { x: centerPos - textWidth / 2, y: yPosition, font: boldFont, size: 16, color: rgb(0, 0, 0) });
        
        yPosition -= 25;
        text = `KEPALA DESA ${pengaturanDesa.namaDesa?.toUpperCase()}`;
        textWidth = boldFont.widthOfTextAtSize(text, 20);
        page.drawText(text, { x: centerPos - textWidth / 2, y: yPosition, font: boldFont, size: 20, color: rgb(0, 0, 0) });

        yPosition -= 15;
        text = pengaturanDesa.alamatKantor;
        textWidth = font.widthOfTextAtSize(text, 10);
        page.drawText(text, { x: centerPos - textWidth / 2, y: yPosition, font: font, size: 10, color: rgb(0, 0, 0) });

        yPosition -= 10;
        page.drawLine({ start: { x: margin, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 3 });
        yPosition -= 50;

        const judulSurat = `SURAT KETERANGAN ${surat.template.namaSurat.toUpperCase()}`;
        const nomorSurat = `Nomor: ${surat.nomorSurat || '470/___/PEM'}`;
        const judulWidth = boldFont.widthOfTextAtSize(judulSurat, 14);
        const nomorWidth = font.widthOfTextAtSize(nomorSurat, 12);
        
        page.drawText(judulSurat, { x: (width - judulWidth) / 2, y: yPosition, font: boldFont, size: 14, color: rgb(0, 0, 0) });
        yPosition -= 15;
        page.drawLine({ start: { x: (width - judulWidth) / 2, y: yPosition }, end: { x: ((width - judulWidth) / 2) + judulWidth, y: yPosition }, thickness: 1 });
        yPosition -= 15;
        page.drawText(nomorSurat, { x: (width - nomorWidth) / 2, y: yPosition, font: font, size: 12, color: rgb(0, 0, 0) });
        yPosition -= 40;

        const allData = { ...(surat.pemohon.profile || {}), ...(surat.formData as any || {}) };

        let bodyText = surat.template.templateHtml
            .replace(/<p>.*?<\/p>/g, match => `${match.replace(/<\/?p>/g, '')}\n`)
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<strong>(.*?)<\/strong>/gi, '$1')
            .replace(/<em>(.*?)<\/em>/gi, '$1')
            .replace(/&nbsp;/g, ' ')
            .replace(/<[^>]+>/g, ''); // Hapus sisa tag HTML
        
        for (const [key, value] of Object.entries(allData)) {
            bodyText = bodyText.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }

        yPosition = drawTextAndWrap(page, bodyText, {
            x: margin,
            y: yPosition,
            font: font,
            size: 12,
            lineHeight: 18,
            maxWidth: width - (margin * 2),
        });

        const ttdBytes = await fetchImage(surat.pengesah.profile.urlTandaTangan);
        const stempelBytes = await fetchImage(surat.pengesah.profile.urlStempel);
        const namaKades = surat.pengesah.profile.namaLengkap;

        const ttdBlockX = width - margin - 250;
        let ttdY = yPosition > 250 ? yPosition - 30 : 250;
        
        page.drawText(`Dikeluarkan di: ${pengaturanDesa.namaDesa}`, { x: ttdBlockX, y: ttdY, font: font, size: 12 });
        page.drawText(`Pada tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, { x: ttdBlockX, y: ttdY - 15, font: font, size: 12 });
        page.drawText(`Kepala Desa ${pengaturanDesa.namaDesa},`, { x: ttdBlockX, y: ttdY - 45, font: boldFont, size: 12 });

        if (stempelBytes) {
            const stempelImage = await pdfDoc.embedPng(stempelBytes);
            page.drawImage(stempelImage, { x: ttdBlockX + 30, y: ttdY - 125, width: 100, height: 100, opacity: 0.75 });
        }
        if (ttdBytes) {
            const ttdImage = await pdfDoc.embedPng(ttdBytes);
            page.drawImage(ttdImage, { x: ttdBlockX + 25, y: ttdY - 100, width: 110, height: 55 });
        }
        
        const kadesText = namaKades.toUpperCase();
        const kadesTextWidth = boldFont.widthOfTextAtSize(kadesText, 12);
        page.drawText(kadesText, { x: ttdBlockX + (125 - kadesTextWidth) / 2, y: ttdY - 130, font: boldFont, size: 12 });
        page.drawLine({ start: { x: ttdBlockX + (125 - kadesTextWidth) / 2, y: ttdY - 132 }, end: { x: ttdBlockX + (125 - kadesTextWidth) / 2 + kadesTextWidth, y: ttdY - 132 }, thickness: 1 });

        const pdfBytes = await pdfDoc.save();
        const kodeSurat = surat.template.kodeSurat.trim();
        const nik = surat.pemohon.profile?.nik?.trim() || 'warga';
        const fileName = `surat-${kodeSurat}-${nik}.pdf`;

        return new Response(pdfBytes, {
            headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}"` },
        });

    } catch (error) {
        console.error("PDF_GENERATION_ERROR:", error);
        return new Response(JSON.stringify({ message: "Gagal membuat file PDF." }), { status: 500 });
    }
}