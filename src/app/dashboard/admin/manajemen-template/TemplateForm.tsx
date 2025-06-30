// src/app/dashboard/admin/manajemen-template/TemplateForm.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import TiptapEditor from '@/app/components/TiptapEditor'; // Pastikan path ini benar
import { TemplateSurat } from '@/generated/prisma';

interface TemplateFormProps {
  initialData?: TemplateSurat | null;
  isEditMode: boolean;
}

export default function TemplateForm({ initialData, isEditMode }: TemplateFormProps) {
  const [namaSurat, setNamaSurat] = useState('');
  const [kodeSurat, setKodeSurat] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [persyaratan, setPersyaratan] = useState('');
  const [templateHtml, setTemplateHtml] = useState('<p>Ketik isi surat di sini...</p>');
  const [isActive, setIsActive] = useState(true);

  const [isSaving, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (isEditMode && initialData) {
      setNamaSurat(initialData.namaSurat);
      setKodeSurat(initialData.kodeSurat);
      setDeskripsi(initialData.deskripsi || '');
      setPersyaratan((initialData.persyaratan || []).join('\n'));
      setTemplateHtml(initialData.templateHtml);
      setIsActive(initialData.isActive);
    }
  }, [initialData, isEditMode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const url = isEditMode ? `/api/admin/templates/${initialData?.id}` : '/api/admin/templates';
      const method = isEditMode ? 'PUT' : 'POST';

      try {
        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaSurat,
            kodeSurat,
            deskripsi,
            persyaratan: persyaratan.split('\n').filter(p => p.trim() !== ''),
            templateHtml,
            formSchema: [],
            isActive,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Gagal menyimpan template.');
        }
        alert(`Template berhasil di-${isEditMode ? 'perbarui' : 'simpan'}!`);
        router.push('/dashboard/admin/manajemen-template');
        router.refresh();
      } catch (error: any) {
        alert(`Error: ${error.message}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="namaSurat" className="block text-sm font-medium text-gray-700">Nama Surat</label>
          <input type="text" id="namaSurat" value={namaSurat} onChange={(e) => setNamaSurat(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="kodeSurat" className="block text-sm font-medium text-gray-700">Kode Unik Surat</label>
          <input type="text" id="kodeSurat" value={kodeSurat} onChange={(e) => setKodeSurat(e.target.value)} required disabled={isEditMode} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:cursor-not-allowed disabled:bg-gray-100" />
          {isEditMode && <p className="mt-1 text-xs text-gray-500">Kode surat tidak dapat diubah.</p>}
        </div>
      </div>
      <div>
        <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">Deskripsi Singkat</label>
        <textarea id="deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
      </div>
      <div>
        <label htmlFor="persyaratan" className="block text-sm font-medium text-gray-700">Persyaratan (satu per baris)</label>
        <textarea id="persyaratan" value={persyaratan} onChange={(e) => setPersyaratan(e.target.value)} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Contoh:&#10;Fotokopi KTP&#10;Fotokopi KK"></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Isi Konten Template Surat</label>
        <div className="mt-1">
          <TiptapEditor content={templateHtml} onChange={setTemplateHtml} />
        </div>
        <p className="mt-2 text-xs text-gray-500">Gunakan tombol "Sisipkan Placeholder" untuk menambahkan data dinamis.</p>
      </div>
      <div className="flex items-center">
          <input id="isActive" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Aktifkan template ini</label>
      </div>
      <div className="flex justify-end border-t pt-6">
        <button type="submit" disabled={isSaving} className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50">
          {isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan Template')}
        </button>
      </div>
    </form>
  );
}