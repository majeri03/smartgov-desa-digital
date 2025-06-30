// src/components/AppLayout.tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

// --- Komponen Ikon SVG (Praktik Bersih untuk menjaga keterbacaan) ---
const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} stroke="currentColor" fill="none" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} stroke="currentColor" fill="none" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// --- Definisi Tipe NavItem (Sesuai kode asli Anda) ---
type NavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
  // Efek untuk menangani redirect jika tidak terotentikasi
  if (status === 'unauthenticated') {
    router.replace('/login');
  }
  }, [status, router]);
  
  // --- Daftar Navigasi Lengkap (Sesuai kode asli Anda) ---
  let navItems: NavItem[] = [];
const userRole = session?.user.role;

if (userRole === 'WARGA') {
  navItems = [
    { href: '/dashboard', label: 'Utama' },
    { href: '/dashboard/jenis-surat', label: 'Ajukan Surat Baru' },
    { href: '/dashboard/status-surat', label: 'Lacak Pengajuan Saya' },
  ];
} else if (userRole === 'STAF') {
  navItems = [
    { href: '/dashboard/admin', label: 'Dasbor Verifikasi' },
  ];
} else if (userRole === 'KEPALA_DESA') {
  navItems = [
    { href: '/dashboard/kepala-desa/persetujuan', label: 'Dasbor Persetujuan' },
  ];
}

  return (
    <>
    {status === 'authenticated' ? (
    <div className="flex min-h-screen bg-secondary-off">
      {/* --- Sidebar (Kini sepenuhnya responsif) --- */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-primary text-secondary transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-primary-dark px-4">
            <h1 className="text-xl font-bold">SmartGov</h1>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <span className={`block rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary-dark' : 'hover:bg-primary-dark'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-primary-dark p-2">
            <button onClick={() => signOut()} className="w-full rounded-md px-4 py-2 text-left text-sm font-medium hover:bg-primary-dark">
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* --- Overlay (hanya untuk mobile saat sidebar terbuka) --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* --- Konten Utama (Kini memiliki header responsif) --- */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-secondary px-4 sm:px-6">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden">
            <MenuIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex-1"></div>
          <div className="text-right">
            <p className="font-semibold text-accent-dark">{session?.user?.email}</p>
            <p className="text-xs capitalize text-gray-500">
                {session?.user?.role?.toLowerCase().replace('_', ' ')}
            </p>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
      ) : (
    // TAMPILAN JIKA LOADING ATAU BELUM LOGIN (menunggu redirect)
    <div className="flex h-screen items-center justify-center bg-secondary-off">
      Memuat Sesi...
    </div>
  )}
</>
  );
}