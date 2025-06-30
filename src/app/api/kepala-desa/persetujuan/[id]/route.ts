// src/app/api/kepala-desa/persetujuan/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Role, StatusSurat } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Fungsi GET untuk mengambil detail lengkap surat yang sudah diverifikasi
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== Role.KEPALA_DESA) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = params; // Ekstrak id di sini
    const surat = await prisma.suratKeluar.findFirst({
    where: { 
        id: id, // Gunakan variabel id
        status: 'DIVERIFIKASI',
    },
      include: {
        template: true,
        pemohon: { include: { profile: true } },
        verifikator: { include: { profile: true } },
      },
    });

    if (!surat) {
      return NextResponse.json({ message: 'Pengajuan untuk persetujuan tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(surat, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data.' }, { status: 500 });
  }
}

// Fungsi PUT untuk memproses persetujuan atau penolakan final
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== Role.KEPALA_DESA) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { action, catatanPenolakan } = await request.json();
    const { id } = params;

    let newStatus: StatusSurat;
    let logAksi: string;
    let logDeskripsi: string;

    if (action === 'SETUJUI') {
      newStatus = 'DISETUJUI';
      logAksi = 'PERSETUJUAN_FINAL';
      logDeskripsi = `Surat disetujui dan diterbitkan oleh Kepala Desa (${session.user.email}).`;
      // TODO: Implementasi logika generasi surat (misal: memanggil service PDF)
      // dan menyimpan hasilnya di kolom 'fileGenerated'
    } else if (action === 'TOLAK') {
      if (!catatanPenolakan) {
        return NextResponse.json({ message: 'Catatan penolakan wajib diisi.' }, { status: 400 });
      }
      newStatus = 'DITOLAK';
      logAksi = 'PERSETUJUAN_DITOLAK';
      logDeskripsi = `Persetujuan ditolak oleh Kepala Desa (${session.user.email}) dengan alasan: ${catatanPenolakan}`;
    } else {
      return NextResponse.json({ message: 'Aksi tidak valid.' }, { status: 400 });
    }

    const updatedSurat = await prisma.$transaction(async (tx) => {
      const surat = await tx.suratKeluar.update({
        where: { id },
        data: {
          status: newStatus,
          catatanRevisi: action === 'TOLAK' ? catatanPenolakan : null,
          pengesahId: session.user.id,
          tanggalSelesai: newStatus === 'DISETUJUI' ? new Date() : null,
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
    return NextResponse.json({ message: 'Gagal memproses persetujuan.' }, { status: 500 });
  }
}