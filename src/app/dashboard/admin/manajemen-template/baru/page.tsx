// // src/app/dashboard/admin/manajemen-template/baru/page.tsx
// 'use client';

// import { useState, useTransition } from 'react';
// import { useRouter } from 'next/navigation';
// import AppLayout from '@/app/components/AppLayout';
// import TiptapEditor from '@/app/components/TiptapEditor';

// export default function TambahTemplatePage() {
//   const [namaSurat, setNamaSurat] = useState('');
//   const [kodeSurat, setKodeSurat] = useState('');
//   const [deskripsi, setDeskripsi] = useState('');
//   const [persyaratan, setPersyaratan] = useState('');
//   const [templateHtml, setTemplateHtml] = useState('');

//   const [isSaving, startTransition] = useTransition();
//   const router = useRouter();

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     startTransition(async () => {
//       try {
//         const response = await fetch('/api/admin/templates', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             namaSurat,
//             kodeSurat,
//             deskripsi,
//             persyaratan: persyaratan.split('\n').filter(p => p.trim() !== ''), // Ubah teks menjadi array
//             templateHtml,
//           }),
//         });
//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.message || 'Gagal membuat template.');
//         }
//         alert('Template baru berhasil dibuat!');
//         router.push('/dashboard/admin/manajemen-template');
//       } catch (error: any) {
//         alert(`Error: ${error.message}`);
//       }
//     });
//   };

//   return (
//     <AppLayout>
//       <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Tambah Template Surat Baru</h1>
//       <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
//         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//           <div>
//             <label htmlFor="namaSurat" className="block text-sm font-medium text-gray-700">Nama Surat</label>
//             <input type="text" id="namaSurat" value={namaSurat} onChange={(e) => setNamaSurat(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//           </div>
//           <div>
//             <label htmlFor="kodeSurat" className="block text-sm font-medium text-gray-700">Kode Unik Surat (tanpa spasi, misal: SKD)</label>
//             <input type="text" id="kodeSurat" value={kodeSurat} onChange={(e) => setKodeSurat(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//           </div>
//         </div>
//         <div>
//           <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">Deskripsi Singkat</label>
//           <textarea id="deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
//         </div>
//         <div>
//           <label htmlFor="persyaratan" className="block text-sm font-medium text-gray-700">Persyaratan (satu per baris)</label>
//           <textarea id="persyaratan" value={persyaratan} onChange={(e) => setPersyaratan(e.target.value)} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Contoh:&#10;Fotokopi KTP&#10;Fotokopi KK"></textarea>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Isi Konten Template Surat</label>
//           <div className="mt-1">
//             <TiptapEditor content={templateHtml} onChange={setTemplateHtml} />
//           </div>
//           <p className="mt-2 text-xs text-gray-500">Gunakan tombol "Sisipkan Placeholder" untuk menambahkan data dinamis seperti dll.</p>
//         </div>
//         <div className="flex justify-end border-t pt-6">
//           <button type="submit" disabled={isSaving} className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50">
//             {isSaving ? 'Menyimpan...' : 'Simpan Template'}
//           </button>
//         </div>
//       </form>
//     </AppLayout>
//   );
// }

// src/app/dashboard/admin/manajemen-template/baru/page.tsx
'use client';

import AppLayout from "@/app/components/AppLayout";
import TemplateForm from "../TemplateForm";

export default function TambahTemplatePage() {
  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-accent-dark sm:text-3xl">Tambah Template Surat Baru</h1>
      <TemplateForm isEditMode={false} />
    </AppLayout>
  );
}