/**
 * Renders user-authored text safely: React escapes the content, so HTML inside it is shown
 * as text and never executed. Blank lines become paragraphs.
 */
export function PlainText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} style={{ whiteSpace: 'pre-line' }}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
