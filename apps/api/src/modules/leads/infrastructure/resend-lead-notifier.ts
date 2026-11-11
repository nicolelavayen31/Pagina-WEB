import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import type { LeadNotifier, NewLeadNotification } from '../application/ports/lead-notifier';

const SEND_URL = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 8000;

/** Removes line breaks so visitor input can never add lines to the subject. */
const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

/**
 * Sends the "new quote request" e-mail through Resend's HTTP API (no SMTP library needed).
 * Disabled when RESEND_API_KEY is empty. Plain text only: visitor input is never rendered as HTML.
 */
@Injectable()
export class ResendLeadNotifier implements LeadNotifier {
  private readonly logger = new Logger(ResendLeadNotifier.name);

  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  async notifyNewLead(lead: NewLeadNotification): Promise<void> {
    const apiKey = this.config.get('RESEND_API_KEY', { infer: true });
    if (!apiKey) {
      return;
    }
    const to = this.config
      .get('LEAD_NOTIFY_TO', { infer: true })
      .split(',')
      .map((address) => address.trim())
      .filter(Boolean);
    const panelUrl = `${this.config.get('CORS_ORIGIN', { infer: true }).split(',')[0].trim()}/admin/cotizaciones`;

    const text = [
      'Llegó una nueva solicitud de cotización desde el sitio web.',
      '',
      `Nombre: ${lead.name}`,
      `Empresa: ${lead.company ?? '—'}`,
      `Correo: ${lead.email}`,
      `Teléfono: ${lead.phone}`,
      `Ubicación: ${lead.location}`,
      `Presupuesto: ${lead.budgetRange ?? '—'}`,
      '',
      'Descripción:',
      lead.description,
      '',
      `Gestiónela en el panel: ${panelUrl}`,
    ].join('\n');

    const response = await fetch(SEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: this.config.get('LEAD_NOTIFY_FROM', { infer: true }),
        to,
        reply_to: lead.email,
        subject: oneLine(`Nueva cotización: ${lead.name}${lead.company ? ` (${lead.company})` : ''}`).slice(0, 150),
        text,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Resend answered ${response.status}`);
    }
    this.logger.log('New lead notification sent');
  }
}
