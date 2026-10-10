import {
  envSchema,
  leadCreateSchema,
  projectCreateSchema,
  projectUpdateSchema,
  ROLE_PERMISSIONS,
} from '@repo/contracts';

const validLead = {
  name: 'Ana Pérez',
  email: 'ana@example.com',
  phone: '+593 99 123 4567',
  location: 'Quito',
  description: 'Necesito remodelar la cocina de un departamento de 80 m2.',
  budgetRange: 'FROM_1K_TO_5K',
  privacyAccepted: true,
};

describe('contracts', () => {
  it('accepts a valid quote request', () => {
    expect(leadCreateSchema.safeParse(validLead).success).toBe(true);
  });

  it('rejects unknown fields such as the old "budget" or "consentAt"', () => {
    expect(leadCreateSchema.safeParse({ ...validLead, budget: '5000' }).success).toBe(false);
    expect(leadCreateSchema.safeParse({ ...validLead, consentAt: new Date().toISOString() }).success).toBe(false);
  });

  it('requires explicit privacy consent and a known budget range', () => {
    expect(leadCreateSchema.safeParse({ ...validLead, privacyAccepted: false }).success).toBe(false);
    expect(leadCreateSchema.safeParse({ ...validLead, budgetRange: 'MUCHO' }).success).toBe(false);
  });

  it('never lets clients set project status or authorship', () => {
    const base = {
      title: 'Remodelación',
      slug: 'remodelacion',
      summary: 'Resumen suficientemente largo del proyecto.',
      description: 'x'.repeat(100),
      category: 'Remodelación',
      location: 'Quito',
    };
    expect(projectCreateSchema.safeParse(base).success).toBe(true);
    expect(projectCreateSchema.safeParse({ ...base, status: 'PUBLISHED' }).success).toBe(false);
    expect(projectUpdateSchema.safeParse({ createdById: 'someone' }).success).toBe(false);
    expect(projectUpdateSchema.safeParse({ status: 'PUBLISHED' }).success).toBe(false);
  });

  it('keeps PROJECT_MANAGER within least privilege', () => {
    const pm = ROLE_PERMISSIONS.PROJECT_MANAGER;
    for (const forbidden of ['project:publish', 'project:unpublish', 'project:delete', 'lead:read', 'user:manage']) {
      expect(pm).not.toContain(forbidden);
    }
  });

  it('requires Turnstile secret in production', () => {
    const base = { DATABASE_URL: 'postgresql://u:p@localhost:5432/db' };
    expect(envSchema.safeParse({ ...base, NODE_ENV: 'production' }).success).toBe(false);
    expect(envSchema.safeParse({ ...base, NODE_ENV: 'production', TURNSTILE_SECRET_KEY: 'secret' }).success).toBe(true);
    expect(envSchema.safeParse({ ...base, NODE_ENV: 'development' }).success).toBe(true);
  });
});
