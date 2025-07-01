// src/app/dashboard/status-surat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/app/components/AppLayout';
import Link from 'next/link';
import { StatusSurat } from '@/generated/prisma';

interface Pengajuan {
  id: string;
  status: StatusSurat;
  createdAt: string;
  template: {
    namaSurat: string;
  };
}

// Komponen Kartu untuk setiap item pengajuan (lebih responsif daripada tabel)
const PengajuanCard = ({ pengajuan }: { pengajuan: Pengajuan }) => {
  const statusColors: { [key in StatusSurat]: string } = {
    MENGISI_BERKAS: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    DIVERIFIKASI: 'bg-blue-100 text-blue-800',
    DISETUJUI: 'bg-green-100 text-green-800',
    DITOLAK: 'bg-red-100 text-red-800',
    SELESAI: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <Link href={`/dashboard/status-surat/${pengajuan.id}`}>
      <div className="block rounded-lg border bg-white p-4 shadow-sm transition-all hover:border-primary hover:shadow-md">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-bold text-accent-dark">{pengajuan.template.namaSurat}</p>
            <p className="text-xs text-gray-500">
              Diajukan pada: {new Date(pengajuan.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[pengajuan.status]}`}>
              {pengajuan.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function DaftarStatusSuratPage() {
  const [daftarPengajuan, setDaftarPengajuan] = useState<Pengajuan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDaftarPengajuan = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/surat/pengajuan');
        if (!response.ok) throw new Error('Gagal memuat riwayat pengajuan.');
        const data = await response.json();
        setDaftarPengajuan(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDaftarPengajuan();
  }, []);

  const renderContent = () => {
    if (isLoading) return <p>Memuat riwayat pengajuan...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (daftarPengajuan.length === 0) {
      return (
        <div className="text-center">
          <p>Anda belum pernah membuat pengajuan surat.</p>
          <Link href="/dashboard/jenis-surat">
            <span className="mt-4 inline-block rounded-md bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-dark">
              Ajukan Surat Pertama Anda
            </span>
          </Link>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {daftarPengajuan.map((p) => (
          <PengajuanCard key={p.id} pengajuan={p} />
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Lacak Pengajuan Saya</h1>
      <div>{renderContent()}</div>
    </AppLayout>
  );
}