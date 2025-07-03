// src/app/api/surat/berkas/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { suratId, filePath } = await request.json();
    if (!suratId || !filePath) {
      return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
    }

    // Ambil data surat untuk memastikan pengguna adalah pemiliknya
    const surat = await prisma.suratKeluar.findUnique({
      where: { id: suratId },
      select: { pemohonId: true },
    });

    if (!surat || surat.pemohonId !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Tambahkan path file baru ke array filePersyaratan
    await prisma.suratKeluar.update({
      where: { id: suratId },
      data: {
        filePersyaratan: {
          push: filePath,
        },
      },
    });

    return NextResponse.json({ message: 'Berkas berhasil dicatat.' }, { status: 200 });
  } catch (error) {
    console.error('API_UPDATE_BERKAS_ERROR:', error);
    return NextResponse.json({ message: 'Gagal mencatat berkas.' }, { status: 500 });
  }
}