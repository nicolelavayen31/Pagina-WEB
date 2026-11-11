'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { BUDGET_RANGE_LABELS, BUDGET_RANGES } from '@repo/contracts';
import { ApiError, friendlyMessage } from '@/shared/api/client';
import { createLead } from '@/modules/contact/api';
import type { PublicService } from '@repo/contracts';
import { TurnstileWidget } from './turnstile-widget';

type Status = 'idle' | 'loading' | 'success' | 'error';

const FIELD_LABELS: Record<string, string> = {
  name: 'nombre',
  email: 'correo electrónico',
  phone: 'teléfono',
  location: 'ubicación',
  description: 'descripción',
  privacyAccepted: 'aceptación de la política de privacidad',
};

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text === '' ? undefined : text;
}

export function QuoteForm({ services, idPrefix = 'quote' }: { services: PublicService[]; idPrefix?: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [invalid, setInvalid] = useState<Set<string>>(new Set());

  const id = (field: string) => `${idPrefix}-${field}`;
  const errorProps = (field: string) =>
    invalid.has(field) ? { 'aria-invalid': true as const, 'aria-describedby': `${id(field)}-error` } : {};
  const fieldError = (field: string) =>
    invalid.has(field) ? (
      <p className="field-error" id={`${id(field)}-error`}>
        Revise el campo {FIELD_LABELS[field] ?? field}.
      </p>
    ) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    setInvalid(new Set());

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      await createLead({
        name: String(data.get('name') ?? '').trim(),
        company: optional(data.get('company')),
        email: String(data.get('email') ?? '').trim(),
        phone: String(data.get('phone') ?? '').trim(),
        serviceId: optional(data.get('serviceId')),
        location: String(data.get('location') ?? '').trim(),
        description: String(data.get('description') ?? '').trim(),
        budgetRange: optional(data.get('budgetRange')),
        privacyAccepted: data.get('privacyAccepted') === 'on',
        website: String(data.get('website') ?? ''),
        turnstileToken: optional(data.get('cf-turnstile-response')),
      });
      setStatus('success');
      setMessage('Su solicitud fue registrada correctamente. Un asesor se pondrá en contacto pronto.');
      form.reset();
    } catch (error) {
      setStatus('error');
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        setInvalid(new Set(error.fieldErrors.map((fieldError) => fieldError.path)));
      }
      setMessage(friendlyMessage(error));
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate={false} aria-describedby={`${idPrefix}-status`}>
      <div>
        <label htmlFor={id('name')}>Nombre completo</label>
        <input id={id('name')} name="name" autoComplete="name" required minLength={2} maxLength={120} {...errorProps('name')} />
        {fieldError('name')}
      </div>
      <div>
        <label htmlFor={id('company')}>Empresa (opcional)</label>
        <input id={id('company')} name="company" autoComplete="organization" maxLength={120} />
      </div>
      <div>
        <label htmlFor={id('email')}>Correo electrónico</label>
        <input id={id('email')} type="email" name="email" autoComplete="email" required maxLength={254} {...errorProps('email')} />
        {fieldError('email')}
      </div>
      <div>
        <label htmlFor={id('phone')}>Teléfono</label>
        <input
          id={id('phone')}
          type="tel"
          name="phone"
          autoComplete="tel"
          required
          minLength={7}
          maxLength={30}
          // Same characters as the API regex; parentheses escaped because browsers compile
          // `pattern` with the `v` flag, where an unescaped "(" inside a class is a syntax error.
          pattern="[0-9+\(\)\-\s]+"
          {...errorProps('phone')}
        />
        {fieldError('phone')}
      </div>
      <div className="field--full">
        <label htmlFor={id('location')}>Ubicación del proyecto</label>
        <input id={id('location')} name="location" required minLength={2} maxLength={120} {...errorProps('location')} />
        {fieldError('location')}
      </div>
      <div>
        <label htmlFor={id('serviceId')}>Tipo de servicio</label>
        <select id={id('serviceId')} name="serviceId" defaultValue="">
          <option value="">Seleccione (opcional)</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={id('budgetRange')}>Presupuesto aproximado</label>
        <select id={id('budgetRange')} name="budgetRange" defaultValue="">
          <option value="">Seleccione (opcional)</option>
          {BUDGET_RANGES.map((range) => (
            <option key={range} value={range}>
              {BUDGET_RANGE_LABELS[range]}
            </option>
          ))}
        </select>
      </div>
      <div className="field--full">
        <label htmlFor={id('description')}>Descripción de la necesidad</label>
        <textarea
          id={id('description')}
          name="description"
          rows={5}
          required
          minLength={20}
          maxLength={2000}
          {...errorProps('description')}
        />
        <p className="hint">Mínimo 20 caracteres.</p>
        {fieldError('description')}
      </div>

      {/* Honeypot: hidden from people and assistive technology, filled only by bots. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={id('website')}>No rellene este campo</label>
        <input id={id('website')} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field--full">
        <label className="checkbox-row" htmlFor={id('privacyAccepted')}>
          <input id={id('privacyAccepted')} type="checkbox" name="privacyAccepted" required {...errorProps('privacyAccepted')} />
          <span>
            He leído y acepto la{' '}
            <Link href="/privacidad" className="underline">
              política de privacidad
            </Link>
            .
          </span>
        </label>
        {fieldError('privacyAccepted')}
      </div>

      <TurnstileWidget />

      <button className="button primary button--block field--full" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Enviando…' : 'Enviar solicitud'}
      </button>

      <div className="field--full" id={`${idPrefix}-status`} aria-live="polite">
        {message ? <p className={`alert ${status === 'success' ? 'success' : 'error'}`} role="status">{message}</p> : null}
      </div>
    </form>
  );
}
