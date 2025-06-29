// src/app/dashboard/page.tsx
import AppLayout from "@/app/components/AppLayout";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div>
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl">Selamat Datang di Dashboard</h1>
         <p className="mt-2 text-gray-600 md:text-lg">
          Pilih menu di samping untuk memulai layanan administrasi desa.
        </p>
      </div>
      {/* Di sini kita akan menambahkan konten dashboard seperti kartu menu, dll. */}
    </AppLayout>
  );
}