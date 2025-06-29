// src/app/api/surat/pengajuan/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // 1. Ambil sesi pengguna untuk otentikasi dan otorisasi
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { templateId, formData } = await request.json();

    if (!templateId || !formData) {
      return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
    }

    // 2. Gunakan Transaksi Prisma untuk menjamin semua operasi berhasil atau gagal bersamaan
    const pengajuanBaru = await prisma.$transaction(async (tx) => {
      // Buat entri SuratKeluar yang baru
      const surat = await tx.suratKeluar.create({
        data: {
          status: 'PENDING',
          formData: formData,
          template: {
            connect: { id: templateId },
          },
          pemohon: {
            connect: { id: session.user.id },
          },
          // filePersyaratan akan diisi di langkah selanjutnya setelah upload
          filePersyaratan: [], 
        },
      });

      // Buat Log Aktivitas pertama untuk pengajuan ini
      await tx.logAktivitas.create({
        data: {
          aksi: 'MEMBUAT_PENGAJUAN',
          deskripsi: `Warga (${session.user.email}) mengajukan surat "${surat.id}".`,
          aktor: {
            connect: { id: session.user.id },
          },
          suratKeluar: {
            connect: { id: surat.id },
          },
        },
      });

      return surat;
    });

    return NextResponse.json(
      { message: 'Pengajuan berhasil dibuat!', data: pengajuanBaru },
      { status: 201 }
    );

  } catch (error) {
    console.error('API_PENGAJUAN_ERROR:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat membuat pengajuan.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const daftarPengajuan = await prisma.suratKeluar.findMany({
      where: {
        pemohonId: session.user.id, // HANYA ambil data milik user yang login
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        template: {
          select: { namaSurat: true },
        },
      },
      orderBy: {
        createdAt: 'desc', // Tampilkan yang terbaru di atas
      },
    });

    return NextResponse.json(daftarPengajuan, { status: 200 });
  } catch (error) {
    console.error('API_GET_DAFTAR_PENGAJUAN_ERROR:', error);
    return NextResponse.json({ message: 'Gagal mengambil riwayat pengajuan.' }, { status: 500 });
  }
}