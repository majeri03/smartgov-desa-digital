// src/app/dashboard/jenis-surat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/app/components/AppLayout';
import Link from 'next/link';

// Definisikan tipe data untuk konsistensi dengan API
interface Template {
  id: string;
  kodeSurat: string;
  namaSurat: string;
  deskripsi: string;
  persyaratan: string[];
}

// Komponen untuk menampilkan kartu surat
const SuratCard = ({ template }: { template: Template }) => (
  // MODIFIKASI: Menambahkan h-full dan padding responsif (p-4 sm:p-6)
  <div className="flex h-full flex-col justify-between rounded-lg border bg-secondary p-4 shadow-md transition-shadow hover:shadow-lg sm:p-6">
    <div>
      {/* MODIFIKASI: Ukuran judul kartu kini responsif */}
      <h3 className="text-lg font-bold text-accent-dark sm:text-xl">{template.namaSurat}</h3>
      <p className="mt-2 text-sm text-gray-600">{template.deskripsi}</p>
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-800">Persyaratan:</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {template.persyaratan.map((syarat, index) => (
            <li key={index}>{syarat}</li>
          ))}
        </ul>
      </div>
    </div>
    <div className="mt-6">
      <Link href={`/dashboard/formulir-pengajuan/${template.kodeSurat}`}>
        <span className="inline-block w-full rounded-md bg-primary px-4 py-2 text-center font-semibold text-white hover:bg-primary-dark">
          Ajukan Surat Ini
        </span>
      </Link>
    </div>
  </div>
);

export default function JenisSuratPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/surat/templates');
        if (!response.ok) {
          throw new Error('Gagal memuat data.');
        }
        const data = await response.json();
        setTemplates(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []); // Dependency array kosong agar hanya berjalan sekali saat komponen dimuat

  const renderContent = () => {
    if (isLoading) {
      return <p>Memuat daftar jenis surat...</p>;
    }
    if (error) {
      return <p className="text-red-500">Error: {error}</p>;
    }
    if (templates.length === 0) {
      return <p>Saat ini belum ada jenis surat yang tersedia.</p>;
    }
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <SuratCard key={template.id} template={template} />
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      {/* MODIFIKASI: Ukuran judul halaman kini responsif */}
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Pilih Jenis Surat</h1>
      {renderContent()}
    </AppLayout>
  );
}