// src/app/dashboard/admin/pengaturan/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import AppLayout from '@/app/components/AppLayout';
import { PengaturanDesa } from '@/generated/prisma';

// Ganti komponen LogoUploader yang lama dengan versi baru ini
const LogoUploader = ({ onUploadComplete }: { onUploadComplete: (url: string) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      // Logika untuk mendapatkan signedUrl dan mengunggah tetap sama
      const urlResponse = await fetch('/api/surat/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `logo_desa.${file.name.split('.').pop()}`, fileType: file.type, suratId: 'pengaturan_desa' }),
      });
      if (!urlResponse.ok) throw new Error('Gagal mendapatkan izin unggah logo.');
      const { signedUrl, filePath } = await urlResponse.json();
      const uploadResponse = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!uploadResponse.ok) throw new Error('Proses unggah logo gagal.');


      onUploadComplete(filePath); // Panggil callback ke parent
      setFile(null); // Reset setelah sukses
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <input type="file" accept="image/png, image/jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-semibold hover:file:bg-gray-200 sm:w-auto" />
        {file && (
            <div className="flex items-center gap-2">
                <button onClick={handleUpload} disabled={isUploading} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                    {isUploading ? '...' : 'Gunakan File Ini'}
                </button>
                <button onClick={() => setFile(null)} className="text-xs text-gray-500 hover:underline">Batal</button>
            </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default function PengaturanPage() {
  const [settings, setSettings] = useState<Partial<PengaturanDesa>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, startTransition] = useTransition();
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/pengaturan');
        if (response.ok) {
          const data = await response.json();
          if (data) setSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
  if (settings.logoDesaUrl) {
    const getLogoUrl = async () => {
      try {
        const response = await fetch('/api/admin/berkas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: settings.logoDesaUrl }),
        });
        if (!response.ok) return;
        const { signedUrl } = await response.json();
        setLogoPreviewUrl(signedUrl);
      } catch (error) {
        console.error("Failed to get logo preview URL", error);
        setLogoPreviewUrl(null);
      }
    };
    getLogoUrl();
  } else {
    setLogoPreviewUrl(null);
  }
}, [settings.logoDesaUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // TODO: Implementasi logika upload logo
  const handleLogoUploadComplete = (filePath: string) => {
  setSettings(prev => ({ ...prev, logoDesaUrl: filePath })); // Simpan filePath ke state
  alert('Logo berhasil diunggah. Jangan lupa klik "Simpan Pengaturan" untuk menyimpan perubahan.');
}

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/pengaturan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
        if (!response.ok) throw new Error('Gagal menyimpan pengaturan.');
        alert('Pengaturan berhasil disimpan!');
      } catch (error) {
        alert('Terjadi kesalahan saat menyimpan.');
      }
    });
  };

  if (isLoading) {
      return <AppLayout><p>Memuat pengaturan...</p></AppLayout>
  }

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Pengaturan Desa</h1>
      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border bg-white p-4 shadow-sm sm:p-6">

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="namaDesa" className="block text-sm font-medium text-gray-700">Nama Desa</label>
            <input type="text" name="namaDesa" id="namaDesa" value={settings.namaDesa || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label htmlFor="kecamatan" className="block text-sm font-medium text-gray-700">Kecamatan</label>
            <input type="text" name="kecamatan" id="kecamatan" value={settings.kecamatan || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label htmlFor="kabupaten" className="block text-sm font-medium text-gray-700">Kabupaten/Kota</label>
            <input type="text" name="kabupaten" id="kabupaten" value={settings.kabupaten || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label htmlFor="provinsi" className="block text-sm font-medium text-gray-700">Provinsi</label>
            <input type="text" name="provinsi" id="provinsi" value={settings.provinsi || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="alamatKantor" className="block text-sm font-medium text-gray-700">Alamat Lengkap Kantor Desa</label>
            <textarea name="alamatKantor" id="alamatKantor" value={settings.alamatKantor || ''} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="teleponKantor" className="block text-sm font-medium text-gray-700">No. Telepon Kantor</label>
                <input type="text" name="teleponKantor" id="teleponKantor" value={settings.teleponKantor || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
               <div>
                <label htmlFor="emailDesa" className="block text-sm font-medium text-gray-700">Email Desa</label>
                <input type="email" name="emailDesa" id="emailDesa" value={settings.emailDesa || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
          </div>
        </div>

       <div>
        <label className="block text-sm font-medium text-gray-700">Logo Desa</label>
        <div className="mt-2 space-y-4">
            {/* Bagian untuk menampilkan logo yang sudah ada */}
            {logoPreviewUrl && <img src={logoPreviewUrl} alt="Logo Desa"  />}

            {/* Bagian untuk mengunggah logo baru */}
            <div>
            <p className="text-xs text-gray-500 mb-2">Pilih logo baru untuk diunggah:</p>
            <LogoUploader onUploadComplete={handleLogoUploadComplete} />
            </div>
        </div>
        </div>

        <div className="flex justify-end border-t pt-6">
          <button type="submit" disabled={isSaving} className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50">
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}