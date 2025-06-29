// prisma/seed.ts
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const templates = [
    {
      kodeSurat: 'SKD',
      namaSurat: 'Surat Keterangan Domisili',
      deskripsi: 'Surat untuk menerangkan tempat tinggal atau domisili warga.',
      persyaratan: ['Fotokopi KTP', 'Fotokopi KK', 'Surat Pengantar RT/RW', 'Pas Foto 3x4'],
      templateHtml: '<h1>Surat Keterangan Domisili</h1><p>Nama: {{namaLengkap}}</p><p>NIK: {{nik}}</p><p>Tujuan: {{tujuan_pembuatan_surat}}</p>',
      formSchema: [
        { name: 'tujuan_pembuatan_surat', label: 'Tujuan Pembuatan Surat', type: 'textarea', placeholder: 'Contoh: Untuk melamar pekerjaan' },
        { name: 'alamat_lengkap_tujuan', label: 'Alamat Lengkap Tujuan', type: 'textarea', placeholder: 'Alamat perusahaan/instansi yang dituju' },
      ]
    },
    {
      kodeSurat: 'SKTM',
      namaSurat: 'Surat Keterangan Tidak Mampu (SKTM)',
      deskripsi: 'Surat sebagai bukti bahwa warga tergolong keluarga kurang mampu.',
      persyaratan: ['Fotokopi KTP', 'Fotokopi KK', 'Surat Pengantar RT/RW'],
      templateHtml: '<h1>Surat Keterangan Tidak Mampu</h1><p>Nama: {{namaLengkap}}</p><p>NIK: {{nik}}</p><p>Digunakan untuk: {{keperluan_sktm}}</p>',
      formSchema: [
        { name: 'keperluan_sktm', label: 'Keperluan SKTM', type: 'text', placeholder: 'Contoh: Pengajuan Beasiswa Anak' },
        { name: 'penghasilan_rata_rata', label: 'Penghasilan Rata-rata/Bulan', type: 'number', placeholder: '500000' }
      ]
    },
    {
      kodeSurat: 'SPN',
      namaSurat: 'Surat Pengantar Nikah',
      deskripsi: 'Surat pengantar dari desa untuk keperluan administrasi pernikahan di KUA.',
      persyaratan: ['Fotokopi KTP calon mempelai', 'Fotokopi KK', 'SKBM'],
      templateHtml: '<h1>Surat Pengantar Nikah</h1><p>Nama: {{namaLengkap}}</p><p>NIK: {{nik}}</p>',
      formSchema: [
        { name: 'nama_calon_pasangan', label: 'Nama Calon Pasangan', type: 'text' },
        { name: 'nik_calon_pasangan', label: 'NIK Calon Pasangan', type: 'text' }
      ]
    },
    {
      kodeSurat: 'IUMK',
      namaSurat: 'Surat Izin Usaha Mikro Kecil (IUMK)',
      deskripsi: 'Surat izin untuk warga yang ingin menjalankan usaha skala mikro dan kecil.',
      persyaratan: ['Surat Pengantar RT/RW', 'Salinan NPWP', 'Proyeksi Usaha'],
      templateHtml: '<h1>Surat Izin Usaha Mikro Kecil</h1><p>Nama: {{namaLengkap}}</p><p>NIK: {{nik}}</p>',
      formSchema: [
        { name: 'nama_usaha', label: 'Nama Usaha', type: 'text' },
        { name: 'jenis_usaha', label: 'Jenis Usaha', type: 'text', placeholder: 'Contoh: Kuliner, Jasa, Perdagangan' },
        { name: 'alamat_usaha', label: 'Alamat Tempat Usaha', type: 'textarea' },
      ]
    }
  ];

  for (const template of templates) {
    await prisma.templateSurat.upsert({
      where: { kodeSurat: template.kodeSurat },
      update: {
        deskripsi: template.deskripsi,
        persyaratan: template.persyaratan,
        templateHtml: template.templateHtml,
        formSchema: template.formSchema,
      },
      create: template,
    });
  }

  console.log('Seeding finished.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});