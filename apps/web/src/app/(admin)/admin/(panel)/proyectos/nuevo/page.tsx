'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCan } from '@/components/admin/admin-context';
import { AdminSection } from '@/components/admin/admin-ui';
import { EMPTY_PROJECT, ProjectForm } from '@/components/admin/project-form';
import { handleAuthError } from '@/components/admin/use-api';
import { ApiError, apiFetch, friendlyMessage } from '@/lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const can = useCan();

  if (!can('project:create')) {
    return (
      <AdminSection as="h1" title="Nuevo proyecto">
        <p className="alert error">No tiene permiso para crear proyectos.</p>
      </AdminSection>
    );
  }

  return (
    <AdminSection
      as="h1"
      title="Nuevo proyecto"
      description="Los proyectos se crean como borrador y no son visibles hasta que se publican."
      actions={
        <Link href="/admin/proyectos" className="button outline">
          Volver
        </Link>
      }
    >
      <ProjectForm
        initial={EMPTY_PROJECT}
        submitLabel="Crear borrador"
        onSubmit={async (fields) => {
          try {
            const project = await apiFetch<{ id: string }>('/admin/projects', { method: 'POST', body: JSON.stringify(fields) });
            router.push(`/admin/proyectos/${project.id}`);
            return null;
          } catch (error) {
            if (handleAuthError(error)) return null;
            if (error instanceof ApiError && error.status === 409) return 'Ya existe un proyecto con ese slug.';
            if (error instanceof ApiError && error.fieldErrors.length) {
              return `Revise los campos: ${error.fieldErrors.map((field) => field.path).join(', ')}.`;
            }
            return friendlyMessage(error);
          }
        }}
      />
    </AdminSection>
  );
}
