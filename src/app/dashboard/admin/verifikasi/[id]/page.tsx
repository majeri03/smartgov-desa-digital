// src/app/dashboard/admin/verifikasi/[id]/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';
import { Prisma } from '@/generated/prisma';

type SuratDetailWithRelations = Prisma.SuratKeluarGetPayload<{
  include: {
    template: true,
    pemohon: { include: { profile: true } },
  }
}>;

export default function VerifikasiDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [surat, setSurat] = useState<SuratDetailWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, startTransition] = useTransition();

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/verifikasi/${id}`);
        if (!response.ok) throw new Error('Gagal memuat data pengajuan.');
        const data = await response.json();
        setSurat(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleAction = async (action: 'SETUJU' | 'TOLAK') => {
    let catatanRevisi = '';
    if (action === 'TOLAK') {
      catatanRevisi = prompt('Mohon masukkan alasan penolakan atau revisi:') || '';
      if (!catatanRevisi.trim()) {
        alert('Alasan penolakan wajib diisi.');
        return;
      }
    }
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/verifikasi/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, catatanRevisi }),
        });
        if (!response.ok) throw new Error('Gagal memproses aksi.');
        alert(`Pengajuan telah berhasil di-${action === 'SETUJU' ? 'setujui' : 'tolak'}.`);
        router.push('/dashboard/admin');
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    });
  };

  const handleViewFile = async (filePath: string) => {
    try {
        const response = await fetch('/api/admin/berkas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath }),
        });
        if (!response.ok) throw new Error('Tidak bisa mendapatkan akses ke berkas.');
        const { signedUrl } = await response.json();
        window.open(signedUrl, '_blank');
    } catch (err: any) {
        alert(`Error: ${err.message}`);
    }
  };

  const DetailItem = ({ label, value }: { label: string, value: any }) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-md font-semibold text-gray-900">{value || '-'}</p>
    </div>
  );

  const renderContent = () => {
    if (isLoading) return <p>Memuat detail pengajuan...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (!surat) return <p>Data pengajuan tidak ditemukan.</p>;

    const profile = surat.pemohon?.profile;
    const formData = surat.formData as any;
    const allFilesUploaded = surat.template.persyaratan.length === surat.filePersyaratan.length;

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
            <h3 className="text-lg font-bold text-accent-dark">Data Pemohon</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Nama Lengkap" value={profile?.namaLengkap} />
              <DetailItem label="NIK" value={profile?.nik} />
              <DetailItem label="Email" value={surat.pemohon?.email} />
              <DetailItem label="Nomor Telepon" value={profile?.nomorTelepon} />
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
            <h3 className="text-lg font-bold text-accent-dark">Data Isian Formulir</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(formData).map(([key, value]) => (
                <DetailItem key={key} label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} value={value} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
            <h3 className="text-lg font-bold text-accent-dark">Ringkasan Surat</h3>
            <div className="mt-4 space-y-3">
              <DetailItem label="Jenis Surat" value={surat.template.namaSurat} />
              <DetailItem label="Tanggal Pengajuan" value={new Date(surat.createdAt).toLocaleString('id-ID')} />
              <DetailItem label="Status Saat Ini" value={surat.status} />
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
            <h3 className="text-lg font-bold text-accent-dark">Pemeriksaan Berkas</h3>
             <div className="mt-4 space-y-3">
                {surat.template.persyaratan.map((syarat) => {
                  const uploadedFile = surat.filePersyaratan.find(file => file.includes(syarat.replace(/\s/g, '_')));
                  return (
                    <div key={syarat} className="flex items-center justify-between rounded-md border p-3">
                      <p className="text-sm font-medium text-gray-800">{syarat}</p>
                      {uploadedFile ? (
                        <button onClick={() => handleViewFile(uploadedFile)} className="text-sm font-semibold text-blue-600 hover:underline">
                          Lihat Berkas
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-red-600">Belum Diunggah</span>
                      )}
                    </div>
                  );
                })}
              </div>
          </div>
          {surat.status === 'PENDING' && (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleAction('TOLAK')} disabled={isProcessing} className="w-full rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                Tolak
              </button>
              <button onClick={() => handleAction('SETUJU')} disabled={!allFilesUploaded || isProcessing} className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Setujui
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Verifikasi Pengajuan Surat</h1>
      {renderContent()}
    </AppLayout>
  );
}