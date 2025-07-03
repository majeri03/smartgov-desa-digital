// src/app/api/surat/upload-url/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

// Inisialisasi Supabase client dengan kunci service_role yang aman
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileName, fileType, suratId } = await request.json();

    if (!fileName || !fileType || !suratId) {
      return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
    }
    
    // Path file yang akan digunakan di Supabase Storage
    const filePath = `${session.user.id}/${suratId}/${fileName.replace(/\s/g, '_')}_${Date.now()}`;

    // --- LOGIKA YANG DIPERBAIKI SECARA FUNDAMENTAL ---
    // Menggunakan metode yang TEPAT untuk membuat URL UPLOAD
    const { data, error } = await supabaseAdmin.storage
      .from('berkas-persyaratan')
      .createSignedUploadUrl(filePath); // Metode ini tidak butuh 'expiresIn'
    // --- AKHIR PERBAIKAN ---

    if (error) {
      console.error('Supabase Signed URL Error:', error);
      throw new Error('Gagal berkomunikasi dengan layanan penyimpanan.');
    }

    // --- PERBAIKAN KEDUA: Mengembalikan data dengan benar ---
    // Hasil 'data' dari createSignedUploadUrl berisi 'signedUrl' dan 'path'
    // 'path' di sini adalah path yang sama dengan 'filePath' kita
    // 'token' juga dikembalikan, yang merupakan bagian dari 'signedUrl'
    return NextResponse.json({ 
      signedUrl: data.signedUrl, 
      filePath: filePath // Kita kembalikan path yang kita buat agar konsisten
    }, { status: 200 });

  } catch (error: any) {
    console.error('API_CREATE_SIGNED_URL_ERROR:', error.message);
    return NextResponse.json({ message: 'Gagal membuat URL unggah.' }, { status: 500 });
  }
}