const DEFAULT_MESSAGE = 'Hola, me gustaría solicitar una cotización para un proyecto.';

/** WhatsApp link built from NEXT_PUBLIC_WHATSAPP_NUMBER, or null when it is not configured. */
export function whatsappHref(message = DEFAULT_MESSAGE): string | null {
  const phone = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;
}
