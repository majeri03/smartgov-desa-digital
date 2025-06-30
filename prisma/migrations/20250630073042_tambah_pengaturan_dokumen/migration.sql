-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "urlStempel" TEXT,
ADD COLUMN     "urlTandaTangan" TEXT;

-- CreateTable
CREATE TABLE "PengaturanDesa" (
    "id" TEXT NOT NULL,
    "namaDesa" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL,
    "alamatKantor" TEXT NOT NULL,
    "teleponKantor" TEXT,
    "emailDesa" TEXT,
    "websiteDesa" TEXT,
    "logoDesaUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengaturanDesa_pkey" PRIMARY KEY ("id")
);
