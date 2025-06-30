// src/app/dashboard/kepala-desa/persetujuan/[id]/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';
import { Prisma } from '@/generated/prisma';

type SuratDetailForApproval = Prisma.SuratKeluarGetPayload<{
  include: {
    template: true,
    pemohon: { include: { profile: true } },
    verifikator: { include: { profile: true } },
  }
}>;

export default function PersetujuanDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [surat, setSurat] = useState<SuratDetailForApproval | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, startTransition] = useTransition();

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/kepala-desa/persetujuan/${id}`);
        if (!response.ok) throw new Error('Gagal memuat data persetujuan.');
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
  const handleAction = async (action: 'SETUJUI' | 'TOLAK') => {
    let catatanPenolakan = '';
    if (action === 'TOLAK') {
      catatanPenolakan = prompt('Mohon masukkan alasan penolakan final:') || '';
      if (!catatanPenolakan.trim()) {
        alert('Alasan penolakan wajib diisi.');
        return;
      }
    }
    startTransition(async () => {
      try {
        const response = await fetch(`/api/kepala-desa/persetujuan/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, catatanPenolakan }),
        });
        if (!response.ok) throw new Error('Gagal memproses aksi.');
        alert(`Surat telah berhasil di-${action === 'SETUJUI' ? 'setujui dan diterbitkan' : 'tolak'}.`);
        router.push('/dashboard/kepala-desa/persetujuan');
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    });
  };

  const DetailItem = ({ label, value }: { label: string, value: any }) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-md font-semibold text-gray-900">{value || '-'}</p>
    </div>
  );

  const renderContent = () => {
    if (isLoading) return <p>Memuat detail persetujuan...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (!surat) return <p>Data persetujuan tidak ditemukan.</p>;

    const profile = surat.pemohon?.profile;
    const formData = surat.formData as any;

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
                <h3 className="text-lg font-bold text-accent-dark">Data Pemohon</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <DetailItem label="Nama Lengkap" value={profile?.namaLengkap} />
                <DetailItem label="NIK" value={profile?.nik} />
                <DetailItem label="Email" value={surat.pemohon?.email} />
                </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
                <h3 className="text-lg font-bold text-accent-dark">Data Isian Formulir</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.keys(formData).length > 0 ? Object.entries(formData).map(([key, value]) => (
                    <DetailItem key={key} label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} value={value} />
                )) : <p className="text-sm text-gray-500 col-span-2">Tidak ada data tambahan yang diisi pada formulir.</p>}
                </div>
            </div>
            </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
            <h3 className="text-lg font-bold text-accent-dark">Ringkasan & Aksi</h3>
            <div className="mt-4 space-y-3">
              <DetailItem label="Jenis Surat" value={surat.template.namaSurat} />
              <DetailItem label="Pemohon" value={profile?.namaLengkap} />
              <DetailItem label="Diverifikasi Oleh" value={surat.verifikator?.profile?.namaLengkap} />
              <DetailItem label="Status Saat Ini" value={surat.status} />
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
                <h3 className="text-lg font-bold text-accent-dark">Berkas Terlampir</h3>
                <div className="mt-4 space-y-3">
                    {surat.filePersyaratan && surat.filePersyaratan.length > 0 ? (
                    surat.filePersyaratan.map((filePath, index) => {
                        // Mengambil nama file asli dari path yang panjang
                        const fileName = filePath.split('/').pop()?.split('_').slice(0, -1).join(' ') || 'Berkas';
                        return (
                        <div key={index} className="flex items-center justify-between rounded-md border bg-gray-50 p-3">
                            <p className="text-sm font-medium text-gray-800">
                            {index + 1}. {fileName.replace(/_/g, ' ')}
                            </p>
                            <button 
                            onClick={() => handleViewFile(filePath)} 
                            className="shrink-0 text-sm font-semibold text-blue-600 hover:underline"
                            >
                            Lihat
                            </button>
                        </div>
                        );
                    })
                    ) : (
                    <p className="text-sm text-gray-500">Tidak ada berkas yang diunggah oleh pemohon.</p>
                    )}
                </div>
            </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleAction('TOLAK')} disabled={isProcessing} className="w-full rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              Tolak
            </button>
            <button onClick={() => handleAction('SETUJUI')} disabled={isProcessing} className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              Setujui & Terbitkan
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Persetujuan Akhir Surat</h1>
      {renderContent()}
    </AppLayout>
  );
}