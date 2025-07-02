// src/app/dashboard/admin/manajemen-template/edit/[id]/page.tsx (SUDAH DIPERBAIKI)
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';
import TemplateForm from '../../TemplateForm'; // Path yang benar sesuai struktur Anda
import { TemplateSurat } from '@/generated/prisma';

export default function EditTemplatePage() {
  const params = useParams();
  const id = params.id as string;
  const [template, setTemplate] = useState<TemplateSurat | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect untuk mengambil data dari API, ini sudah benar!
  useEffect(() => {
    if (!id) return;
    const fetchTemplate = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/templates/${id}`);
        if (!response.ok) {
          throw new Error('Gagal memuat data template.');
        }
        const data = await response.json();
        setTemplate(data); // Simpan data ke dalam state 'template'
      } catch (error) {
        console.error("Fetch Template Error:", error);
        alert("Error: Tidak dapat memuat data template.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  if (isLoading) {
    return <AppLayout><p>Memuat data template...</p></AppLayout>;
  }
  
  // Jika template tidak ditemukan setelah loading selesai
  if (!template) {
    return <AppLayout><p>Data template tidak ditemukan atau gagal dimuat.</p></AppLayout>;
  }

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Edit Template Surat</h1>
      {/* PERUBAHAN KUNCI: 
        Kirim 'template' yang sudah terisi data dari state ke dalam komponen TemplateForm.
      */}
      <TemplateForm isEditMode={true} initialData={template} />
    </AppLayout>
  );
}