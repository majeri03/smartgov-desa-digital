    import { NextResponse } from 'next/server';
    import { PrismaClient, Role, Prisma } from '@/generated/prisma';
    import { getServerSession } from 'next-auth/next';
    import { authOptions } from '@/lib/auth.config';

    const prisma = new PrismaClient();

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
        const template = await prisma.templateSurat.findUnique({
          where: { id: id },
        });
        if (!template) {
          return NextResponse.json({ message: 'Template tidak ditemukan.' }, { status: 404 });
        }
        return NextResponse.json(template, { status: 200 });
      } catch (error) {
        return NextResponse.json({ message: 'Gagal mengambil data.' }, { status: 500 });
      }
    }

    export async function PUT(
      request: Request,
      { params }: { params: Promise<{ id: string }> }
    ) {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== Role.STAF && session.user.role !== Role.KEPALA_DESA)) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
        
        try {
            const body = await request.json();
            const { namaSurat, deskripsi, persyaratan, templateHtml, isActive } = body;
            
            const updatedTemplate = await prisma.templateSurat.update({
                where: { id: id },
                data: {
                    namaSurat,
                    deskripsi,
                    persyaratan,
                    templateHtml,
                    isActive
                },
            });
            return NextResponse.json(updatedTemplate, { status: 200 });
        } catch (error) {
            console.error("API_UPDATE_TEMPLATE_ERROR:", error);
            return NextResponse.json({ message: 'Gagal memperbarui template.' }, { status: 500 });
        }
    }
    
    // Ganti fungsi DELETE yang lama dengan yang ini
    export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
    ) {
      const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== Role.STAF && session.user.role !== Role.KEPALA_DESA)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        // Logika Hard Delete
        await prisma.templateSurat.delete({
        where: { id: id },
        });
        return NextResponse.json({ message: 'Template berhasil dihapus secara permanen.' }, { status: 200 });
    } catch (error) {
  // Verifikasi tipe error sebelum mengakses propertinya
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2003 adalah kode error untuk pelanggaran foreign key constraint
            if (error.code === 'P2003') {
            return NextResponse.json({ message: 'Gagal: Template ini masih digunakan oleh surat yang sudah ada dan tidak dapat dihapus.' }, { status: 409 });
            }
        }
        // Untuk semua error lainnya
        return NextResponse.json({ message: 'Gagal menghapus template.' }, { status: 500 });
        }
    }