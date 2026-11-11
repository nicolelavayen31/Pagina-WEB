import { getContactInfo } from '@/shared/content/contact';

/** Phone, e-mail, address and hours; only the ones configured for this environment. */
export function ContactDetails({ className }: { className?: string }) {
  const { phone, email, address, hours } = getContactInfo();
  return (
    <ul className={`contact-details${className ? ` ${className}` : ''}`}>
      {phone ? (
        <li>
          <span>Teléfono</span>
          <a href={phone.href}>{phone.label}</a>
        </li>
      ) : null}
      {email ? (
        <li>
          <span>Correo</span>
          <a href={`mailto:${email}`}>{email}</a>
        </li>
      ) : null}
      {address ? (
        <li>
          <span>Dirección</span>
          {address}
        </li>
      ) : null}
      {hours ? (
        <li>
          <span>Horario</span>
          {hours}
        </li>
      ) : null}
    </ul>
  );
}
