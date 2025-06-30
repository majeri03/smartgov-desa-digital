// src/app/dashboard/kepala-desa/persetujuan/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';

interface ApprovalItem {
  id: string;
  createdAt: string;
  template: { namaSurat: string };
  pemohon: { profile: { namaLengkap: string } | null } | null;
  verifikator: { profile: { namaLengkap: string } | null } | null;
}

export default function PersetujuanPage() {
  const [submissions, setSubmissions] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/kepala-desa/persetujuan');
        if (!response.ok) throw new Error('Gagal memuat data persetujuan.');
        const data = await response.json();
        setSubmissions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const handleRowClick = (id: string) => {
    // Arahkan ke halaman detail persetujuan yang akan kita buat nanti
    router.push(`/dashboard/kepala-desa/persetujuan/${id}`);
  };

  const renderContent = () => {
    if (isLoading) return <p>Memuat daftar persetujuan...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (submissions.length === 0) return <p>Tidak ada pengajuan yang menunggu persetujuan.</p>;

    return (
      // Menggunakan kembali pola desain responsif dari dasbor admin
      <div>
        {/* Tampilan Kartu untuk Mobile */}
        <div className="grid grid-cols-1 gap-4 sm:hidden">
          {submissions.map((item) => (
            <div key={item.id} onClick={() => handleRowClick(item.id)} className="rounded-lg border bg-white p-4 shadow-sm cursor-pointer hover:border-primary">
              <p className="font-bold text-accent-dark">{item.pemohon?.profile?.namaLengkap || 'N/A'}</p>
              <div className="mt-2 text-sm text-gray-700">
                <p>{item.template.namaSurat}</p>
                <p className="mt-1 text-xs text-gray-500">Diverifikasi oleh: {item.verifikator?.profile?.namaLengkap || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tampilan Tabel untuk Desktop */}
        <div className="hidden overflow-x-auto rounded-lg border bg-white shadow-sm sm:block">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-900">Nama Pemohon</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-900">Jenis Surat</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-900">Diverifikasi Oleh</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-900">Tanggal Diajukan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item.id)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{item.pemohon?.profile?.namaLengkap || 'N/A'}</td>
                  <td className="px-4 py-2 text-gray-700">{item.template.namaSurat}</td>
                  <td className="px-4 py-2 text-gray-700">{item.verifikator?.profile?.namaLengkap || 'N/A'}</td>
                  <td className="px-4 py-2 text-gray-700">{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Dasbor Persetujuan</h1>
      {renderContent()}
    </AppLayout>
  );
}