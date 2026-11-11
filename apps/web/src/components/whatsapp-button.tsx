import { whatsappHref } from '@/shared/lib/whatsapp';
import { WhatsAppIcon } from './icons';

/** Floating turquoise circle with the icon only; the accessible name comes from aria-label. */
export function WhatsAppButton() {
  const href = whatsappHref();
  if (!href) return null;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="whatsapp-fab" aria-label="Escríbenos por WhatsApp (se abre en una pestaña nueva)" title="Escríbenos por WhatsApp">
      <WhatsAppIcon />
    </a>
  );
}
