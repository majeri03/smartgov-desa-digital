// src/app/api/surat/pengajuan/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'ID Pengajuan diperlukan.' }, { status: 400 });
  }

  try {
    const surat = await prisma.suratKeluar.findUnique({
      where: { id },
      include: {
        template: {
          select: { namaSurat: true },
        },
        pemohon: {
          select: { profile: { select: { namaLengkap: true, nik: true } } },
        },
        riwayat: {
          orderBy: { timestamp: 'asc' },
          include: { aktor: { select: { profile: { select: { namaLengkap: true } } } } },
        },
      },
    });

    if (!surat) {
      return NextResponse.json({ message: 'Pengajuan tidak ditemukan.' }, { status: 404 });
    }

    // --- Aturan Akses Profesional ---
    // Izinkan akses jika:
    // 1. Pengguna adalah pemohon surat tersebut.
    // 2. Pengguna adalah STAF atau KEPALA_DESA.
    const isOwner = surat.pemohonId === session.user.id;
    const isAdmin = session.user.role === Role.STAF || session.user.role === Role.KEPALA_DESA;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(surat, { status: 200 });
  } catch (error) {
    console.error(`API_GET_SURAT_DETAIL_ERROR (ID: ${id}):`, error);
    return NextResponse.json({ message: 'Gagal mengambil data pengajuan.' }, { status: 500 });
  }
}