// src/app/api/surat/unduh/[id]/route.ts (Final - Perbaikan Manajemen Halaman)
import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getServerSession } from 'next-auth/next';
import { PDFDocument, rgb, StandardFonts, PageSizes, PDFFont, PDFPage } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Fungsi fetchImage dan replacePlaceholders tidak ada perubahan
async function fetchImage(filePath: string | null): Promise<Uint8Array | null> {
    if (!filePath) return null;
    try {
        const { data, error } = await supabaseAdmin.storage.from('berkas-persyaratan').download(filePath);
        if (error) return null;
        return data ? new Uint8Array(await data.arrayBuffer()) : null;
    } catch (e) {
        return null;
    }
}

function replacePlaceholders(text: string, data: Record<string, any>): string {
    return text.replace(/{{(.*?)}}/g, (match, key) => {
        const keys = key.trim().split('.');
        let value: any = data;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else { return '-'; }
        }
        return String(value ?? '-');
    });
}

// --- Kelas PDFTextRenderer yang Direvisi ---
class PDFTextRenderer {
    public page: PDFPage;
    public y: number;
    private doc: PDFDocument;
    private font: PDFFont;
    private margin: number;
    private lineHeight: number;
    private fontSize: number;
    private pageHeight: number;

    constructor(doc: PDFDocument, initialPage: PDFPage, font: PDFFont, margin: number, fontSize: number, lineHeight: number) {
        this.doc = doc;
        this.page = initialPage;
        this.font = font;
        this.margin = margin;
        this.fontSize = fontSize;
        this.lineHeight = lineHeight;
        this.pageHeight = this.page.getSize().height;
        this.y = this.pageHeight - this.margin;
    }

    public newPage() {
        this.page = this.doc.addPage(PageSizes.A4);
        this.pageHeight = this.page.getSize().height;
        this.y = this.pageHeight - this.margin;
    }

    private checkPageBreak(neededHeight: number) {
        if (this.y - neededHeight < this.margin) {
            this.newPage();
        }
    }
    
    private cleanText(text: string): string {
        return text
            .replace(/<\/p>/gi, '</p>\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/&nbsp;/g, ' ')
            .replace(/<[^>]+>/g, '')
            .trim();
    }
    
    private drawWrappedText(text: string, x: number, maxWidth: number) {
        const words = text.split(' ');
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (this.font.widthOfTextAtSize(testLine, this.fontSize) > maxWidth) {
                this.checkPageBreak(this.lineHeight);
                this.page.drawText(currentLine, { x, y: this.y, font: this.font, size: this.fontSize });
                this.y -= this.lineHeight;
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        this.checkPageBreak(this.lineHeight);
        this.page.drawText(currentLine, { x, y: this.y, font: this.font, size: this.fontSize });
        this.y -= this.lineHeight;
    }

    public draw(text: string) {
        const cleanedText = this.cleanText(text);
        const lines = cleanedText.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine === '') {
                this.checkPageBreak(this.lineHeight * 0.5);
                this.y -= this.lineHeight * 0.5;
                continue;
            }

            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex > 0 && colonIndex < 35) {
                const key = trimmedLine.substring(0, colonIndex).trim();
                const value = trimmedLine.substring(colonIndex + 1).trim();
                this.checkPageBreak(this.lineHeight);
                this.page.drawText(key, { x: this.margin, y: this.y, font: this.font, size: this.fontSize });
                this.page.drawText(':', { x: this.margin + 120, y: this.y, font: this.font, size: this.fontSize });
                this.drawWrappedText(value, this.margin + 130, this.page.getSize().width - (this.margin * 2) - 130);
            } else {
                this.drawWrappedText(trimmedLine, this.margin, this.page.getSize().width - (this.margin * 2));
            }
        }
    }
}

