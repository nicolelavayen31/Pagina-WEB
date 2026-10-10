'use client';

import { useState, type FormEvent } from 'react';

export type ProjectFields = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  location: string;
};

export const EMPTY_PROJECT: ProjectFields = { title: '', slug: '', summary: '', description: '', category: '', location: '' };

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: ProjectFields;
  submitLabel: string;
  onSubmit: (fields: ProjectFields) => Promise<string | null>;
}) {
  const [fields, setFields] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof ProjectFields>(key: K, value: string) {
    setFields((current) => {
      const next = { ...current, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(await onSubmit(fields));
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div>
        <label htmlFor="project-title">Título</label>
        <input id="project-title" value={fields.title} onChange={(e) => update('title', e.target.value)} required minLength={3} maxLength={160} />
      </div>
      <div>
        <label htmlFor="project-slug">Slug (URL)</label>
        <input
          id="project-slug"
          value={fields.slug}
          onChange={(e) => {
            setSlugTouched(true);
            update('slug', e.target.value);
          }}
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          minLength={3}
          maxLength={120}
          aria-describedby="project-slug-hint"
        />
        <p className="hint" id="project-slug-hint">
          Solo minúsculas, números y guiones.
        </p>
      </div>
      <div>
        <label htmlFor="project-category">Categoría</label>
        <input id="project-category" value={fields.category} onChange={(e) => update('category', e.target.value)} required minLength={2} maxLength={80} />
      </div>
      <div>
        <label htmlFor="project-location">Ubicación</label>
        <input id="project-location" value={fields.location} onChange={(e) => update('location', e.target.value)} required minLength={2} maxLength={160} />
      </div>
      <div className="field--full">
        <label htmlFor="project-summary">Resumen</label>
        <textarea id="project-summary" rows={2} value={fields.summary} onChange={(e) => update('summary', e.target.value)} required minLength={20} maxLength={240} />
      </div>
      <div className="field--full">
        <label htmlFor="project-description">Descripción</label>
        <textarea
          id="project-description"
          rows={8}
          value={fields.description}
          onChange={(e) => update('description', e.target.value)}
          required
          minLength={80}
          maxLength={5000}
          aria-describedby="project-description-hint"
        />
        <p className="hint" id="project-description-hint">
          Texto plano (mínimo 80 caracteres). Separe párrafos con una línea en blanco; el HTML no se interpreta.
        </p>
      </div>
      <div className="field--full form-actions">
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? 'Guardando…' : submitLabel}
        </button>
      </div>
      {error ? (
        <p className="alert error field--full" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
