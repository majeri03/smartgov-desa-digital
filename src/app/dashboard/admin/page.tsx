// src/app/dashboard/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';
import { StatusSurat } from '@/generated/prisma';

interface Submission {
  id: string;
  status: StatusSurat;
  createdAt: string;
  template: { namaSurat: string };
  pemohon: { profile: { namaLengkap: string, nik: string } | null } | null;
}

export default function AdminDashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/surat');
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Gagal memuat data pengajuan.');
        }
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
    // Arahkan ke halaman detail verifikasi yang akan kita buat nanti
    router.push(`/dashboard/admin/verifikasi/${id}`);
  };

  const renderContent = () => {
    if (isLoading) return <p>Memuat daftar pengajuan...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (submissions.length === 0) return <p>Tidak ada pengajuan yang perlu diproses saat ini.</p>;

    return (
    <div>
        {/* Tampilan Kartu untuk Mobile (hidden di 'sm' ke atas) */}
        <div className="grid grid-cols-1 gap-4 sm:hidden">
            {submissions.map((submission) => (
                <div key={submission.id} onClick={() => handleRowClick(submission.id)} className="rounded-lg border bg-white p-4 shadow-sm cursor-pointer hover:border-primary">
                    <div className="flex items-center justify-between">
                        <p className="font-bold text-accent-dark">{submission.pemohon?.profile?.namaLengkap || 'N/A'}</p>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            submission.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {submission.status}
                        </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                        <p>{submission.template.namaSurat}</p>
                        <p className="mt-1 text-xs text-gray-500">
                            Diajukan: {new Date(submission.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </p>
                    </div>
                </div>
            ))}
        </div>

        {/* Tampilan Tabel untuk Desktop (hidden di bawah 'sm') */}
        <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm sm:block">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-gray-900">Nama Pemohon</th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-gray-900">Jenis Surat</th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-gray-900">Tanggal Pengajuan</th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id} onClick={() => handleRowClick(submission.id)} className="cursor-pointer hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                      {submission.pemohon?.profile?.namaLengkap || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">{submission.template.namaSurat}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {new Date(submission.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                        submission.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {submission.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
    </div>
    );}

  return (
    <AppLayout>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl">Dasbor Admin</h1>
        {/* Di sini bisa ditambahkan tombol aksi seperti "Filter" atau "Export" */}
      </div>
      <p className="mb-6 mt-1 text-gray-600">Daftar semua pengajuan surat yang masuk dari warga.</p>
      {renderContent()}
    </AppLayout>
  );
}