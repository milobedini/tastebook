# TAS-113: Add a switch to Dino — design notes

Canvas: https://claude.ai/artifact/V6jwKtEfj9Z78HLqo43xS8

## Boards

- `Main.dc.html` (1320 × 2000, now `docs/design/dino/switch.dc.html` with its PNG), **Switch**: every state (off and on, each at rest, hover, pressed, focus and disabled with its reason), anatomy, motion, forced colours, the switch beside Dino's checkbox row and filter chip, what it can grow into, and an interactive "Try it".
- `Phone.dc.html` (390 × 660), **Switch at phone width**: switches stacked as a list with hairlines, a disabled row with its reason, and a long label wrapping at 320 px.

## Decisions

- The whole row is the target: label first in Body and Ink, the switch at the row's end; at least 48 px tall, 8 px padding, 16 px gap, like the checkbox row.
- Track 52 × 32 px pill. Off: 2 px Field border, no fill. On: Mint fill.
- Thumb 20 px, 4 px in. Off: Muted at the start. On: On pastel at the end with a 12 px Mint check, so on never relies on colour alone.
- Hover fills the row Surface (off: track border turns Ink; on: Mint hover). Pressed shrinks the switch to 94% (off: track fills Line; on: Mint pressed).
- Focus is a 3 px Ink ring on the row (radius-row), flush, not on the pill.
- Disabled keeps focus and reads its reason: Surface track, dashed Field border, Field thumb, Muted label, the reason in Small Muted after an Info icon, tied with `aria-describedby`.
- Motion: thumb slides 20 px and the track fills in 120 ms ease-out; instant under reduced motion.
- Forced colours: the track's and thumb's 2 px borders stay drawn, so on shows by the thumb's position and check; the ring is drawn in CanvasText, as on the checkbox row, disabled stays dashed in GrayText.
- At 320 px a long label wraps and the switch stays beside its first line without shrinking; sizes in rem so it scales with text settings.
- Later variants, not in this issue: a help line under the label, a busy state with `aria-busy`, a group of switches under one heading.

## Proposed rule change

None.

## Components

- Switch (new): built in this issue's PR.
