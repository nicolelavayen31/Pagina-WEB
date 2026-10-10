import Image from 'next/image';
import type { PublicService } from '@/lib/api';
import { SERVICE_PHOTOS } from '@/lib/site-photos';

/** Photo background with a navy overlay; services without a photo keep the striped navy fallback. */
export function ServiceCard({ service }: { service: PublicService }) {
  const photo = SERVICE_PHOTOS[service.slug]?.[0];

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
