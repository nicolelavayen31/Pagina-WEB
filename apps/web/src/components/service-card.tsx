import Image from 'next/image';
import type { PublicService } from '@/lib/api';
import { SERVICE_PHOTOS } from '@/lib/site-photos';

type Props = {
  service: PublicService;
  /** overlay: home page (photo behind the text). catalogue: services page (photo on top, full description). */
  variant?: 'overlay' | 'catalogue';
};

export function ServiceCard({ service, variant = 'overlay' }: Props) {
  const photo = SERVICE_PHOTOS[service.slug]?.[0];

  if (variant === 'catalogue') {
    return (
      <article className="service-tile">
        <div className="service-tile__media">
          {photo ? (
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
              style={{ objectPosition: photo.position ?? 'center' }}
            />
          ) : null}
        </div>
        <div className="service-tile__body">
          <h2>{service.name}</h2>
          <p>{service.description}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="service-card on-dark">
      {photo ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
          className="service-card__image"
          style={{ objectPosition: photo.position ?? 'center' }}
        />
      ) : null}
      <div className="service-card__overlay" aria-hidden="true" />
      <h3>{service.name}</h3>
      <p>{service.summary}</p>
    </article>
  );
}
