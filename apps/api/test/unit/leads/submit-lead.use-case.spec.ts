import type { HumanVerifier } from '../../../src/modules/leads/application/ports/human-verifier';
import type { LeadNotifier } from '../../../src/modules/leads/application/ports/lead-notifier';
import type { LeadRepository, NewLead } from '../../../src/modules/leads/application/ports/lead.repository';
import { SubmitLeadUseCase, type SubmitLeadCommand } from '../../../src/modules/leads/application/use-cases/submit-lead.use-case';
import { UnknownServiceError } from '../../../src/modules/leads/domain/lead.errors';
import type { ServiceQueries } from '../../../src/modules/services/application/service.queries';

const command: SubmitLeadCommand = {
  name: 'Ana Pérez',
  email: 'Ana.Perez@Example.com',
  phone: '+593 99 123 4567',
  location: 'Quito',
  description: 'Mantenimiento preventivo para un edificio de cinco pisos.',
  remoteIp: '203.0.113.10',
};

function setup() {
  const leads = { create: jest.fn(async (_lead: NewLead) => ({ id: 'lead-1' })) } as unknown as LeadRepository & {
    create: jest.Mock;
  };
  const humans = { verify: jest.fn(async () => undefined) } satisfies HumanVerifier;
  const services = { isActive: jest.fn(async (id: string) => id === 'active-service') } as unknown as ServiceQueries;
  const notifier = { notifyNewLead: jest.fn(async () => undefined) } satisfies LeadNotifier;
  const useCase = new SubmitLeadUseCase(leads, humans, services, notifier);
  jest.spyOn(useCase['logger'], 'warn').mockImplementation(() => undefined);
  const logError = jest.spyOn(useCase['logger'], 'error').mockImplementation(() => undefined);
  return { useCase, leads, humans, notifier, logError };
}

describe('SubmitLeadUseCase', () => {
  it('answers success but stores nothing when the honeypot is filled', async () => {
    const { useCase, leads, humans } = setup();

    await expect(useCase.execute({ ...command, website: 'http://spam.example' })).resolves.toEqual({ success: true });

    expect(humans.verify).not.toHaveBeenCalled();
    expect(leads.create).not.toHaveBeenCalled();
  });

  it('verifies the human, normalises the input and records consent', async () => {
    const { useCase, leads, humans } = setup();

    await useCase.execute({ ...command, company: '', turnstileToken: 'tok' });

    expect(humans.verify).toHaveBeenCalledWith('tok', '203.0.113.10');
    expect(leads.create.mock.calls[0][0]).toMatchObject({
      email: 'ana.perez@example.com',
      company: null,
      serviceId: null,
      budgetRange: null,
      privacyNoticeVersion: 'v1',
      consentAt: expect.any(Date),
    });
  });

  it('rejects a service that does not exist or is inactive', async () => {
    const { useCase, leads } = setup();
    await expect(useCase.execute({ ...command, serviceId: 'retired-service' })).rejects.toThrow(UnknownServiceError);
    expect(leads.create).not.toHaveBeenCalled();
  });

  it('notifies the team about a stored lead, without the consent fields', async () => {
    const { useCase, notifier } = setup();
    await useCase.execute({ ...command, company: 'ACME' });
    expect(notifier.notifyNewLead).toHaveBeenCalledWith({
      name: 'Ana Pérez',
      company: 'ACME',
      email: 'ana.perez@example.com',
      phone: '+593 99 123 4567',
      location: 'Quito',
      description: command.description,
      budgetRange: null,
    });
  });

  it('still answers success when the notification fails, and logs it', async () => {
    const { useCase, leads, notifier, logError } = setup();
    notifier.notifyNewLead.mockRejectedValueOnce(new Error('mail down'));

    await expect(useCase.execute(command)).resolves.toEqual({ success: true });
    await new Promise((resolve) => setImmediate(resolve));

    expect(leads.create).toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith('Lead notification failed: mail down');
  });

  it('does not notify when the honeypot is filled', async () => {
    const { useCase, notifier } = setup();
    await useCase.execute({ ...command, website: 'http://spam.example' });
    expect(notifier.notifyNewLead).not.toHaveBeenCalled();
  });
});
