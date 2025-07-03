// Lokasi: src/app/api/surat/unduh/[id]/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { authOptions } from '@/lib/auth.config';
import { getServerSession } from 'next-auth/next';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function getBase64Image(filePath: string | null): Promise<string | null> {
    if (!filePath) return null;
    try {
        const { data, error } = await supabaseAdmin.storage.from('berkas-persyaratan').download(filePath);
        if (error || !data) return null;
        const buffer = await data.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${data.type};base64,${base64}`;
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

function getBrowserConfig() {
    // Jika di Docker/production, gunakan Chrome yang terinstall sistem
    if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true') {
        return {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--no-first-run',
                '--no-default-browser-check'
            ]
        };
    }
    
    // Untuk development lokal, biarkan Puppeteer menggunakan bundled Chromium
    return {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });

    let browser;
    try {
        const [surat, pengaturanDesa] = await Promise.all([
            prisma.suratKeluar.findUnique({ where: { id }, include: { pemohon: { include: { profile: true } }, template: true, pengesah: { include: { profile: true } } } }),
            prisma.pengaturanDesa.findFirst()
        ]);
        
        if (!surat || !pengaturanDesa) {
            return new Response(JSON.stringify({ message: "Data surat atau pengaturan tidak lengkap." }), { status: 404 });
        }

        const allData = { 
            pemohon: surat.pemohon.profile, 
            form: surat.formData, 
            pengesah: surat.pengesah?.profile, 
            desa: pengaturanDesa,
            nomorSurat: surat.nomorSurat || '470/___/PEM',
            tanggalSurat: surat.tanggalSelesai ? 
                new Date(surat.tanggalSelesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 
                new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
        };
        
        const logoDesaBase64 = await getBase64Image(pengaturanDesa.logoDesaUrl || null);
        const ttdBase64 = await getBase64Image(surat.pengesah?.profile?.urlTandaTangan || null);
        const stempelBase64 = await getBase64Image(surat.pengesah?.profile?.urlStempel || null);
        
        const finalHtmlContent = replacePlaceholders(surat.template.templateHtml, allData);

        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; margin: 0; }
                    .page { width: 21cm; min-height: 29.7cm; padding: 2cm; margin: 0 auto; background: white; }
                    .kop-surat { text-align: center; border-bottom: 3px solid black; padding-bottom: 10px; position: relative; }
                    .kop-surat img.logo { position: absolute; left: 0; top: 0; width: 75px; height: 75px; }
                    .kop-surat h1, .kop-surat h2, .kop-surat h3, .kop-surat p { margin: 0; line-height: 1.2; }
                    .judul-surat { text-align: center; margin-top: 30px; margin-bottom: 30px; }
                    .judul-surat h4 { margin: 0; text-decoration: underline; }
                    .judul-surat p { margin-top: 5px; }
                    .isi-surat { text-align: justify; }
                    .isi-surat p, .isi-surat div { margin: 0 0 1em 0; }
                    .footer-container { margin-top: 50px; }
                    .blok-ttd { width: 40%; float: right; text-align: center; font-size: 12pt; }
                    .blok-ttd .ttd-space { height: 120px; position: relative; }
                    .blok-ttd .stempel { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px; opacity: 0.75; }
                    .blok-ttd .ttd { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 130px; height: 65px; }
                    .clear { clear: both; }
                </style>
            </head>
            <body>
                <div class="page">
                    <div class="kop-surat">
                        ${logoDesaBase64 ? `<img src="${logoDesaBase64}" class="logo" />` : ''}
                        <h3>PEMERINTAH KABUPATEN ${pengaturanDesa.kabupaten?.toUpperCase()}</h3>
                        <h2>KECAMATAN ${pengaturanDesa.kecamatan?.toUpperCase()}</h2>
                        <h1>KEPALA DESA ${pengaturanDesa.namaDesa?.toUpperCase()}</h1>
                        <p style="font-size: 10pt;">${pengaturanDesa.alamatKantor}</p>
                    </div>

                    <div class="judul-surat">
                        <h4>${surat.template.namaSurat.toUpperCase()}</h4>
                        <p>Nomor: ${allData.nomorSurat}</p>
                    </div>

                    <div class="isi-surat">
                        ${finalHtmlContent}
                    </div>

                    <div class="footer-container">
                        <div class="blok-ttd">
                            <p>Dikeluarkan di : Bonto Marannu</p>
                            <p>Pada tanggal : ${allData.tanggalSurat}</p>
                            <p>Kepala Desa ${pengaturanDesa.namaDesa},</p>
                            <div class="ttd-space">
                                ${stempelBase64 ? `<img src="${stempelBase64}" class="stempel" />` : ''}
                                ${ttdBase64 ? `<img src="${ttdBase64}" class="ttd" />` : ''}
                            </div>
                            <p style="font-weight: bold; text-decoration: underline;">${allData.pengesah?.namaLengkap || '...........................'}</p>
                            <p>NIP. ${allData.pengesah?.nik || '...........................'}</p>
                        </div>
                        <div class="clear"></div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Gunakan konfigurasi browser yang dinamis
        const browserConfig = getBrowserConfig();
        browser = await puppeteer.launch(browserConfig);
        
        const page = await browser.newPage();
        
        // Set viewport untuk konsistensi
        await page.setViewport({ width: 1200, height: 1600 });
        
        // Set content dengan timeout yang lebih panjang
        await page.setContent(fullHtml, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Generate PDF dengan opsi yang lebih komprehensif
        const pdfBytes = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0.5cm',
                right: '0.5cm',
                bottom: '0.5cm',
                left: '0.5cm'
            },
            preferCSSPageSize: true
        });

        const fileName = `surat-${surat.template.kodeSurat}-${surat.pemohon.profile?.nik}.pdf`;
        
        return new Response(pdfBytes, { 
            headers: { 
                'Content-Type': 'application/pdf', 
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Cache-Control': 'no-cache'
            } 
        });

    } catch (error) {
        // Menangani error dengan type-safe approach
        console.error("PDF_GENERATION_ERROR:", error);
        
        // Mengkonversi error ke format yang aman untuk logging dan response
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        // Log detail error untuk debugging (hanya di development)
        if (process.env.NODE_ENV === 'development') {
            console.error("Error stack:", errorStack);
        }
        
        return new Response(
            JSON.stringify({ 
                message: "Gagal membuat file PDF.", 
                error: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
            }), 
            { status: 500 }
        );
    } finally {
        // Pastikan browser ditutup bahkan jika terjadi error
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error("Error closing browser:", closeError);
            }
        }
    }
}