// src/app/api/admin/verifikasi/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Fungsi GET untuk mengambil detail lengkap pengajuan
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== Role.STAF && session.user.role !== Role.KEPALA_DESA)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const surat = await prisma.suratKeluar.findUnique({
      where: { id: id }, 
      include: {
        template: true,
        pemohon: { include: { profile: true } },
      },
    });

    if (!surat) {
      return NextResponse.json({ message: 'Pengajuan tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(surat, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data.' }, { status: 500 });
  }
}

// Fungsi PUT untuk memproses verifikasi (Setuju/Tolak)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== Role.STAF && session.user.role !== Role.KEPALA_DESA)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { action, catatanRevisi } = await request.json();
    const { id } = await params;

    if (!action || (action === 'TOLAK' && !catatanRevisi)) {
      return NextResponse.json({ message: 'Aksi atau catatan revisi tidak lengkap.' }, { status: 400 });
    }

    const newStatus = action === 'SETUJU' ? 'DIVERIFIKASI' : 'DITOLAK';
    const logAksi = action === 'SETUJU' ? 'VERIFIKASI_DISETUJUI' : 'VERIFIKASI_DITOLAK';
    const logDeskripsi = action === 'SETUJU' 
        ? `Pengajuan diverifikasi dan disetujui oleh ${session.user.email}.`
        : `Pengajuan ditolak oleh ${session.user.email} dengan alasan: ${catatanRevisi}`;

    const updatedSurat = await prisma.$transaction(async (tx) => {
      const surat = await tx.suratKeluar.update({
        where: { id },
        data: {
          status: newStatus,
          catatanRevisi: action === 'TOLAK' ? catatanRevisi : null,
          verifikatorId: session.user.id,
        },
      });

      await tx.logAktivitas.create({
        data: {
          aksi: logAksi,
          deskripsi: logDeskripsi,
          aktorId: session.user.id,
          suratKeluarId: surat.id,
        },
      });
      return surat;
    });

    return NextResponse.json(updatedSurat, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Gagal memproses verifikasi.' }, { status: 500 });
  }
}