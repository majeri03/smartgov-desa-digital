// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod'; // Kita akan gunakan Zod untuk validasi yang lebih kuat

const prisma = new PrismaClient();

// Definisikan skema validasi menggunakan Zod untuk memastikan tipe data
const registerSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(8, { message: 'Password minimal harus 8 karakter.' }),
  namaLengkap: z.string().min(3, { message: 'Nama lengkap wajib diisi.' }),
  nik: z.string().length(16, { message: 'NIK harus 16 digit.' }).regex(/^\d+$/, { message: 'NIK hanya boleh berisi angka.' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validasi input menggunakan Zod. Jika gagal, otomatis melempar error.
    const validatedData = registerSchema.parse(body);
    
    // 2. Transaksi untuk menjamin integritas data
    const result = await prisma.$transaction(async (tx) => {
      // Cek duplikasi email atau NIK
      const existingUser = await tx.user.findFirst({
        where: { OR: [{ email: validatedData.email }, { profile: { nik: validatedData.nik } }] },
      });

      if (existingUser) {
        throw new Error('Email atau NIK sudah terdaftar.');
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      const newUser = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          role: 'WARGA',
        },
      });

      const newUserProfile = await tx.userProfile.create({
        data: {
          userId: newUser.id,
          nik: validatedData.nik,
          namaLengkap: validatedData.namaLengkap,
        },
      });
      
      const { password: _, ...userWithoutPassword } = newUser;
      return { user: userWithoutPassword, profile: newUserProfile };
    });

    return NextResponse.json({
      message: 'Pendaftaran berhasil!',
      user: result.user,
      profile: result.profile,
    }, { status: 201 });

  } catch (error: any) {
    // Tangani error validasi dari Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Data tidak valid.', errors: error.errors }, { status: 400 });
    }
    // Tangani error duplikasi dari transaksi
    if (error.message === 'Email atau NIK sudah terdaftar.') {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error('REGISTRATION_API_ERROR:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}