import Image from 'next/image';
import { CLIENT_HIGHLIGHTS, CLIENT_LOGO_DIR, CLIENTS } from '@/shared/content/clients';

/** "Han confiado en nosotros": client wall with the client's logo, or its initials when there is none. */
export function ClientShowcase() {
  return (
    <section className="home-band home-band--white clients" aria-labelledby="clientes-titulo">
      <div className="home-container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Clientes</p>
            <h2 id="clientes-titulo">Han confiado en nosotros</h2>
          </div>
          <p className="clients__lead">
            Salud, sector público, educación, industria y agroindustria en todo el Ecuador.
          </p>
        </div>

        <ul className="clients__grid">
          {CLIENTS.map((client) => (
            <li key={client.id} className="client-card">
              <div
                className={`client-card__logo${client.logo ? ' client-card__logo--image' : ''}`}
                data-plate={client.logoPlate ?? 'light'}
              >
                {client.logo ? (
                  <Image
                    src={`${CLIENT_LOGO_DIR}/${client.logo}`}
                    alt={`${client.generatedBadge ? 'Distintivo' : 'Logo'} de ${client.name}`}
                    fill
                    sizes="140px"
                  />
                ) : (
                  <span aria-hidden="true">{client.initials}</span>
                )}
              </div>
              <div className="client-card__text">
                <strong>{client.name}</strong>
                <span>
                  {client.sector}
                  {client.place ? ` · ${client.place}` : ''}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <ul className="clients__highlights">
          {CLIENT_HIGHLIGHTS.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
