'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState, useSyncExternalStore, type FocusEvent, type KeyboardEvent } from 'react';
import type { GallerySlide } from '@/lib/site-photos';
import { ArrowLeftIcon, ArrowRightIcon, PauseIcon, PlayIcon } from './icons';

const INTERVAL_MS = 6000;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/**
 * Hero with a photo gallery behind the text. Fixed height (slides are stacked and cross-fade),
 * so changing slides never shifts the page. Autoplay pauses on hover/focus, can be paused by
 * the user and is disabled when the visitor prefers reduced motion.
 */
export function HeroCarousel({
  slides,
  labelledBy,
  children,
}: {
  slides: GallerySlide[];
  labelledBy: string;
  children: React.ReactNode;
}) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true, // server render: no autoplay until the client knows the preference
  );
  const autoplay = count > 1 && !reducedMotion && !userPaused && !interacting;

  const go = useCallback((target: number) => setIndex(((target % count) + count) % count), [count]);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoplay, count]);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(index + 1);
    }
  }

  function onBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteracting(false);
  }

  const current = slides[index];

  return (
    <section
      className="hero on-dark"
      aria-labelledby={labelledBy}
      data-autoplay={autoplay ? 'on' : 'off'}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={onBlur}
    >
      <div className="hero__slides" role="group" aria-roledescription="carrusel" aria-label="Galería de trabajos realizados">
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className="hero__slide"
            data-active={i === index}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${count}: ${slide.caption}`}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="(max-width: 1440px) 100vw, 1440px"
              className="hero__image"
              style={{ objectPosition: slide.position ?? 'center' }}
            />
          </div>
        ))}
      </div>
      <div className="hero__overlay" aria-hidden="true" />

      <div className="hero__content">{children}</div>

      {count > 1 ? (
        <div className="hero__controls" onKeyDown={onKeyDown}>
          <p className="hero__caption" aria-live={autoplay ? 'off' : 'polite'} aria-atomic="true">
            {current.caption}
          </p>
          <div className="hero__buttons">
            <button type="button" className="hero__btn" onClick={() => go(index - 1)} aria-label="Imagen anterior">
              <ArrowLeftIcon />
            </button>
            <div className="hero__dots" role="group" aria-label="Elegir imagen">
              {slides.map((slide, i) => (
                <button
                  key={slide.src}
                  type="button"
                  className="hero__dot"
                  aria-label={`Mostrar imagen ${i + 1} de ${count}: ${slide.caption}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => go(i)}
                >
                  <span aria-hidden="true" />
                </button>
              ))}
            </div>
            <button type="button" className="hero__btn" onClick={() => go(index + 1)} aria-label="Imagen siguiente">
              <ArrowRightIcon />
            </button>
            {!reducedMotion ? (
              <button
                type="button"
                className="hero__btn"
                onClick={() => setUserPaused((paused) => !paused)}
                aria-label={userPaused ? 'Reanudar presentación' : 'Pausar presentación'}
              >
                {userPaused ? <PlayIcon /> : <PauseIcon />}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
