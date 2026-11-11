const DEFAULT_MESSAGE = 'Hola, me gustaría solicitar una cotización para un proyecto.';

/** Business WhatsApp (0979584079, Ecuador) in international format. Override with NEXT_PUBLIC_WHATSAPP_NUMBER. */
export const DEFAULT_WHATSAPP_NUMBER = '593979584079';

/**
 * wa.me needs the international number without "+" or leading zeros.
 * A local Ecuadorian mobile written as 09XXXXXXXX becomes 5939XXXXXXXX.
 */
export function normalizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (/^09\d{8}$/.test(digits)) return `593${digits.slice(1)}`;
  return digits;
}

/** WhatsApp chat link, or null when no number is available. */
export function whatsappHref(message = DEFAULT_MESSAGE): string | null {
  const phone = normalizeWhatsappNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER);
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;
}
