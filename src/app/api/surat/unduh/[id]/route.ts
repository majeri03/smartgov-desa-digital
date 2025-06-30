import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

const createKopSuratHtml = (pengaturan: any) => {
  const logoUrl = pengaturan.logoDesaUrl || 'https://placehold.co/100x100?text=Logo';
  return `
    <div style="display: flex; align-items: center; border-bottom: 4px double black; padding-bottom: 15px; margin-bottom: 30px;">
      <img src="${logoUrl}" alt="Logo Desa" style="width: 80px; height: auto; margin-right: 20px;" />
      <div style="text-align: center; width: 100%;">
        <p style="margin: 0; font-size: 16px; font-weight: bold;">PEMERINTAH KABUPATEN ${pengaturan.kabupaten?.toUpperCase() || ''}</p>
        <p style="margin: 0; font-size: 16px; font-weight: bold;">KECAMATAN ${pengaturan.kecamatan?.toUpperCase() || ''}</p>
        <p style="margin: 0; font-size: 22px; font-weight: bold;">KEPALA DESA ${pengaturan.namaDesa?.toUpperCase() || ''}</p>
        <p style="margin: 0; font-size: 12px;">${pengaturan.alamatKantor || ''}</p>
      </div>
    </div>
  `;
};

const createTtdHtml = (pengesah: any, pengaturan: any) => {
  const ttdUrl = pengesah?.profile?.urlTandaTangan || 'https://placehold.co/150x80?text=TTD';
  const stempelUrl = pengesah?.profile?.urlStempel || 'https://placehold.co/120x120?text=Stempel';
  const namaKades = pengesah?.profile?.namaLengkap || '(Nama Kepala Desa)';

  return `
    <div style="width: 300px; margin-left: auto; margin-top: 50px; text-align: center; font-size: 14px;">
      <p style="margin: 0;">${pengaturan.namaDesa}, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
      <p style="margin: 0;">Kepala Desa ${pengaturan.namaDesa},</p>
      <div style="position: relative; height: 120px; margin-top: 10px;">
        <img src="${stempelUrl}" alt="Stempel" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 110px; height: auto; opacity: 0.7;" />
        <img src="${ttdUrl}" alt="Tanda Tangan" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 100px; height: auto;" />
      </div>
      <p style="font-weight: bold; text-decoration: underline; margin: 0;">${namaKades}</p>
    </div>
    <div style="clear: both;"></div>
  `;
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;

  try {
    const [surat, pengaturanDesa] = await Promise.all([
      prisma.suratKeluar.findUnique({
        where: { id },
        include: { 
          pemohon: { include: { profile: true } }, 
          template: true,
          pengesah: { include: { profile: true } }
        }
      }),
      prisma.pengaturanDesa.findFirst()
    ]);

    if (!surat) {
      return new Response(JSON.stringify({ message: 'Pengajuan surat tidak ditemukan.' }), { status: 404 });
    }
    if (!pengaturanDesa) {
        return new Response(JSON.stringify({ message: 'Pengaturan desa belum diatur.' }), { status: 404 });
    }

    const isOwner = surat.pemohonId === session.user.id;
    const isAdmin = session.user.role === Role.STAF || session.user.role === Role.KEPALA_DESA;
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
    }
    
    if (surat.status !== 'DISETUJUI' && surat.status !== 'SELESAI') {
      return new Response(JSON.stringify({ message: 'Surat belum disetujui untuk diterbitkan.' }), { status: 400 });
    }

    if (!surat.pengesah) {
        return new Response(JSON.stringify({ message: 'Surat belum memiliki pengesah (Kepala Desa).' }), { status: 400 });
    }

    let htmlContent = surat.template.templateHtml;
    const profileData = surat.pemohon.profile || {};
    const formData = surat.formData as any || {};
    const allData = { ...profileData, ...formData };
    
    for (const [key, value] of Object.entries(allData)) {
      if (value !== null && value !== undefined) {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
    }

    const finalHtml = `
      <html>
        <head>
          <style>
            body { 
              font-family: 'Times New Roman', Times, serif; 
              font-size: 12pt;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          ${createKopSuratHtml(pengaturanDesa)}
          ${htmlContent}
          ${createTtdHtml(surat.pengesah, pengaturanDesa)}
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ 
        format: 'A4', 
        printBackground: true,
        margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' } 
    });
    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="surat-${surat.template.kodeSurat}-${surat.pemohon.profile?.nik}.pdf"`,
      },
    });

  } catch (error) {
    console.error("PDF_GENERATION_ERROR", error);
    return new Response(JSON.stringify({ message: 'Gagal membuat file PDF.' }), { status: 500 });
  }
}
