// src/app/api/admin/pengaturan/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Fungsi GET untuk mengambil pengaturan desa saat ini
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== Role.STAF && session.user.role !== Role.KEPALA_DESA)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  try {
    const pengaturan = await prisma.pengaturanDesa.findFirst();
    return NextResponse.json(pengaturan, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil pengaturan.' }, { status: 500 });
  }
}

// Fungsi POST untuk membuat atau memperbarui pengaturan desa
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== Role.STAF && session.user.role !== Role.KEPALA_DESA)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await request.json();

    // Menggunakan 'upsert' untuk efisiensi:
    // Coba cari record pertama, jika ada, perbarui. Jika tidak ada, buat baru.
    const pengaturan = await prisma.pengaturanDesa.upsert({
      where: { id: (await prisma.pengaturanDesa.findFirst())?.id || '' },
      update: body,
      create: body,
    });

    return NextResponse.json(pengaturan, { status: 200 });
  } catch (error) {
    console.error("PENGATURAN_UPDATE_ERROR", error);
    return NextResponse.json({ message: 'Gagal menyimpan pengaturan.' }, { status: 500 });
  }
}