// src/app/dashboard/profil/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/app/components/AppLayout';
import { Role } from '@/generated/prisma';

// Kita bisa gunakan kembali komponen uploader yang lama dengan sedikit modifikasi
const AssetUploader = ({ label, assetType, currentAssetUrl, onUploadComplete }: { label: string, assetType: 'tandatangan' | 'stempel' | 'fotoprofil', currentAssetUrl?: string | null, onUploadComplete: (assetType: string, filePath: string) => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    // Logika untuk menampilkan gambar yang sudah ada atau yang baru dipilih
    const displayUrl = previewUrl || currentAssetUrl;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        if (selectedFile.size > 2 * 1024 * 1024) { // Batas 2MB
          alert('Ukuran file terlalu besar (maks 2MB).');
          return;
        }
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setError(null);
      }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setError(null);
        try {
            const cleanFileName = `${assetType}-${Date.now()}.${file.name.split('.').pop()}`;
            const urlResponse = await fetch('/api/surat/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: cleanFileName, fileType: file.type, suratId: 'profil-aset' }),
            });
            if (!urlResponse.ok) throw new Error('Gagal mendapatkan izin unggah.');
            const { signedUrl, filePath } = await urlResponse.json();

            const uploadResponse = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
            if (!uploadResponse.ok) throw new Error('Proses unggah gagal.');

            onUploadComplete(assetType, filePath);
            setFile(null);
            URL.revokeObjectURL(previewUrl!);
            setPreviewUrl(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setError(null);
    };

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-2 flex flex-col items-start gap-3">
          {displayUrl && (
            <div className="w-full h-32 border rounded-md p-1">
              <img src={displayUrl} alt="Preview Aset" className="w-full h-full object-contain" />
            </div>
          )}
          
          <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-semibold hover:file:bg-gray-200"/>

          {file && (
            <div className="flex w-full items-center gap-3">
                <span className="flex-1 truncate text-sm text-gray-700" title={file.name}>{file.name}</span>
                <button onClick={handleUpload} disabled={isUploading} className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                  {isUploading ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={handleCancel} disabled={isUploading} className="shrink-0 text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
                  Batal
                </button>
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
};

export default function ProfilPage() {
  const { data: session, status, update: updateSession } = useSession();
  const [ttdUrl, setTtdUrl] = useState<string | null>(null);
  const [stempelUrl, setStempelUrl] = useState<string | null>(null);

  // Fungsi untuk mendapatkan signed URL yang aman untuk ditampilkan
  const getSignedUrl = async (filePath: string, setter: (url: string | null) => void) => {
    try {
        const res = await fetch('/api/admin/berkas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath }),
        });
        if (!res.ok) { setter(null); return; }
        const { signedUrl } = await res.json();
        setter(signedUrl);
    } catch {
        setter(null);
    }
  };

  useEffect(() => {
    if (session?.user.urlTandaTangan) {
        getSignedUrl(session.user.urlTandaTangan, setTtdUrl);
    }
    if (session?.user.urlStempel) {
        getSignedUrl(session.user.urlStempel, setStempelUrl);
    }
  }, [session]);

  const handleAssetUpdate = async (assetType: string, filePath: string) => {
    try {
        const body = assetType === 'tandatangan' ? { urlTandaTangan: filePath } 
                  : assetType === 'stempel' ? { urlStempel: filePath }
                  : { urlFotoProfil: filePath };

        const response = await fetch('/api/users/profile/aset', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error('Gagal menyimpan aset.');

        alert('Aset berhasil diperbarui!');
        
        // Memaksa sesi untuk memuat ulang datanya dari backend
        await updateSession();

    } catch (error: any) {
        alert(`Gagal menyimpan aset: ${error.message}`);
    }
  };

  if (status === 'loading') return <AppLayout><p>Memuat profil...</p></AppLayout>;
  if (!session) return <AppLayout><p>Sesi tidak ditemukan.</p></AppLayout>

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Profil Saya</h1>
      <div className="space-y-8 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Informasi Akun</h3>
          <p className="mt-2 text-md text-gray-700"><strong>Nama:</strong> {session.user.namaLengkap}</p>
          <p className="text-md text-gray-700"><strong>NIK:</strong> {session.user.nik}</p>
          <p className="text-md text-gray-700"><strong>Email:</strong> {session.user.email}</p>
          <p className="text-md text-gray-700"><strong>Peran:</strong> {session.user.role}</p>
        </div>

        {session.user.role === Role.KEPALA_DESA && (
          <div className="space-y-6 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
            <h3 className="text-lg font-bold text-gray-900">Manajemen Aset Digital (Khusus Kepala Desa)</h3>
            <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-8'>
              <AssetUploader 
                label="Gambar Tanda Tangan" 
                assetType="tandatangan" 
                currentAssetUrl={ttdUrl} 
                onUploadComplete={handleAssetUpdate} 
              />
              <AssetUploader 
                label="Gambar Stempel" 
                assetType="stempel" 
                currentAssetUrl={stempelUrl} 
                onUploadComplete={handleAssetUpdate} 
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}