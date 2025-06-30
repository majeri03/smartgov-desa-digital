// src/app/dashboard/profil/page.tsx
'use client';

import { useEffect, useState,useCallback } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/app/components/AppLayout';
import { Prisma, Role } from '@/generated/prisma';

type UserProfilePayload = Prisma.UserProfileGetPayload<{
  include: { user: true }
}>;

// Kita bisa gunakan kembali komponen uploader dengan sedikit modifikasi
const AssetUploader = ({ label, assetType, currentAssetUrl, onUploadComplete }: { label: string, assetType: 'tandatangan' | 'stempel' | 'fotoprofil', currentAssetUrl?: string | null, onUploadComplete: (assetType: string, filePath: string) => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setError(null);
        setPreviewUrl(null)
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
            setPreviewUrl(null)
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) { // Batas 2MB untuk aset
        alert('Ukuran file terlalu besar (maks 2MB).');
        return;
      }
      setFile(selectedFile);
      // Membuat URL sementara untuk preview di browser
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };
      const handleCancel = () => {
      setFile(null);
      setPreviewUrl(null); // Hapus juga URL preview-nya
      setError(null);
      // Jika Anda menggunakan <input type="file">, Anda mungkin perlu mereset nilainya
      // const input = document.getElementById(`file-input-${assetType}`) as HTMLInputElement;
      // if (input) input.value = '';
    };
  // Di dalam komponen AssetUploader
return (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="mt-2 flex flex-col items-start gap-3">
      {!file ? (
          <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-semibold hover:file:bg-gray-200"/>
      ) : (
        <div className="flex w-full items-center gap-3">
           {/* Logika Prioritas: Tampilkan preview, jika tidak ada, tampilkan yang sudah tersimpan */}
  {previewUrl ? (
    <img src={previewUrl} alt="Preview" className="h-full w-full object-contain p-1" />
  ) : currentAssetUrl ? (
    <img src={currentAssetUrl} alt="Aset Tersimpan" className="h-full w-full object-contain p-1" />
  ) : (
    <span className="text-xs text-gray-400">Belum Ada Gambar</span>
  )}
            <span className="flex-1 truncate text-sm text-gray-700" title={file.name}>{file.name}</span>
            <button onClick={handleUpload} disabled={isUploading} className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              {isUploading ? 'Menyimpan...' : 'Simpan Perubahan'}
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
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfilePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ttdPreviewUrl, setTtdPreviewUrl] = useState<string | null>(null);
  const [stempelPreviewUrl, setStempelPreviewUrl] = useState<string | null>(null);
  const fetchProfile = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data ? { ...data, user: session.user } : null);
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);
  
  useEffect(() => {
  fetchProfile();
}, [fetchProfile]); // Sekarang kita bergantung pada fungsi fetchProfile itu sendiri

  // Pastikan useEffect ini ada di dalam ProfilPage
  useEffect(() => {
  const getSignedUrl = async (filePath: string) => {
    const res = await fetch('/api/admin/berkas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    if (!res.ok) return null;
    const { signedUrl } = await res.json();
    return signedUrl;
  };

  if (profile?.urlTandaTangan) {
    getSignedUrl(profile.urlTandaTangan).then(url => setTtdPreviewUrl(url));
  }
  if (profile?.urlStempel) {
    getSignedUrl(profile.urlStempel).then(url => setStempelPreviewUrl(url));
  }
}, [profile]);

  
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

        // Paksa pengambilan ulang data profil untuk memicu semua pembaruan
        fetchProfile();

    } catch (error: any) {
        alert(`Gagal menyimpan aset: ${error.message}`);
    }
  };

  if (isLoading) return <AppLayout><p>Memuat profil...</p></AppLayout>;

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Profil Saya</h1>
      <div className="space-y-8 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Informasi Akun</h3>
          <p className="mt-2 text-md text-gray-700"><strong>Nama:</strong> {profile?.namaLengkap}</p>
          <p className="text-md text-gray-700"><strong>NIK:</strong> {profile?.nik}</p>
          <p className="text-md text-gray-700"><strong>Email:</strong> {profile?.user?.email}</p>
          <p className="text-md text-gray-700"><strong>Peran:</strong> {profile?.user?.role}</p>
        </div>

        {session?.user.role === Role.KEPALA_DESA && (
          <div className="space-y-6 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
            <h3 className="text-lg font-bold text-gray-900">Manajemen Aset Digital (Khusus Kepala Desa)</h3>
             <div className='mt-4 space-y-8'>
  {/* --- Kelompok untuk Tanda Tangan --- */}
  <div>
    <h4 className="text-md font-semibold text-gray-800">Gambar Tanda Tangan</h4>
    <div className="mt-2">
      <AssetUploader 
        label="Ubah Tanda Tangan" 
        assetType="tandatangan" 
        currentAssetUrl={ttdPreviewUrl} 
        onUploadComplete={handleAssetUpdate} 
      />
    </div>
  </div>

  {/* --- Kelompok untuk Stempel --- */}
  <div>
    <h4 className="text-md font-semibold text-gray-800">Gambar Stempel</h4>
    <div className="mt-2">
      <AssetUploader 
        label="Ubah Stempel" 
        assetType="stempel" 
        currentAssetUrl={stempelPreviewUrl} 
        onUploadComplete={handleAssetUpdate} 
      />
    </div>
  </div>
</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}