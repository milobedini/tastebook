import { type ReactNode, useId } from 'react';

type StyleguideSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export const StyleguideSection = ({ title, description, children }: StyleguideSectionProps) => {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId}>{title}</h2>
      <p className="text-muted">{description}</p>
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">{children}</div>
    </section>
  );
};
