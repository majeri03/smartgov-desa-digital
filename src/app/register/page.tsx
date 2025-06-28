// src/app/registrasi/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    namaLengkap: '',
    nik: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }
    
    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaLengkap: formData.namaLengkap,
            nik: formData.nik,
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Menangani error validasi dari Zod atau error lainnya dari server
          if (data.errors) {
            const firstError = data.errors[0].message;
            throw new Error(firstError);
          }
          throw new Error(data.message || 'Terjadi kesalahan saat mendaftar.');
        }

        alert('Pendaftaran berhasil! Anda akan diarahkan ke halaman login.');
        router.push('/login');
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Daftar Akun Baru</h1>
          <p className="text-gray-600">Lengkapi data di bawah untuk memulai.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="namaLengkap" className="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap (sesuai KTP)</label>
              <input id="namaLengkap" type="text" value={formData.namaLengkap} onChange={handleChange} className="w-full rounded-md border-gray-300" required />
            </div>
            <div>
              <label htmlFor="nik" className="mb-1 block text-sm font-medium text-gray-700">NIK</label>
              <input id="nik" type="text" maxLength={16} value={formData.nik} onChange={handleChange} className="w-full rounded-md border-gray-300" required />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Alamat Email</label>
              <input id="email" type="email" value={formData.email} onChange={handleChange} className="w-full rounded-md border-gray-300" required />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input id="password" type="password" value={formData.password} onChange={handleChange} className="w-full rounded-md border-gray-300" required />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">Konfirmasi Password</label>
              <input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full rounded-md border-gray-300" required />
            </div>
          </div>

          <div className="mt-6">
            <button type="submit" disabled={isPending} className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400">
              {isPending ? 'Memproses...' : 'Daftar'}
            </button>
          </div>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Masuk
          </a>
        </p>
      </div>
    </main>
  );
}