import { DEFAULT_WHATSAPP_NUMBER, normalizeWhatsappNumber } from '@/shared/lib/whatsapp';

/**
 * Public contact details, set per environment (NEXT_PUBLIC_* values are fixed at build time).
 * Anything left empty is simply not shown. The phone defaults to the business WhatsApp number.
 */
export type ContactInfo = {
  phone: { label: string; href: string } | null;
  email: string | null;
  address: string | null;
  hours: string | null;
};

/** 593979584079 -> "097 958 4079"; other formats are shown as given. */
function formatEcuadorPhone(international: string): string {
  const match = /^593(\d{2})(\d{3})(\d{4})$/.exec(international);
  return match ? `0${match[1]} ${match[2]} ${match[3]}` : `+${international}`;
}

export function getContactInfo(): ContactInfo {
  const phone = normalizeWhatsappNumber(
    process.env.NEXT_PUBLIC_CONTACT_PHONE || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER,
  );
  return {
    phone: phone ? { label: formatEcuadorPhone(phone), href: `tel:+${phone}` } : null,
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
    address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS?.trim() || null,
    hours: process.env.NEXT_PUBLIC_CONTACT_HOURS?.trim() || null,
  };
}
