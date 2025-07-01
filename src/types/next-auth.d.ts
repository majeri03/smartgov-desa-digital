// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import { Role } from "@prisma/client"; // Impor enum Role dari Prisma

// Deklarasikan modul untuk "next-auth/jwt"
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
  }
}

// Deklarasikan modul untuk "next-auth"
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      namaLengkap?: string | null;
      nik?: string | null;
      urlTandaTangan?: string | null;
      urlStempel?: string | null;
      image?: string | null;
    } & DefaultSession["user"]; // Gabungkan dengan properti user default
  }

  // Anda juga bisa memperluas tipe User jika diperlukan di tempat lain
  interface User extends DefaultUser {
      role: Role;
      namaLengkap?: string | null;
      nik?: string | null;
      urlTandaTangan?: string | null;
      urlStempel?: string | null;
  }
}