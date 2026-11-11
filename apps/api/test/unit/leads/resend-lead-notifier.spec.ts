import type { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../src/config/env.schema';
import { ResendLeadNotifier } from '../../../src/modules/leads/infrastructure/resend-lead-notifier';

const lead = {
  name: 'Ana\r\nBcc: evil@example.com',
  company: null,
  email: 'ana@example.com',
  phone: '+593 99 123 4567',
  location: 'Quito',
  description: '<b>Hola</b>',
  budgetRange: null,
};

function notifier(env: Partial<EnvConfig>) {
  const values: Partial<EnvConfig> = { CORS_ORIGIN: 'https://www.example.com', ...env };
  const config = { get: (key: keyof EnvConfig) => values[key] ?? '' } as unknown as ConfigService<EnvConfig, true>;
  const service = new ResendLeadNotifier(config);
  jest.spyOn(service['logger'], 'log').mockImplementation(() => undefined);
  return service;
}

describe('ResendLeadNotifier', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('does nothing when no API key is configured', async () => {
    await notifier({}).notifyNewLead(lead);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a plain-text e-mail with a single-line subject and reply-to the visitor', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    await notifier({ RESEND_API_KEY: 'key', LEAD_NOTIFY_TO: 'a@x.com, b@x.com', LEAD_NOTIFY_FROM: 'Web <w@x.com>' }).notifyNewLead(lead);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(url).toBe('https://api.resend.com/emails');
    expect(body.to).toEqual(['a@x.com', 'b@x.com']);
    expect(body.reply_to).toBe('ana@example.com');
    expect(body.subject).not.toMatch(/[\r\n]/);
    expect(body.html).toBeUndefined();
    expect(body.text).toContain('https://www.example.com/admin/cotizaciones');
  });

  it('fails loudly on a non-2xx answer so the caller can log it', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 422 });
    await expect(
      notifier({ RESEND_API_KEY: 'key', LEAD_NOTIFY_TO: 'a@x.com', LEAD_NOTIFY_FROM: 'w@x.com' }).notifyNewLead(lead),
    ).rejects.toThrow('Resend answered 422');
  });
});
