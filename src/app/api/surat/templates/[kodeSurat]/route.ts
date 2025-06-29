// src/app/api/surat/templates/[kodeSurat]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { kodeSurat: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { kodeSurat } = params;

  if (!kodeSurat) {
    return NextResponse.json({ message: 'Kode surat diperlukan.' }, { status: 400 });
  }

  try {
    const template = await prisma.templateSurat.findUnique({
      where: {
        kodeSurat: kodeSurat,
        isActive: true,
      },
      select: {
        id: true,
        namaSurat: true,
        persyaratan: true,
        formSchema: true, // Ini adalah data krusial yang kita butuhkan
      },
    });

    if (!template) {
      return NextResponse.json({ message: 'Template surat tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(template, { status: 200 });

  } catch (error) {
    console.error(`API_TEMPLATE_DETAIL_ERROR (kode: ${kodeSurat}):`, error);
    return NextResponse.json(
      { message: 'Gagal mengambil detail template surat.' },
      { status: 500 }
    );
  }
}