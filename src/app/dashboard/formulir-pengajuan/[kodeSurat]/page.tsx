// src/app/dashboard/formulir-pengajuan/[kodeSurat]/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';

// Definisikan tipe data untuk skema form & template
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date';
  placeholder?: string;
}

interface TemplateData {
  id: string;
  namaSurat: string;
  persyaratan: string[];
  formSchema: FormField[];
}

// Komponen untuk merender satu input field secara dinamis
const DynamicFormField = ({ field, value, onChange, disabled = false }: { field: FormField, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, disabled?: boolean }) => {
    const commonProps = {
        id: field.name,
        name: field.name,
        value: value || '',
        onChange,
        className: "w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed",
        required: true,
        disabled,
    };

    if (field.type === 'textarea') {
      return <textarea {...commonProps} placeholder={field.placeholder} rows={3}></textarea>;
    }
    return <input type={field.type} {...commonProps} placeholder={field.placeholder} />;
};

export default function FormulirPengajuanPage() {
  const params = useParams();
  const router = useRouter();
  const kodeSurat = params.kodeSurat as string;

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    if (!kodeSurat) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [templateRes, profileRes] = await Promise.all([
          fetch(`/api/surat/templates/${kodeSurat}`),
          fetch('/api/users/profile')
        ]);

        if (!templateRes.ok) throw new Error('Gagal memuat detail formulir.');
        if (!profileRes.ok) throw new Error('Gagal memuat profil pengguna.');

        const templateData: TemplateData = await templateRes.json();
        const profileData = await profileRes.json();

        if (typeof templateData.formSchema === 'string') {
          templateData.formSchema = JSON.parse(templateData.formSchema);
        }

        setTemplate(templateData);

        setFormData({
            namaLengkap: profileData.namaLengkap || '',
            nik: profileData.nik || '',
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [kodeSurat]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    if (!template) {
        setError("Template data tidak tersedia.");
        return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/surat/pengajuan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              templateId: template.id,
              formData: formData,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Gagal mengirim pengajuan.');
        }
        alert('Pengajuan Anda telah berhasil dikirim! Anda akan diarahkan ke halaman status surat.');
        router.push(`/dashboard/status-surat/${result.data.id}`);
      } catch (err: any) {
        setError(err.message);
      }
    });
  };
  
  if (isLoading) return <AppLayout><p>Memuat formulir...</p></AppLayout>;
  if (error) return <AppLayout><p className="text-red-500">Error: {error}</p></AppLayout>;
  if (!template) return <AppLayout><p>Template tidak ditemukan.</p></AppLayout>;

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl">{template.namaSurat}</h1>
        <p className="mt-2 text-gray-600">Lengkapi data-data di bawah ini dengan benar.</p>

        <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 sm:p-6">
          <h4 className="font-semibold text-yellow-800">Persyaratan yang Harus Disiapkan:</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-yellow-700">
            {template.persyaratan.map((syarat, i) => <li key={i}>{syarat}</li>)}
            <li className="font-bold">Semua persyaratan diunggah dalam bentuk file gambar/PDF di langkah berikutnya.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4 rounded-md border bg-gray-50 p-4 mb-6">
                <div>
                    <label htmlFor="namaLengkap" className="mb-2 block text-sm font-medium text-gray-500">
                    Nama Lengkap Pemohon (Otomatis)
                    </label>
                    <input
                    id="namaLengkap"
                    type="text"
                    value={formData.namaLengkap || ''}
                    className="w-full rounded-lg border-gray-300 bg-gray-200 cursor-not-allowed"
                    disabled 
                    readOnly
                    />
                </div>
                <div>
                    <label htmlFor="nik" className="mb-2 block text-sm font-medium text-gray-500">
                    NIK Pemohon (Otomatis)
                    </label>
                    <input
                    id="nik"
                    type="text"
                    value={formData.nik || ''}
                    className="w-full rounded-lg border-gray-300 bg-gray-200 cursor-not-allowed"
                    disabled
                    readOnly
                    />
                </div>
              </div>
          {(Array.isArray(template.formSchema) ? template.formSchema : []).map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="mb-2 block text-sm font-medium text-gray-700">{field.label}</label>
              <DynamicFormField field={field} value={formData[field.name]} onChange={handleFormChange} />
            </div>
          ))}
          
          <div className="pt-4">
             <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-primary-dark sm:px-6 sm:py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-primary/50">
              {isSubmitting ? 'Mengirim...' : 'Lanjutkan ke Unggah Berkas'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}