'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { ApiError, friendlyMessage } from '@/shared/api/client';
import { login } from '../api';

function safeNext(value: string | null) {
  // Only allow internal admin paths to avoid open redirects.
  return value && /^\/admin(\/[\w\-/]*)?$/.test(value) && !value.startsWith('/admin/login') ? value : '/admin/dashboard';
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const data = new FormData(event.currentTarget);

    try {
      await login(String(data.get('email') ?? '').trim(), String(data.get('password') ?? ''));
      router.replace(safeNext(params.get('next')));
    } catch (err) {
      setError(
        err instanceof ApiError && (err.status === 401 || err.status === 400)
          ? 'Correo o contraseña incorrectos.'
          : friendlyMessage(err),
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="login-email">Correo electrónico</label>
        <input id="login-email" type="email" name="email" autoComplete="username" required />
      </div>
      <div>
        <label htmlFor="login-password">Contraseña</label>
        <input id="login-password" type="password" name="password" autoComplete="current-password" required minLength={8} />
      </div>
      <button className="button primary button--block" type="submit" disabled={loading}>
        {loading ? 'Verificando…' : 'Iniciar sesión'}
      </button>
      <div aria-live="polite">{error ? <p className="alert error" role="alert">{error}</p> : null}</div>
    </form>
  );
}

export function LoginScreen() {
  return (
    <main className="admin-center">
      <div className="admin-card admin-card--narrow admin-login">
        <span className="brand__mark" aria-hidden="true">
          MI
        </span>
        <h1>Acceso administrativo</h1>
        <p className="hint">Mantenimientos Integrales y Construcciones</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
