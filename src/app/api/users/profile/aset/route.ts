// src/app/api/users/profile/aset/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('[API /profile/aset] Request Body:', body); // Log 1: Lihat data yang masuk

    const dataToUpdate: { urlTandaTangan?: string; urlStempel?: string, urlFotoProfil?: string } = {};
    if (body.urlTandaTangan) dataToUpdate.urlTandaTangan = body.urlTandaTangan;
    if (body.urlStempel) dataToUpdate.urlStempel = body.urlStempel;
    if (body.urlFotoProfil) dataToUpdate.urlFotoProfil = body.urlFotoProfil;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: 'Tidak ada data aset yang valid untuk diperbarui.' }, { status: 400 });
    }

    console.log('[API /profile/aset] Data to update:', dataToUpdate); // Log 2: Lihat data yang akan disimpan

    const updatedProfile = await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: dataToUpdate,
    });

    console.log('[API /profile/aset] Update Success:', updatedProfile); // Log 3: Konfirmasi update berhasil

    return NextResponse.json({ message: 'Aset profil berhasil diperbarui.' }, { status: 200 });

  } catch (error) {
    console.error("PROFILE_ASSET_UPDATE_ERROR:", error);
    return NextResponse.json({ message: 'Gagal memperbarui aset profil di database.' }, { status: 500 });
  }
}