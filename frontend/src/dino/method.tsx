type MethodProps = { steps: { key: string | number; text: string }[] };

// docs/design.md (Components › Method) sets the numbers at 32 px, 38 px on a laptop, and the text at 17/27 on a
// laptop; none of them is a type role. The <ol> numbers each step for a screen reader, so the drawn number is hidden.
export const Method = ({ steps }: MethodProps) => (
  <ol className="flex flex-col">
    {steps.map(({ key, text }, index) => (
      <li key={key} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-2 border-line border-t py-4">
        <span
          aria-hidden="true"
          className="font-serif text-[2rem]/[1.875rem] text-pop italic lg:text-[2.375rem]/[1.875rem]"
        >
          {index + 1}
        </span>
        <p className="max-w-[62ch] break-words lg:text-[1.0625rem]/[1.6875rem]">{text}</p>
      </li>
    ))}
  </ol>
);
