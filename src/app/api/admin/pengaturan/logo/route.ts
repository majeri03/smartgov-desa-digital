// src/app/api/admin/pengaturan/logo/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== Role.STAF && session.user.role !== Role.KEPALA_DESA)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { logoUrl } = await request.json();
    if (typeof logoUrl !== 'string') {
      return NextResponse.json({ message: 'URL Logo tidak valid.' }, { status: 400 });
    }

    const pengaturan = await prisma.pengaturanDesa.upsert({
      where: { id: (await prisma.pengaturanDesa.findFirst())?.id || '' },
      update: { logoDesaUrl: logoUrl },
      create: {
        logoDesaUrl: logoUrl,
        // Menyediakan nilai default untuk field yang wajib diisi jika record baru dibuat
        namaDesa: 'Nama Desa Anda',
        kecamatan: 'Nama Kecamatan',
        kabupaten: 'Nama Kabupaten',
        provinsi: 'Nama Provinsi',
        alamatKantor: 'Alamat Kantor Desa',
      },
    });

    return NextResponse.json(pengaturan, { status: 200 });
  } catch (error) {
    console.error("LOGO_UPDATE_ERROR", error);
    return NextResponse.json({ message: 'Gagal menyimpan logo.' }, { status: 500 });
  }
}