// --- Fungsi GET Utama yang Direvisi ---
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });

    try {
        const [surat, pengaturanDesa] = await Promise.all([
            prisma.suratKeluar.findUnique({ where: { id }, include: { pemohon: { include: { profile: true } }, template: true, pengesah: { include: { profile: true } } } }),
            prisma.pengaturanDesa.findFirst()
        ]);
        if (!surat || !pengaturanDesa || !surat.pengesah?.profile) return new Response(JSON.stringify({ message: "Data surat atau pengaturan tidak lengkap." }), { status: 404 });

        const pdfDoc = await PDFDocument.create();
        const firstPage = pdfDoc.addPage(PageSizes.A4); // Buat halaman pertama secara eksplisit
        const { width, height } = firstPage.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        const margin = 70;

        // Gambar KOP di halaman pertama
        const logoBytes = await fetchImage(pengaturanDesa.logoDesaUrl);
        if (logoBytes) {
            const logoImage = await pdfDoc.embedPng(logoBytes);
            firstPage.drawImage(logoImage, { x: margin, y: height - 120, width: 75, height: 75 });
        }
        const headerTexts = [
            { text: `PEMERINTAH KABUPATEN ${pengaturanDesa.kabupaten?.toUpperCase()}`, font: boldFont, size: 14, yOffset: height - 60 },
            { text: `KECAMATAN ${pengaturanDesa.kecamatan?.toUpperCase()}`, font: boldFont, size: 16, yOffset: height - 80 },
            { text: `KEPALA DESA ${pengaturanDesa.namaDesa?.toUpperCase()}`, font: boldFont, size: 20, yOffset: height - 105 },
            { text: pengaturanDesa.alamatKantor, font: font, size: 10, yOffset: height - 120 },
        ];
        for (const item of headerTexts) {
            const textWidth = item.font.widthOfTextAtSize(item.text, item.size);
            firstPage.drawText(item.text, { x: (width - textWidth) / 2, y: item.yOffset, font: item.font, size: item.size });
        }
        firstPage.drawLine({ start: { x: margin, y: height - 130 }, end: { x: width - margin, y: height - 130 }, thickness: 3 });

        // Gambar Judul di halaman pertama
        let startY = height - 180;
        const judulSurat = surat.template.namaSurat.toUpperCase();
        firstPage.drawText(judulSurat, { x: (width - boldFont.widthOfTextAtSize(judulSurat, 14)) / 2, y: startY, font: boldFont, size: 14 });
        startY -= 15;
        firstPage.drawLine({ start: { x: (width - boldFont.widthOfTextAtSize(judulSurat, 14)) / 2, y: startY }, end: { x: ((width - boldFont.widthOfTextAtSize(judulSurat, 14)) / 2) + boldFont.widthOfTextAtSize(judulSurat, 14), y: startY }, thickness: 1 });
        startY -= 15;
        const nomorSurat = `Nomor: ${surat.nomorSurat || '470/___/PEM'}`;
        firstPage.drawText(nomorSurat, { x: (width - font.widthOfTextAtSize(nomorSurat, 12)) / 2, y: startY, font: font, size: 12 });

        // Inisialisasi renderer dengan halaman pertama yang sudah ada
        const renderer = new PDFTextRenderer(pdfDoc, firstPage, font, margin, 12, 18);
        renderer.y = startY - 40; // Set posisi Y awal untuk konten

        const allData = { pemohon: surat.pemohon.profile, form: surat.formData, pengesah: surat.pengesah.profile, desa: pengaturanDesa, nomorSurat: surat.nomorSurat || '470/___/PEM', tanggalSurat: surat.tanggalSelesai ? new Date(surat.tanggalSelesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '' };
        
        // Logika untuk TTD tetap sama
        const ttdPlaceholder = /\{\{blok_ttd\}\}/;
        const hasTtdBlock = ttdPlaceholder.test(surat.template.templateHtml);
        const finalContent = replacePlaceholders(surat.template.templateHtml.replace(ttdPlaceholder, ''), allData);
        
        renderer.draw(finalContent); // Gambar semua konten

        if (hasTtdBlock) {
             const ttdBytes = await fetchImage(surat.pengesah.profile.urlTandaTangan);
             const stempelBytes = await fetchImage(surat.pengesah.profile.urlStempel);
             
             let pageForTtd = renderer.page;
             let yForTtd = renderer.y;
             
             if (yForTtd < margin + 180) {
                 renderer.newPage(); 
                 pageForTtd = renderer.page;
                 yForTtd = renderer.y;
             }
             
             const signatureX = pageForTtd.getSize().width - margin - 200;
             if (stempelBytes) {
                const stempelImage = await pdfDoc.embedPng(stempelBytes);
                pageForTtd.drawImage(stempelImage, { x: signatureX + 40, y: yForTtd, width: 120, height: 120, opacity: 0.75 });
            }
            if (ttdBytes) {
                const ttdImage = await pdfDoc.embedPng(ttdBytes);
                pageForTtd.drawImage(ttdImage, { x: signatureX + 35, y: yForTtd + 20, width: 130, height: 65 });
            }
        }
        
        const pdfBytes = await pdfDoc.save();
        const fileName = `surat-${surat.template.kodeSurat}-${surat.pemohon.profile?.nik}.pdf`;
        return new Response(pdfBytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}"` } });
    } catch (error) {
        console.error("PDF_GENERATION_ERROR:", error);
        return new Response(JSON.stringify({ message: "Gagal membuat file PDF." }), { status: 500 });
    }
}