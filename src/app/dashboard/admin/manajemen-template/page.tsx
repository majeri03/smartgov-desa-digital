// src/app/dashboard/admin/manajemen-template/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';
import { TemplateSurat } from '@/generated/prisma';
import Link from 'next/link';

export default function ManajemenTemplatePage() {
  const [templates, setTemplates] = useState<TemplateSurat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/templates');
        if (!response.ok) throw new Error('Gagal memuat data template.');
        const data = await response.json();
        setTemplates(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleDelete = async (templateId: string, templateName: string) => {
    const confirmation = confirm(`PERINGATAN: Anda akan menghapus template "${templateName}" secara permanen. Aksi ini tidak dapat dibatalkan. Lanjutkan?`);
    if (!confirmation) return;

    try {
        const response = await fetch(`/api/admin/templates/${templateId}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Gagal menghapus template.');

        alert('Template berhasil dihapus.');
        // Refresh daftar template dengan menghapus item
        setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error: any) {
        alert(`Error: ${error.message}`);
        }
    };

  const renderContent = () => {
    if (isLoading) return <p>Memuat daftar template...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (templates.length === 0) return <p>Belum ada template surat yang dibuat.</p>;

    return (
      <div>
        {/* Tampilan Kartu untuk Mobile */}
        <div className="grid grid-cols-1 gap-4 sm:hidden">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-bold text-accent-dark">{template.namaSurat}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {template.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">Kode: {template.kodeSurat}</p>
              <div className="mt-4 flex justify-end gap-4">
                    <button onClick={() => router.push(`/dashboard/admin/manajemen-template/edit/${template.id}`)} className="text-sm font-semibold text-primary hover:underline">
                    Edit
                    </button>
                    <button onClick={() => handleDelete(template.id, template.namaSurat)} className="text-sm font-semibold text-red-600 hover:underline">
                    Hapus
                    </button>
                </div>
            </div>
          ))}
        </div>

        {/* Tampilan Tabel untuk Desktop */}
        <div className="hidden overflow-x-auto rounded-lg border bg-white shadow-sm sm:block">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-900">Nama Template</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-900">Kode Surat</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-900">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">{template.namaSurat}</td>
                  <td className="px-4 py-2 text-gray-700">{template.kodeSurat}</td>
                  <td className="px-4 py-2">
                     <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                       template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                     }`}>
                       {template.isActive ? 'Aktif' : 'Nonaktif'}
                     </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push(`/dashboard/admin/manajemen-template/edit/${template.id}`)} className="font-semibold text-primary hover:underline">Edit</button>
                        <button onClick={() => handleDelete(template.id, template.namaSurat)} className="font-semibold text-red-600 hover:underline">Hapus</button>
                    </div>
                  </td>
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
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl">Manajemen Template Surat</h1>
        <Link href="/dashboard/admin/manajemen-template/baru">
            <span className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark">
                + Tambah Template Baru
            </span>
        </Link>
      </div>
      <p className="mb-6 mt-1 text-gray-600">Tambah, ubah, atau nonaktifkan jenis layanan surat yang tersedia.</p>
      {renderContent()}
    </AppLayout>
  );
}