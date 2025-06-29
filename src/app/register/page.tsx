// src/app/register/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Komponen Ilustrasi (bisa direfaktor menjadi komponen bersama nanti)
const AuthIllustration = () => (
    <div className="flex h-full flex-col items-center justify-center bg-primary p-10 text-secondary">
    <div className="w-full max-w-md text-center">
      <h1 className="text-3xl font-bold md:text-4xl">SmartGov Desa Digital</h1>
      <p className="mt-4 text-base text-secondary/80 md:text-lg">
        Satu langkah mudah untuk pelayanan desa yang modern, transparan, dan akuntabel.
      </p>
      <div className="mt-8 flex h-64 w-full items-center justify-center rounded-lg bg-primary-dark opacity-50">
        <p className="text-secondary">[Ilustrasi Registrasi]</p>
      </div>
    </div>
  </div>
);

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    namaLengkap: '', nik: '', email: '', password: '', confirmPassword: '',
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
          body: JSON.stringify({ ...formData }),
        });
        const data = await response.json();
        if (!response.ok) { throw new Error(data.message || 'Terjadi kesalahan.'); }
        alert('Pendaftaran berhasil! Silakan login.');
        router.push('/login');
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="hidden lg:block">
        <AuthIllustration />
      </div>
      <main className="flex w-full flex-col items-center justify-center bg-secondary-off p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
             <h1 className="text-3xl font-bold text-accent-dark">SmartGov</h1>
          </div>
          <div className="mb-8 text-left">
            <h2 className="text-2xl font-bold text-accent-dark md:text-3xl">Buat Akun Baru</h2>
            <p className="text-gray-500">Lengkapi data diri Anda untuk memulai.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">{error}</div>}
            <div className="space-y-4">
              <div>
                <label htmlFor="namaLengkap" className="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input id="namaLengkap" type="text" value={formData.namaLengkap} onChange={handleChange} className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary" required />
              </div>
              <div>
                <label htmlFor="nik" className="mb-1 block text-sm font-medium text-gray-700">NIK</label>
                <input id="nik" type="text" maxLength={16} value={formData.nik} onChange={handleChange} className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary" required />
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input id="email" type="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary" required />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <input id="password" type="password" value={formData.password} onChange={handleChange} className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary" required />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">Konfirmasi Password</label>
                <input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary" required />
              </div>
            </div>
            <div className="mt-6">
              <button type="submit" disabled={isPending} className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50">
                {isPending ? 'Memproses...' : 'Daftar Akun'}
              </button>
            </div>
          </form>
          <p className="mt-8 text-center text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}