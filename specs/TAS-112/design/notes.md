# TAS-112: Add a text area to Dino — design notes

Canvas: https://claude.ai/artifact/TAoKjBfsxhCx6oE3oNxCSE

## Boards

- `docs/design/dino/text-area.dc.html` (1320 × 1420), **Text area**: every state (default with placeholder, hover, focus, filled, invalid with its error, disabled with its reason), growing with its text (one line stays at the three-line minimum, five lines grow the box), a long web address wrapping at 320 px, the text area beside Dino's Input, and its anatomy.
- `docs/design/dino/text-area-phone.dc.html` (390 × 700), **Text area at phone width**: a description with help text, a focused method step and an invalid empty step with its error, at 20 px gutters.
- `docs/design/dino/text-area-corners.dc.html` (1320 × 660), **Proposed rule change**: the text area's corner, comparing pill, 24 px and 20 px on a three-line box.

## Decisions

- Box: 2 px Field border, no fill, 24 px corners (radius-card, as the Combobox list), full width of its column.
- Padding 10 px top and bottom, 18 px at the sides, so text starts where Input's does; label above in Label, help or error below in Small, 6 px gap.
- Height at least 96 px (three lines of Body at 24 px, padding and border); grows with its text through CSS `field-sizing: content`, never scrolls inside, no drag handle (`resize: none`) and no maximum. Where a browser can't size it to its text, it keeps 96 px, scrolls inside and can be dragged taller.
- Text in Body, bold (700), Ink; placeholder in Body (600), Muted, an example ("Like …"), never the label. Long words and web addresses wrap (`overflow-wrap: break-word`), so nothing scrolls sideways at 320 px.
- States are the field's five, exactly: hover Muted border; focus Ink border plus a 1 px Ink outline (3 px in all); invalid Danger border with an error icon and message below, tied with `aria-describedby`; disabled dashed border on Surface in Muted, kept focusable and read-only (`aria-disabled`), with its reason in the help line. No pressed or loading state, as for Input.
- Border colour transitions in 120 ms ease-out; none under reduced motion.
- Keyboard: Tab in, Enter adds a line, Tab out.
- One size and no variants. A character count could take the help line's place later; not part of this issue.

## Proposed rule change

`docs/design.md`, Space and shape › Corners: "Pill (999 px) for controls (buttons, chips, one-line fields, steppers) and the dock … 24 px for cards, panels and a text area." Text area joins the Components table after Field and leaves Still to settle. Why: a pill on a box three lines tall curves 48 px in and crowds the first and last lines, and becomes a lozenge as it grows; 24 px clears the text with Input's side padding and matches the Combobox list under a field; 20 px is kept for notes and banners, things you read rather than type into.

## Components

- TextArea (new): built in this issue's PR.
- Input: used unchanged beside it.
