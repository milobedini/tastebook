type Span = { start: number; end: number };

const folded = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('en-GB');

// Each character folds on its own, so every folded unit remembers the span of the character it came from.
const foldWithSpans = (text: string) =>
  Array.from(text).reduce<{ text: string; spans: Span[]; offset: number }>(
    (result, character) => {
      const piece = folded(character);
      const span = { start: result.offset, end: result.offset + character.length };
      return {
        text: result.text + piece,
        spans: result.spans.concat(Array.from({ length: piece.length }, () => span)),
        offset: span.end
      };
    },
    { text: '', spans: [], offset: 0 }
  );

// Where search first occurs in text, ignoring case, accents and the search's surrounding spaces; indices are into text.
export const matchRange = (text: string, search: string): Span | null => {
  const term = folded(search.trim());
  if (term === '') {
    return { start: 0, end: 0 };
  }
  const { text: haystack, spans } = foldWithSpans(text);
  const at = haystack.indexOf(term);
  const first = spans[at];
  const last = spans[at + term.length - 1];
  if (at === -1 || first === undefined || last === undefined) {
    return null;
  }
  return { start: first.start, end: last.end };
};
