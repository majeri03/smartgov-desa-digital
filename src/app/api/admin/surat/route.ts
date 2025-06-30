// src/app/api/admin/surat/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // 1. Otorisasi Berbasis Peran: Keamanan adalah Prioritas
  if (!session || (session.user.role !== Role.STAF && session.user.role !== Role.KEPALA_DESA)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    // 2. Ambil semua data pengajuan, sertakan data pemohon
    const allSubmissions = await prisma.suratKeluar.findMany({
      // Di masa depan, kita bisa filter berdasarkan status, misal: { where: { status: 'PENDING' } }
      select: {
        id: true,
        status: true,
        createdAt: true,
        template: {
          select: { namaSurat: true },
        },
        pemohon: {
          select: {
            profile: {
              select: { namaLengkap: true, nik: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Tampilkan yang paling lama di atas untuk diproses lebih dulu
      },
    });

    return NextResponse.json(allSubmissions, { status: 200 });

  } catch (error) {
    console.error('API_ADMIN_GET_ALL_SURAT_ERROR:', error);
    return NextResponse.json(
      { message: 'Gagal mengambil daftar pengajuan surat.' },
      { status: 500 }
    );
  }
}