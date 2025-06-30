// src/app/api/kepala-desa/persetujuan/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // Keamanan Maksimal: Hanya KEPALA_DESA yang bisa mengakses endpoint ini
  if (session?.user.role !== Role.KEPALA_DESA) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const submissionsForApproval = await prisma.suratKeluar.findMany({
      where: {
        status: 'DIVERIFIKASI', // Hanya tampilkan yang sudah lolos verifikasi Staf
      },
      select: {
        id: true,
        createdAt: true,
        template: { select: { namaSurat: true } },
        pemohon: { select: { profile: { select: { namaLengkap: true } } } },
        verifikator: { select: { profile: { select: { namaLengkap: true } } } },
      },
      orderBy: {
        updatedAt: 'asc', // Tampilkan yang paling lama menunggu persetujuan
      },
    });

    return NextResponse.json(submissionsForApproval, { status: 200 });
  } catch (error) {
    console.error('API_KADES_GET_PERSETUJUAN_ERROR:', error);
    return NextResponse.json({ message: 'Gagal mengambil daftar persetujuan.' }, { status: 500 });
  }
}