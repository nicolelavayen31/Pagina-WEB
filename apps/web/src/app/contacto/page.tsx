"use client";

import { FormEvent, useEffect, useState } from 'react';
import { createLead, getPublicServices } from '@/lib/api';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [services, setServices] = useState<Array<{ id: string; name: string; slug: string; summary: string }>>([]);

  useEffect(() => {
    getPublicServices().then(setServices).catch(() => setServices([]));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || ''),
      company: String(formData.get('company') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      serviceId: String(formData.get('serviceId') || '') || undefined,
      location: String(formData.get('location') || ''),
      description: String(formData.get('description') || ''),
      budget: String(formData.get('budget') || ''),
      privacyNoticeVersion: 'v1',
      consentAt: new Date().toISOString(),
      website: String(formData.get('website') || ''),
    };

    try {
      await createLead(payload);
      setStatus('success');
      setMessage('Su solicitud fue registrada correctamente. Un asesor se pondrá en contacto pronto.');
      form.reset();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Ha ocurrido un error inesperado.');
    }
  }

  return (
    <main className="container section">
      <h1>Contacto</h1>
      <form onSubmit={handleSubmit}>
        <div><label>Nombre completo</label><input name="name" required /></div>
        <div><label>Empresa (opcional)</label><input name="company" /></div>
        <div><label>Correo electrónico</label><input type="email" name="email" required /></div>
        <div><label>Teléfono</label><input name="phone" required /></div>
        <div><label>Ubicación del proyecto</label><input name="location" required /></div>
        <div><label>Tipo de servicio</label>
          <select name="serviceId">
            <option value="">Selección</option>
            {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </select>
        </div>
        <div><label>Descripción de la necesidad</label><textarea name="description" rows={5} required /></div>
        <div><label>Presupuesto aproximado</label><input name="budget" /></div>
        <div style={{ display: 'none' }}>
          <label>Website</label>
          <input name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <button className="button primary" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Enviando...' : 'Enviar solicitud'}
        </button>
        {message ? <p role="status">{message}</p> : null}
      </form>
    </main>
  );
}
