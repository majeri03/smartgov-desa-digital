// src/app/dashboard/status-surat/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';
import { StatusSurat, LogAktivitas, User, UserProfile, TemplateSurat } from '@/generated/prisma';

// Definisikan tipe data yang lebih spesifik untuk data yang kita terima dari API
type SuratDetail = {
  id: string;
  status: StatusSurat;
  createdAt: string;
  template: { namaSurat: string };
  pemohon: { profile: { namaLengkap: string, nik: string } | null } | null;
  riwayat: (LogAktivitas & { aktor: { profile: { namaLengkap: string } | null } })[];
};

// Komponen untuk Progress Tracker visual
const ProgressTracker = ({ currentStatus }: { currentStatus: StatusSurat }) => {
  const steps = [
    { status: 'PENDING', label: 'Pengajuan Diterima' },
    { status: 'DIVERIFIKASI', label: 'Diverifikasi Staf' },
    { status: 'DISETUJUI', label: 'Disetujui Kades' },
    { status: 'SELESAI', label: 'Selesai & Siap Diunduh' },
  ];

  const currentIndex = steps.findIndex(step => step.status === currentStatus);

  return (
    <div className="w-full">
      <ol className="relative grid grid-cols-4 items-center text-sm font-medium text-gray-500">
        {steps.map((step, index) => (
          <li key={step.status} className="relative text-center">
            <div className={`absolute -left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gray-200 ${index <= currentIndex ? 'bg-primary' : ''}`}></div>
            <div className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-lg ${index <= currentIndex ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
              ✓
            </div>
            <p className={`mt-2 text-xs sm:text-sm ${index <= currentIndex ? 'text-primary font-semibold' : ''}`}>{step.label}</p>
          </li>
        ))}
      </ol>
    </div>
  );
};


export default function StatusSuratDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [surat, setSurat] = useState<SuratDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchSuratDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/surat/pengajuan/${id}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Gagal memuat detail surat.');
        }
        const data = await response.json();
        setSurat(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuratDetail();
  }, [id]);

  const renderContent = () => {
    if (isLoading) return <p>Memuat detail status surat...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (!surat) return <p>Data pengajuan tidak ditemukan.</p>;

    return (
      <div className="space-y-8">
        {/* Bagian Status Utama */}
        <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-accent-dark sm:text-xl">{surat.template.namaSurat}</h2>
              <p className="text-sm text-gray-500">No. Registrasi: {surat.id}</p>
              <p className="mt-1 text-sm font-semibold text-primary">{surat.status.replace('_', ' ')}</p>
            </div>
            <div className="w-full sm:w-auto">
              {/* Di sini bisa ditambahkan tombol aksi, misal "Batalkan Pengajuan" atau "Unggah Ulang Berkas" */}
            </div>
          </div>
          <div className="mt-6">
            <ProgressTracker currentStatus={surat.status} />
          </div>
        </div>

        {/* Bagian Riwayat/Log Aktivitas */}
        <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-md font-bold text-accent-dark sm:text-lg">Riwayat Proses Pengajuan</h3>
          <ul className="mt-4 space-y-4">
            {surat.riwayat.map(log => (
              <li key={log.id} className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">✓</div>
                <div>
                  <p className="font-semibold text-gray-800">{log.aksi.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500">{log.deskripsi}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Detail Status Surat</h1>
      {renderContent()}
    </AppLayout>
  );
}