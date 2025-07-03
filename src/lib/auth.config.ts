import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // Ini adalah logika utama saat proses login terjadi
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password wajib diisi.');
        }

        // 1. Cari user di database berdasarkan email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          // User tidak ditemukan atau tidak memiliki password
          throw new Error('Kredensial tidak valid.');
        }

        // 2. Bandingkan password yang diberikan dengan hash di database
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Kredensial tidak valid.');
        }

        // 3. Jika berhasil, kembalikan data user (tanpa password)
        // Data ini akan disimpan di dalam token JWT
        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt', // Menggunakan JSON Web Tokens untuk sesi
  },
  callbacks: {
    // Callback ini dipanggil saat token JWT dibuat atau diperbarui
    async jwt({ token, user }) {
      if (user) {
        // Saat pertama kali login, tambahkan id dan role ke dalam token
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // Callback ini dipanggil saat sesi diakses oleh client
    async session({ session, token }) {
    if (token && session.user) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;

      // Ambil SEMUA data profil yang relevan sekali jalan
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: token.id as string },
        select: { 
          namaLengkap: true,
          nik: true,
          urlFotoProfil: true,
          urlTandaTangan: true,
          urlStempel: true,
        }
      });

      if (userProfile) {
        session.user.namaLengkap = userProfile.namaLengkap;
        session.user.nik = userProfile.nik;
        session.user.image = userProfile.urlFotoProfil; // Untuk avatar
        session.user.urlTandaTangan = userProfile.urlTandaTangan;
        session.user.urlStempel = userProfile.urlStempel;
      }
    }
    return session;
  }
  },
  pages: {
    signIn: '/login', // Arahkan ke halaman login kustom kita
  },
  secret: process.env.NEXTAUTH_SECRET, // Mengambil secret dari environment variables
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };