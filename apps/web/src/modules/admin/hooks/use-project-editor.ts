'use client';

import type { AdminProject } from '@repo/contracts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { mutate, useApi } from './use-api';

export type Notice = { kind: 'success' | 'error'; text: string } | null;

/** Loads one project and runs its mutations, reloading it and reporting the outcome after each one. */
export function useProjectEditor(id: string) {
  const router = useRouter();
  const { data: project, error, loading, reload } = useApi<AdminProject>(`/admin/projects/${id}`);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);

  async function run(path: string, init: RequestInit, success: string) {
    setBusy(true);
    setNotice(null);
    const failure = await mutate(path, init);
    setNotice(failure ? { kind: 'error', text: failure } : { kind: 'success', text: success });
    setBusy(false);
    if (!failure) await reload();
    return failure;
  }

  async function remove() {
    if (!window.confirm('¿Eliminar definitivamente este proyecto y sus imágenes?')) return;
    const failure = await mutate(`/admin/projects/${id}`, { method: 'DELETE' });
    if (failure) setNotice({ kind: 'error', text: failure });
    else router.push('/admin/proyectos');
  }

  return { project, error, loading, notice, setNotice, busy, run, remove };
}
