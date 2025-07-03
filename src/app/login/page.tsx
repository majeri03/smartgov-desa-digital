// src/app/login/page.tsx
import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Memuat halaman login...</div>}>
      <LoginForm />
    </Suspense>
  );
}