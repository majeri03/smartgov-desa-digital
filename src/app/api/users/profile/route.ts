// src/app/api/users/profile/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        namaLengkap: true,
        nik: true,
        nomorTelepon: true,
        alamatKTP: true,
        urlTandaTangan: true, // Tambahkan baris ini
        urlStempel: true,     // Tambahkan baris ini
        urlFotoProfil: true,
        // Tambahkan field lain yang mungkin relevan untuk pra-isi
      },
    });

    if (!userProfile) {
      return NextResponse.json({ message: 'Profil pengguna tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(userProfile, { status: 200 });

  } catch (error) {
    console.error('API_GET_PROFILE_ERROR:', error);
    return NextResponse.json(
      { message: 'Gagal mengambil data profil.' },
      { status: 500 }
    );
  }
}