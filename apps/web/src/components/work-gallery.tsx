'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { WorkItem } from '@/lib/site-photos';
import { CloseIcon } from './icons';

/**
 * Filterable photo gallery of completed work. Selecting a card opens a native <dialog>
 * (focus trap, Esc to close and focus restoration come from the browser).
 */
export function WorkGallery({ items }: { items: WorkItem[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<WorkItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);
  const visible = filter ? items.filter((item) => item.category === filter) : items;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected && dialog && !dialog.open) dialog.showModal();
  }, [selected]);

  function close() {
    dialogRef.current?.close();
  }

  // Clicking the backdrop (the dialog element itself, outside the panel) closes it.
  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) close();
  }

  return (
    <>
      {categories.length > 1 ? (
        <div className="filter-bar" role="group" aria-label="Filtrar trabajos por tipo">
          <button type="button" className="filter-pill" aria-pressed={filter === null} onClick={() => setFilter(null)}>
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="filter-pill"
              aria-pressed={filter === category}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}

      {/* `key` re-mounts the grid so the entrance animation replays when the filter changes. */}
      <div className="work-grid" key={filter ?? 'all'}>
        {visible.map((item, index) => (
          <article key={item.id} className="work-card" style={{ '--i': index } as React.CSSProperties}>
            <div className="work-card__media">
              <Image
                src={item.photo.src}
                alt={item.photo.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
                style={{ objectPosition: item.photo.position ?? 'center' }}
              />
              <span className="tag work-card__tag">{item.category}</span>
            </div>
            <div className="work-card__body">
              <h3>
                <button type="button" className="work-card__open" aria-haspopup="dialog" onClick={() => setSelected(item)}>
                  {item.title}
                </button>
              </h3>
              <p>{item.summary}</p>
              <span className="work-card__more" aria-hidden="true">
                Ver detalle →
              </span>
            </div>
          </article>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="work-dialog"
        aria-labelledby="work-dialog-title"
        onClose={() => setSelected(null)}
        onClick={onDialogClick}
      >
        {selected ? (
          <div className="work-dialog__panel">
            <div className="work-dialog__media">
              <Image src={selected.photo.src} alt={selected.photo.alt} fill sizes="(max-width: 860px) 100vw, 560px" />
            </div>
            <div className="work-dialog__info">
              <span className="tag work-dialog__tag">{selected.category}</span>
              <h2 id="work-dialog-title">{selected.title}</h2>
              <p>{selected.summary}</p>
              <ul>
                {selected.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
              <Link href="/contacto#cotizar" className="button primary">
                Solicitar un trabajo similar
              </Link>
            </div>
            <button type="button" className="work-dialog__close" onClick={close} aria-label="Cerrar detalle">
              <CloseIcon />
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
