"use client";

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { createLead, getPublicProjects, getPublicServices } from '@/lib/api';

export default function HomePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [services, setServices] = useState<Array<{ id: string; name: string; slug: string; summary: string }>>([]);
  const [projects, setProjects] = useState<Array<any>>([]);

  useEffect(() => {
    getPublicServices().then(setServices).catch(() => setServices([]));
    getPublicProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      await createLead({
        name: String(formData.get('name') || ''),
        company: String(formData.get('company') || ''),
        email: String(formData.get('email') || ''),
        phone: String(formData.get('phone') || ''),
        serviceId: String(formData.get('service') || '') || undefined,
        location: String(formData.get('location') || ''),
        description: String(formData.get('description') || ''),
        budget: String(formData.get('budget') || ''),
        privacyNoticeVersion: 'v1',
        consentAt: new Date().toISOString(),
        website: String(formData.get('website') || ''),
      });

      setStatus('success');
      setMessage('Solicitud enviada correctamente.');
      form.reset();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.');
    }
  }
  return (
    <>
      <header>
        <div className="container">
          <nav>
            <div><strong>Mantenimientos Integrales</strong></div>
            <ul>
              <li><Link href="/servicios">Servicios</Link></li>
              <li><Link href="/proyectos">Proyectos</Link></li>
              <li><Link href="/nosotros">Nosotros</Link></li>
              <li><Link href="/contacto">Contacto</Link></li>
            </ul>
            <Link href="#cotizar" className="button primary">Solicitar cotización</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 30, alignItems: 'center' }}>
            <div>
              <p style={{ color: '#00F5D4', marginBottom: 12 }}>Soluciones integrales para edificios y obras</p>
              <h1>Construcción, mantenimiento y remodelación con enfoque operativo.</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 620 }}>Diseñamos y ejecutamos soluciones para propiedades, edificios, negocios y proyectos de mejora continua. Nuestro enfoque combina ejecución profesional, trazabilidad y atención cercana.</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
                <Link href="#cotizar" className="button primary">Solicitar cotización</Link>
                <Link href="/proyectos" className="button secondary">Ver proyectos</Link>
              </div>
            </div>
            <div className="card" style={{ padding: 24, background: 'rgba(255,255,255,0.08)', color: 'white', borderColor: 'rgba(255,255,255,0.15)' }}>
              <h3>Resumen de trabajo</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 16 }}>
                <li>Planificación técnica y presupuestaria</li>
                <li>Gestión de obra y coordinación de proveedores</li>
                <li>Soluciones de mantenimiento integral</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: 32 }}>Servicios destacados</h2>
            <div className="grid grid-3">
              {services.map((service) => (
                <article key={service.id} className="card" style={{ padding: 24 }}>
                  <h3>{service.name}</h3>
                  <p>{service.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ background: '#edf4ff' }}>
          <div className="container">
            <h2 style={{ marginBottom: 24 }}>Proyectos recientes</h2>
            <div className="grid grid-3">
              {projects.map((project) => (
                <article key={project.id} className="card">
                  <div style={{ background: '#dfeafe', minHeight: 180, display: 'grid', placeItems: 'center' }}>Imagen</div>
                  <div style={{ padding: 20 }}>
                    <p style={{ color: '#007AFF', fontWeight: 700 }}>{project.category}</p>
                    <h3>{project.title}</h3>
                    <p>{project.summary}</p>
                    <Link href={`/proyectos/${project.slug}`} className="button primary" style={{ marginTop: 12 }}>Ver proyecto</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cotizar" className="section">
          <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
            <div>
              <h2>Solicita una cotización sin compromiso</h2>
              <p>Comparte el detalle de tu necesidad y te responderemos con una propuesta enfocada en costo, cronograma y alcance.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <label>Nombre completo</label>
                <input name="name" placeholder="Tu nombre" required />
              </div>
              <div>
                <label>Correo electrónico</label>
                <input type="email" name="email" placeholder="correo@ejemplo.com" required />
              </div>
              <div>
                <label>Teléfono</label>
                <input type="tel" name="phone" placeholder="Tu teléfono" required />
              </div>
              <div>
                <label>Ubicación del proyecto</label>
                <input name="location" placeholder="Ciudad o dirección" required />
              </div>
              <div>
                <label>Tipo de servicio</label>
                <select name="service">
                  <option value="">Selección</option>
                  {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                </select>
              </div>
              <div>
                <label>Descripción</label>
                <textarea name="description" rows={4} placeholder="Cuéntanos tu proyecto" required />
              </div>
              <div style={{ display: 'none' }}>
                <label>Website</label>
                <input name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <button type="submit" className="button primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Enviando...' : 'Enviar solicitud'}
              </button>
              {message ? <p role="status">{message}</p> : null}
            </form>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <p>© 2026 Mantenimientos Integrales y Construcciones</p>
        </div>
      </footer>
    </>
  );
}
