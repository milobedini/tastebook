# cmdk names its input from the Command's label

- **Added:** 2026-10-28 · **Applies to:** spec | implement | review · **Issue:** TAS-66
- **Paths:** `frontend/src/**`
- **Rule:** With `cmdk` 1.1, `Command.Input` always gets `aria-labelledby` pointing at a hidden `<label>` holding `<Command label="…">`, set after the props are spread, so an `aria-label` on the input is ignored. Give the input its accessible name through `Command`'s `label`. Also, in a `flex` option, a space between the name and a nested `<span>` disappears from both the layout and (in jsdom) the accessible name: wrap the option's text in one inline element and keep the space outside the span.
- **Why:** The TAS-47 spec sketched `<Command label={label}>` with `aria-label="Search ingredients"` on the input; the page tests found the combobox named "Include an ingredient" instead, and the options named "aubergine· also eggplant".
- **Re-check by:** 2027-01-28
