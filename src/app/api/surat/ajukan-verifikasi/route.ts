// src/app/api/surat/ajukan-verifikasi/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, StatusSurat } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { suratId } = await request.json();
    const surat = await prisma.suratKeluar.findFirst({
      where: { id: suratId, pemohonId: session.user.id },
      include: { template: true },
    });

    if (!surat) return NextResponse.json({ message: 'Pengajuan tidak ditemukan.' }, { status: 404 });
    if (surat.status !== 'MENGISI_BERKAS') return NextResponse.json({ message: 'Status tidak valid.' }, { status: 400 });
    if (surat.filePersyaratan.length !== surat.template.persyaratan.length) {
      return NextResponse.json({ message: 'Berkas belum lengkap.' }, { status: 400 });
    }

    const updatedSurat = await prisma.suratKeluar.update({
      where: { id: suratId },
      data: { status: 'PENDING' },
    });

    await prisma.logAktivitas.create({
      data: {
        aksi: 'MENGAJUKAN_VERIFIKASI',
        deskripsi: `Warga (${session.user.email}) telah melengkapi berkas dan mengajukan verifikasi.`,
        aktorId: session.user.id,
        suratKeluarId: surat.id,
      },
    });

    return NextResponse.json(updatedSurat, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengajukan verifikasi.' }, { status: 500 });
  }
}