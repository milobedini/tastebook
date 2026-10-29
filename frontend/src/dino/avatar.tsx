import { UserRound } from 'lucide-react';

type AvatarProps = { name: string };

// Decorative: whoever renders it names the control it sits in.
export const Avatar = ({ name }: AvatarProps) => {
  // Array.from takes a letter outside the Basic Multilingual Plane whole, not half of it.
  const letter = Array.from(name.trim())[0]?.toLocaleUpperCase();

  return (
    <span
      aria-hidden="true"
      className="inline-grid size-11 shrink-0 place-items-center rounded-pill border-2 border-transparent bg-surface text-ink text-label-l transition"
    >
      {letter ?? <UserRound strokeWidth={2.5} className="size-5" />}
    </span>
  );
};
