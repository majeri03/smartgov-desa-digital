// src/app/api/admin/berkas/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';
import { Role } from '@/generated/prisma';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // Otorisasi: Hanya Staf atau Kades yang bisa membuat link lihat berkas
  if (!session || (session.user.role !== Role.STAF && session.user.role !== Role.KEPALA_DESA)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { filePath } = await request.json();
    if (!filePath) {
      return NextResponse.json({ message: 'Path berkas diperlukan.' }, { status: 400 });
    }

    // Membuat URL aman yang berlaku selama 60 detik
    const { data, error } = await supabaseAdmin.storage
      .from('berkas-persyaratan')
      .createSignedUrl(filePath, 60); // 60 detik

    if (error) {
      throw error;
    }

    return NextResponse.json({ signedUrl: data.signedUrl }, { status: 200 });

  } catch (error) {
    console.error('API_GET_SIGNED_VIEW_URL_ERROR:', error);
    return NextResponse.json({ message: 'Gagal membuat URL akses berkas.' }, { status: 500 });
  }
}