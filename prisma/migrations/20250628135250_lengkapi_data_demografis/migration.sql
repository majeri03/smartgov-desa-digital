/*
  Warnings:

  - You are about to drop the column `alamat` on the `UserProfile` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `UserProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "StatusPerkawinan" AS ENUM ('BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI');

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "alamat",
ADD COLUMN     "agama" TEXT,
ADD COLUMN     "alamatKTP" TEXT,
ADD COLUMN     "jenisKelamin" "JenisKelamin",
ADD COLUMN     "kabupatenKota" TEXT,
ADD COLUMN     "kecamatan" TEXT,
ADD COLUMN     "kelurahanDesa" TEXT,
ADD COLUMN     "kewarganegaraan" TEXT DEFAULT 'WNI',
ADD COLUMN     "kodePos" TEXT,
ADD COLUMN     "namaAyah" TEXT,
ADD COLUMN     "namaIbu" TEXT,
ADD COLUMN     "nomorKK" TEXT,
ADD COLUMN     "pendidikanTerakhir" TEXT,
ADD COLUMN     "provinsi" TEXT,
ADD COLUMN     "rt" TEXT,
ADD COLUMN     "rw" TEXT,
ADD COLUMN     "statusHubKeluarga" TEXT,
ADD COLUMN     "statusPerkawinan" "StatusPerkawinan",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
