import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Inisialisasi Supabase dengan kunci service role untuk akses di server
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Fungsi ini sekarang berjalan di server dan mengambil gambar langsung dari Supabase
const fetchImageAsBase64 = async (filePath: string | null): Promise<string | null> => {
    if (!filePath) return null;
    try {
        const { data, error } = await supabaseAdmin.storage
            .from('berkas-persyaratan') // Pastikan nama bucket ini benar
            .download(filePath);

        if (error || !data) {
            throw new Error(`Gagal mengunduh file dari Supabase: ${error?.message || 'File tidak ditemukan'}`);
        }

        const buffer = await data.arrayBuffer();
        const contentType = data.type || 'image/png';
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${contentType};base64,${base64}`;
    } catch (err) {
        console.error(`Gagal mengambil gambar dari Supabase: ${filePath}`, err);
        return null;
    }
};

const createKopSuratHtml = (pengaturan: any, logoBase64: string | null) => {
  const logoTag = logoBase64 ? `<img src="${logoBase64}" style="width: 75px; height: 75px; margin-right: 20px;" />` : '';
  return `
    <div style="display: flex; align-items: center; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 20px;">
      ${logoTag}
      <div style="text-align: center; width: 100%;">
        <p style="margin: 0; font-size: 16px; font-weight: bold;">PEMERINTAH KABUPATEN ${pengaturan.kabupaten?.toUpperCase() || ''}</p>
        <p style="margin: 0; font-size: 18px; font-weight: bold;">KECAMATAN ${pengaturan.kecamatan?.toUpperCase() || ''}</p>
        <p style="margin: 0; font-size: 24px; font-weight: bold;">KEPALA DESA ${pengaturan.namaDesa?.toUpperCase() || ''}</p>
        <p style="margin: 0; font-size: 12px;">${pengaturan.alamatKantor || ''}</p>
      </div>
    </div>
  `;
};

const createTtdHtml = (pengesah: any, pengaturan: any, ttdBase64: string | null, stempelBase64: string | null) => {
    const ttdTag = ttdBase64 ? `<img src="${ttdBase64}" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 100px; height: auto;" />` : '';
    const stempelTag = stempelBase64 ? `<img src="${stempelBase64}" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 110px; height: auto; opacity: 0.7;" />` : '';
    const namaKades = pengesah?.profile?.namaLengkap || '(Nama Kepala Desa)';

  return `
    <div style="width: 250px; margin-left: auto; margin-top: 30px; text-align: center; font-size: 14px; page-break-inside: avoid;">
      <p style="margin: 0;">${pengaturan.namaDesa}, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
      <p style="margin: 0;">Kepala Desa ${pengaturan.namaDesa},</p>
      <div style="position: relative; height: 120px; margin-top: 5px;">
        ${stempelTag}
        ${ttdTag}
      </div>
      <p style="font-weight: bold; text-decoration: underline; margin: 0;">${namaKades}</p>
    </div>
  `;
};



export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    const [surat, pengaturanDesa] = await Promise.all([
      prisma.suratKeluar.findUnique({ where: { id }, include: { pemohon: { include: { profile: true } }, template: true, pengesah: { include: { profile: true } } } }),
      prisma.pengaturanDesa.findFirst()
    ]);

    if (!surat || !pengaturanDesa || !surat.pengesah?.profile) {
      return new Response(JSON.stringify({ message: 'Data penting tidak lengkap.' }), { status: 404 });
    }

    const [logoBase64, ttdBase64, stempelBase64] = await Promise.all([
      fetchImageAsBase64(pengaturanDesa.logoDesaUrl),
      fetchImageAsBase64(surat.pengesah.profile.urlTandaTangan),
      fetchImageAsBase64(surat.pengesah.profile.urlStempel)
    ]);
    
    let htmlBody = surat.template.templateHtml;
    const allData = { ...(surat.pemohon.profile || {}), ...(surat.formData as any || {}) };
    for (const [key, value] of Object.entries(allData)) {
      if (value !== null && value !== undefined) {
        htmlBody = htmlBody.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
    }

    const fullHtml = `
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; }
            .page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; background-color: white; }
          </style>
        </head>
        <body>
          <div class="page">
            ${createKopSuratHtml(pengaturanDesa, logoBase64)}
            ${htmlBody}
            ${createTtdHtml(surat.pengesah, pengaturanDesa, ttdBase64, stempelBase64)}
          </div>
        </body>
      </html>
    `;

    return NextResponse.json({ html: fullHtml, fileName: `surat-${surat.template.kodeSurat}-${surat.pemohon.profile?.nik}.pdf` });

  } catch (error) {
    console.error("HTML_GENERATION_ERROR", error);
    return new Response(JSON.stringify({ message: 'Gagal menyusun HTML surat.' }), { status: 500 });
  }
}