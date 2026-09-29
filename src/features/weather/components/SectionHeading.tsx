interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps): React.JSX.Element {
  return (
    <header className="section-heading">
      <div>
        <p className="section-heading__eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {description && <p className="section-heading__description">{description}</p>}
    </header>
  );
}
