// src/app/api/surat/templates/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // 1. Proteksi Endpoint: Pastikan hanya user yang sudah login yang bisa akses
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Ambil data dari database
    const templates = await prisma.templateSurat.findMany({
      where: {
        isActive: true, // Hanya ambil template yang aktif
      },
      select: { // Hanya pilih data yang dibutuhkan oleh frontend
        id: true,
        kodeSurat: true,
        namaSurat: true,
        deskripsi: true,
        persyaratan: true,
      },
      orderBy: {
        namaSurat: 'asc', // Urutkan berdasarkan nama
      },
    });

    // 3. Kembalikan data sebagai respons JSON
    return NextResponse.json(templates, { status: 200 });

  } catch (error) {
    console.error('API_TEMPLATES_ERROR:', error);
    return NextResponse.json(
      { message: 'Gagal mengambil data template surat.' },
      { status: 500 }
    );
  }
}