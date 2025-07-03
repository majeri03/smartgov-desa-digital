// src/app/login/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Komponen Ilustrasi tetap sama, karena logikanya sudah responsif (hidden di mobile)
const AuthIllustration = () => (
  <div className="flex h-full flex-col items-center justify-center bg-primary p-10 text-secondary">
    <div className="w-full max-w-md text-center">
      <h1 className="text-3xl font-bold md:text-4xl">SmartGov Desa Digital</h1>
      <p className="mt-4 text-base text-secondary/80 md:text-lg">
        Solusi cerdas untuk mengelola administrasi desa secara terintegrasi dan efisien.
      </p>
      <div className="mt-8 flex h-64 w-full items-center justify-center rounded-lg bg-primary-dark opacity-50">
        <p className="text-secondary">[Ilustrasi Login]</p>
      </div>
    </div>
  </div>
);

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', { redirect: false, email, password });
      if (result?.error) {
        setError('Email atau Password salah.');
      } else {
        router.replace(callbackUrl);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Kolom Ilustrasi: disembunyikan di bawah breakpoint 'lg' */}
      <div className="hidden lg:block">
        <AuthIllustration />
      </div>
      
      {/* Kolom Form: selalu terlihat */}
      <main className="flex w-full flex-col items-center justify-center bg-secondary-off p-6 sm:p-8">
        <div className="w-full max-w-sm">
          {/* Header untuk Mobile: terlihat di bawah breakpoint 'lg' */}
          <div className="mb-8 text-center lg:hidden">
             <h1 className="text-3xl font-bold text-accent-dark">SmartGov</h1>
          </div>

          <div className="mb-8 text-left">
            <h2 className="text-2xl font-bold text-accent-dark md:text-3xl">Masuk ke Akun Anda</h2>
            <p className="text-gray-500">Selamat datang kembali!</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">{error}</div>}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary" required />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary" required />
              </div>
            </div>
            <div className="mt-6">
              <button type="submit" disabled={isLoading} className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50">
                {isLoading ? 'Memproses...' : 'Login'}
              </button>
            </div>
          </form>
          <p className="mt-8 text-center text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}