-- CreateEnum
CREATE TYPE "Role" AS ENUM ('WARGA', 'STAF', 'KEPALA_DESA');

-- CreateEnum
CREATE TYPE "StatusSurat" AS ENUM ('PENDING', 'DIPROSES', 'DITOLAK', 'SELESAI');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "telepon" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'WARGA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratKeluar" (
    "id" TEXT NOT NULL,
    "jenisSurat" TEXT NOT NULL,
    "status" "StatusSurat" NOT NULL DEFAULT 'PENDING',
    "formData" JSONB NOT NULL,
    "filePersyaratan" TEXT[],
    "catatanRevisi" TEXT,
    "fileSuratFinal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pemohonId" TEXT NOT NULL,
    "verifikatorId" TEXT,
    "pengesahId" TEXT,

    CONSTRAINT "SuratKeluar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratMasuk" (
    "id" TEXT NOT NULL,
    "nomorSurat" TEXT NOT NULL,
    "tanggalSurat" TIMESTAMP(3) NOT NULL,
    "asalSurat" TEXT NOT NULL,
    "perihal" TEXT NOT NULL,
    "filePdf" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pencatatId" TEXT NOT NULL,

    CONSTRAINT "SuratMasuk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nik_key" ON "User"("nik");

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_pemohonId_fkey" FOREIGN KEY ("pemohonId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_verifikatorId_fkey" FOREIGN KEY ("verifikatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_pengesahId_fkey" FOREIGN KEY ("pengesahId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratMasuk" ADD CONSTRAINT "SuratMasuk_pencatatId_fkey" FOREIGN KEY ("pencatatId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
