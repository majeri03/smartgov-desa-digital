/*
  Warnings:

  - The values [DIPROSES] on the enum `StatusSurat` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `fileSuratFinal` on the `SuratKeluar` table. All the data in the column will be lost.
  - You are about to drop the column `jenisSurat` on the `SuratKeluar` table. All the data in the column will be lost.
  - You are about to drop the column `nama` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nik` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `telepon` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nomorSurat]` on the table `SuratKeluar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `templateId` to the `SuratKeluar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- AlterEnum
BEGIN;
CREATE TYPE "StatusSurat_new" AS ENUM ('PENDING', 'DIVERIFIKASI', 'DITOLAK', 'DISETUJUI', 'SELESAI');
ALTER TABLE "SuratKeluar" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "SuratKeluar" ALTER COLUMN "status" TYPE "StatusSurat_new" USING ("status"::text::"StatusSurat_new");
ALTER TYPE "StatusSurat" RENAME TO "StatusSurat_old";
ALTER TYPE "StatusSurat_new" RENAME TO "StatusSurat";
DROP TYPE "StatusSurat_old";
ALTER TABLE "SuratKeluar" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "User_nik_key";

-- AlterTable
ALTER TABLE "SuratKeluar" DROP COLUMN "fileSuratFinal",
DROP COLUMN "jenisSurat",
ADD COLUMN     "fileGenerated" TEXT,
ADD COLUMN     "nomorSurat" TEXT,
ADD COLUMN     "tanggalSelesai" TIMESTAMP(3),
ADD COLUMN     "templateId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SuratMasuk" ADD COLUMN     "tanggalDiterima" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "nama",
DROP COLUMN "nik",
DROP COLUMN "telepon",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "nomorTelepon" TEXT,
    "alamat" TEXT,
    "pekerjaan" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" TIMESTAMP(3),

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateSurat" (
    "id" TEXT NOT NULL,
    "kodeSurat" TEXT NOT NULL,
    "namaSurat" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "persyaratan" TEXT[],
    "templateHtml" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateSurat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pengumuman" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "gambarUrl" TEXT,
    "penulisId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pengumuman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAktivitas" (
    "id" TEXT NOT NULL,
    "aktorId" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "suratKeluarId" TEXT,
    "suratMasukId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAktivitas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_nik_key" ON "UserProfile"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSurat_kodeSurat_key" ON "TemplateSurat"("kodeSurat");

-- CreateIndex
CREATE UNIQUE INDEX "SuratKeluar_nomorSurat_key" ON "SuratKeluar"("nomorSurat");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateSurat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pengumuman" ADD CONSTRAINT "Pengumuman_penulisId_fkey" FOREIGN KEY ("penulisId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAktivitas" ADD CONSTRAINT "LogAktivitas_aktorId_fkey" FOREIGN KEY ("aktorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAktivitas" ADD CONSTRAINT "LogAktivitas_suratKeluarId_fkey" FOREIGN KEY ("suratKeluarId") REFERENCES "SuratKeluar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAktivitas" ADD CONSTRAINT "LogAktivitas_suratMasukId_fkey" FOREIGN KEY ("suratMasukId") REFERENCES "SuratMasuk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
