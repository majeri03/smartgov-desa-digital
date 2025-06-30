// src/app/dashboard/admin/manajemen-template/edit/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';
import TemplateForm from '../../TemplateForm'; // Navigasi path ke atas
import { TemplateSurat } from '@/generated/prisma';

export default function EditTemplatePage() {
  const params = useParams();
  const id = params.id as string;
  const [template, setTemplate] = useState<TemplateSurat | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchTemplate = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/templates/${id}`);
        if (!response.ok) throw new Error('Gagal memuat data template.');
        const data = await response.json();
        setTemplate(data);
      } catch (error) {
        alert("Error memuat data template.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  if (isLoading) {
    return <AppLayout><p>Memuat data template...</p></AppLayout>;
  }

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Edit Template Surat</h1>
      <TemplateForm isEditMode={true} initialData={template} />
    </AppLayout>
  );
}