/** Navy header block used at the top of inner pages. */
export function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <section className="page-hero on-dark" aria-labelledby="page-hero-titulo">
      <p className="eyebrow page-hero__eyebrow">{eyebrow}</p>
      <h1 id="page-hero-titulo">{title}</h1>
      {text ? <p>{text}</p> : null}
    </section>
  );
}
