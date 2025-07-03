    import { NextResponse } from 'next/server';
    import { PrismaClient, Role } from '@/generated/prisma';
    import { getServerSession } from 'next-auth/next';
    import { authOptions } from '@/lib/auth.config';

    const prisma = new PrismaClient();

    export async function GET(request: Request) {
      const session = await getServerSession(authOptions);
      if (!session || (session.user.role !== Role.STAF && session.user.role !== Role.KEPALA_DESA)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      try {
        const templates = await prisma.templateSurat.findMany({
          orderBy: { namaSurat: 'asc' },
        });
        return NextResponse.json(templates, { status: 200 });
      } catch (error) {
        console.error("API_GET_TEMPLATES_ERROR:", error);
        return NextResponse.json({ message: 'Gagal mengambil data template.' }, { status: 500 });
      }
    }

    export async function POST(request: Request) {
      const session = await getServerSession(authOptions);
      if (!session || (session.user.role !== Role.STAF && session.user.role !== Role.KEPALA_DESA)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      try {
        const body = await request.json();
        const { kodeSurat, namaSurat, deskripsi, persyaratan, templateHtml, formSchema } = body;

        if (!kodeSurat || !namaSurat || !templateHtml) {
          return NextResponse.json({ message: 'Data wajib (Kode, Nama, Template) tidak lengkap.' }, { status: 400 });
        }

        const newTemplate = await prisma.templateSurat.create({
          data: {
            kodeSurat,
            namaSurat,
            deskripsi,
            persyaratan: persyaratan || [],
            templateHtml,
            formSchema: formSchema || [],
            isActive: true,
          },
        });
        return NextResponse.json(newTemplate, { status: 201 });
      } catch (error: any) {
        if (error.code === 'P2002') {
          return NextResponse.json({ message: 'Kode Surat sudah ada. Gunakan kode unik.' }, { status: 409 });
        }
        console.error("API_CREATE_TEMPLATE_ERROR:", error);
        return NextResponse.json({ message: 'Gagal membuat template baru.' }, { status: 500 });
      }
    }
    