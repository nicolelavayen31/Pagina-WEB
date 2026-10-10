export function WhatsAppButton() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
  const message = encodeURIComponent('Hola, me gustaría solicitar una cotización para un proyecto.');

  if (!phone) return null;

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#00F5D4] text-xl text-[#0B132B] shadow-lg transition hover:scale-105"
      title="Contactar por WhatsApp"
    >
      WhatsApp
    </a>
  );
}
