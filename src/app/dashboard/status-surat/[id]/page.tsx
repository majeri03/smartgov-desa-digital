// src/app/dashboard/status-surat/[id]/page.tsx
'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';
import { StatusSurat, LogAktivitas, Prisma } from '@/generated/prisma';
import html2pdf from 'html2pdf.js';

// Tipe data yang lebih spesifik untuk data yang kita terima dari API
type SuratDetail = Prisma.SuratKeluarGetPayload<{
  include: {
    template: { select: { namaSurat: true, persyaratan: true,  kodeSurat: true} },
    pemohon: { select: { profile: { select: { namaLengkap: true, nik: true } } } },
    riwayat: { orderBy: { timestamp: 'asc' }, include: { aktor: { select: { profile: { select: { namaLengkap: true } } } } } },
  }
}>;

// Komponen ProgressTracker (Tidak ada perubahan)
// Ganti komponen ProgressTracker yang lama dengan yang ini
const ProgressTracker = ({ currentStatus, allFilesUploaded }: { currentStatus: StatusSurat; allFilesUploaded: boolean }) => {
  const steps = [
    { status: 'MENGISI_BERKAS', label: 'Lengkapi Berkas' },
    { status: 'PENDING', label: 'Menunggu Verifikasi' },
    { status: 'DIVERIFIKASI', label: 'Diverifikasi Staf' },
    { status: 'DISETUJUI', label: 'Disetujui Kades' },
    { status: 'SELESAI', label: 'Selesai' },
  ];

  // Fungsi ini kini secara akurat menentukan langkah mana yang SELESAI
  const getCompletedUptoIndex = () => {
    const order: StatusSurat[] = ['MENGISI_BERKAS', 'PENDING', 'DIVERIFIKASI', 'DISETUJUI', 'SELESAI'];

    // Jika status MENGISI_BERKAS dan belum semua diunggah, tidak ada yang selesai.
    if (currentStatus === 'DISETUJUI' || currentStatus === 'SELESAI') {
    return order.length - 1; // Selalu tandai sampai langkah terakhir
    }

    if (currentStatus === 'MENGISI_BERKAS' && !allFilesUploaded) {
      return -1;
    }

    // Jika ditolak, anggap proses berhenti setelah 'Menunggu Verifikasi'
    if (currentStatus === 'DITOLAK') {
      return order.indexOf('PENDING');
    }

    // Untuk status lain, semua langkah hingga status tersebut dianggap selesai.
    return order.indexOf(currentStatus);
  };

  const lastCompletedIndex = getCompletedUptoIndex();

  return (
    <div className="w-full pt-2">
      <ol className="relative grid grid-cols-5 items-start text-center text-sm font-medium text-gray-500">
        {steps.map((step, index) => {
          // Logika visual yang baru dan lebih sederhana
          const isCompleted = index <= lastCompletedIndex;
          const isActive = index === lastCompletedIndex + 1;

          return (
            <li key={step.status} className="relative flex justify-center">
              {index > 0 && (
                <div className={`absolute right-1/2 top-4 h-0.5 w-full bg-gray-200 ${isCompleted ? 'bg-primary' : ''}`}></div>
              )}

              <div className="flex flex-col items-center">
                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full font-bold transition-colors ${
                    isCompleted ? 'bg-primary text-white'
                    : isActive ? 'border-2 border-primary bg-white text-primary'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <p className={`mt-2 text-center text-xs sm:text-sm ${isActive || isCompleted ? 'font-semibold text-primary' : 'font-medium text-gray-500'}`}>
                  {step.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

// Komponen FileUploader yang baru
// Buat komponen baru ini untuk menggantikan FileUploader
const RequirementUploader = ({ suratId, requirement, uploadedFile, onUploadSuccess }: { suratId: string, requirement: string, uploadedFile: string | undefined, onUploadSuccess: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Ukuran file maks 5MB.');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleCancelSelection = () => {
    setFile(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const cleanFileName = requirement.replace(/\s/g, '_') + '.' + file.name.split('.').pop();
      const urlResponse = await fetch('/api/surat/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: cleanFileName, fileType: file.type, suratId }),
      });
      if (!urlResponse.ok) throw new Error('Gagal mendapatkan izin unggah.');
      const { signedUrl, filePath } = await urlResponse.json();
      const uploadResponse = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!uploadResponse.ok) throw new Error('Proses unggah gagal.');
      const recordResponse = await fetch('/api/surat/berkas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suratId, filePath }),
      });
      if (!recordResponse.ok) throw new Error('Gagal mencatat berkas.');
      alert(`Berkas "${requirement}" berhasil diunggah!`);
      onUploadSuccess();
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadedFile) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
        <p className="text-sm font-medium text-green-800">{requirement}</p>
        <span className="text-sm font-bold text-green-800">✓ Berhasil Diunggah</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 transition-all hover:border-gray-300">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex-1 font-medium text-gray-800">{requirement}</p>
        {!file ? (
            <input type="file" accept="image/png, image/jpeg, application/pdf" onChange={handleFileChange} className="w-full shrink-0 cursor-pointer text-xs sm:w-auto file:mr-2 file:cursor-pointer file:rounded-full file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:font-semibold hover:file:bg-gray-200"/>
        ) : (
          <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <span className="text-sm text-gray-600 truncate max-w-[150px]">{file.name}</span>
              <button onClick={handleCancelSelection} className="text-xs text-red-500 hover:underline">Batal</button>
              <button onClick={handleUpload} disabled={isUploading} className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-primary/50">
                {isUploading ? '...' : 'Unggah'}
              </button>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <p className="mt-2 text-xs text-gray-400">Tipe file: JPG, PNG, atau PDF. Ukuran maks: 5MB.</p>
    </div>
  );
};


export default function StatusSuratDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [surat, setSurat] = useState<SuratDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const fetchSuratDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
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
  }, [id]);

  useEffect(() => {
    fetchSuratDetail();
  }, [fetchSuratDetail]);

  const handleAjukanVerifikasi = async () => {
  if (!surat) return;
  const confirmation = confirm('Apakah Anda yakin semua berkas yang diunggah sudah benar? Setelah diajukan, Anda tidak dapat mengubahnya lagi.');
  if (!confirmation) return;

  startTransition(async () => {
  try {
    const response = await fetch('/api/surat/ajukan-verifikasi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suratId: surat.id }),
    });
    if (!response.ok) throw new Error('Gagal mengajukan verifikasi.');
    alert('Pengajuan Anda berhasil dikirim untuk diverifikasi oleh staf desa.');
    fetchSuratDetail(); // Refresh halaman
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  })
  };

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch(`/api/surat/unduh/${id}`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Gagal mengambil data surat.');
        }
        const { html, fileName } = await response.json();

        // html2pdf.js bekerja paling baik dengan elemen DOM, bukan string
        const element = document.createElement('div');
        element.innerHTML = html;
        document.body.appendChild(element); // Tambahkan sementara ke DOM

        const opt = {
            margin:       0,
            filename:     fileName,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().from(element).set(opt).save();

        document.body.removeChild(element); // Hapus elemen setelah selesai
    } catch (err: any) {
        setError(err.message);
        alert(`Error: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
};

  const renderContent = () => {
    if (isLoading) return <p>Memuat detail status surat...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (!surat) return <p>Data pengajuan tidak ditemukan.</p>;
    const allFilesUploaded =
      (surat.filePersyaratan?.length ?? 0) >= surat.template.persyaratan.length;

    // Override UI‐status: jangan tampilkan PENDING sebelum semua file ter‐upload
    const uiStatus: StatusSurat =
      surat.status === 'PENDING' && !allFilesUploaded
        ? 'MENGISI_BERKAS'
        : surat.status;
    return (
      <div className="space-y-6 sm:space-y-8">
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
            <ProgressTracker 
              currentStatus={uiStatus}
              allFilesUploaded={surat.template.persyaratan.length === surat.filePersyaratan?.length}
            />
          </div>
        </div>
        {/* Sisipkan kode ini setelah blok status utama */}
        {(surat.status === 'DISETUJUI' || surat.status === 'SELESAI') && (
          <div className="rounded-lg border bg-green-50 p-4 text-center shadow-sm sm:p-6">
            <h3 className="text-lg font-bold text-green-800">Dokumen Anda Telah Terbit!</h3>
            <p className="mt-2 text-sm text-green-700">Surat resmi Anda telah disetujui dan siap untuk diunduh atau diambil di kantor desa.</p>
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="..."
            >
              {isLoading ? 'Mempersiapkan...' : 'Unduh Surat Digital (.pdf)'}
            </button>
          </div>
        )}
        {uiStatus === 'MENGISI_BERKAS' && (
          <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
            <h3 className="text-md font-bold text-accent-dark sm:text-lg">Unggah Berkas Persyaratan</h3>
            <p className="mt-1 text-sm text-gray-500">Silakan unggah semua berkas yang dibutuhkan satu per satu.</p>
            <div className="mt-4 space-y-3">
              {surat.template.persyaratan.map((syarat) => {
                // Cek apakah file untuk syarat ini sudah ada di database
                const uploadedFile = surat.filePersyaratan?.find(file => 
                  file.includes(syarat.replace(/\s/g, '_'))
                );
                return (
                  <RequirementUploader
                    key={syarat}
                    suratId={surat.id}
                    requirement={syarat}
                    uploadedFile={uploadedFile}
                    onUploadSuccess={fetchSuratDetail}
                  />
                );
              })}
            </div>
          </div>
        )}
        {/* Sisipkan kode ini di antara blok "Unggah Berkas" dan "Riwayat Proses" */}
          {uiStatus === 'MENGISI_BERKAS' && allFilesUploaded && (
          <div className="mt-6 rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="font-bold text-accent-dark">Semua Berkas Lengkap</h3>
            <p className="mt-1 text-sm text-gray-600">Anda telah mengunggah semua berkas yang diperlukan. Silakan ajukan untuk diverifikasi oleh staf desa.</p>
            <button
              onClick={handleAjukanVerifikasi}
              disabled={isSubmitting}
              className="mt-4 w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {isSubmitting ? 'Mengajukan...' : 'Ajukan Verifikasi Sekarang'}
            </button>
          </div>
        )}
        {uiStatus === 'PENDING' && (
        <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-md font-bold text-accent-dark sm:text-lg">
            Menunggu Verifikasi
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Berkas Anda sedang diperiksa oleh staf desa.
          </p>
        </div>
      )}
        <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-md font-bold text-accent-dark sm:text-lg">Riwayat Proses Pengajuan</h3>
          <ul className="mt-4 space-y-4">
            {surat.riwayat.map(log => (
              <li key={log.id} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">✓</div>
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
