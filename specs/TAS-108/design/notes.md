# TAS-108: Add a household page with invite links — design

Canvas: https://claude.ai/artifact/P7WaaMvyXKsSTVPCjB1SyM

## Boards

- `docs/design/picnic/household-page.dc.html` — The household page (part 1), phone 390 px: as it opens, saving the name, name saved, blank name, refused by the server (over 100 characters), couldn't save the name.
- `docs/design/picnic/household-page-session.dc.html` — The way in, and before the page: the account menu with Household between Account and Sign out, checking your account, couldn't reach Tastebook, getting your household, couldn't load your household, a household of one.
- `docs/design/picnic/household-page-laptop.dc.html` — On a laptop, 1280 px: the same 400 px column at the left edge, link copied with the toast at the bottom right.
- `docs/design/picnic/household-page-invite.dc.html` — The invite link (part 2), phone: no link, making the link, a live link, link copied, couldn't copy, Cancel link asked first, link cancelled, an expired link, couldn't make a link, couldn't cancel the link.
- `docs/design/dino/confirm-dialog.dc.html` — ConfirmDialog (changed): default, KeepLabel, as it opens (focus on Keep link), at 320 px, under forced colours, and the prop change.
- `docs/design/dino/confirm-dialog-rule-change.dc.html` — Proposed rule change to docs/design.md's Dialog rule.
- `docs/design/picnic/household-page-forced-colours.dc.html` — Under forced colours: a live link copied, and a blank name with no link, plus what to check on the built page.

## Decisions

- The page follows the account page's shape: "Your household" in Display XL with the screen's one squiggle under "household"; "Name", "Members" and "Invite someone" are Title section headings in one 400 px column, unchanged from phone to laptop.
- "Save name" is the screen's only peach (primary) button in every state; Make invite link, Make a new link and Copy link are secondary with their icons (Link, Copy); Cancel link is a ghost button.
- The name form works as on the account page: 100-character limit, errors in the field's own line, help line "Everyone in the household sees it.", success and failure as toasts, the typed name kept on failure.
- Members are a plain, non-interactive list: Avatar and name, 56 px rows with a Line hairline; you first with "(you)" in Muted, then by name ignoring case. No email addresses. 56 px leaves room for TAS-109's Remove and Leave.
- The invite section heading is "Invite someone" (the spec had "Invite link"), so it doesn't repeat the field's label "Invite link", which the tests find it by.
- The live link is a read-only Input; focusing it selects the whole address; the help line gives the expiry as day and month ("until 7 November").
- An expired link says so in Body ("This invite link expired on 7 November.") with only "Make a new link"; the old address isn't shown.
- Cancel link asks first in ConfirmDialog; focus starts on Keep link. After cancelling: back to no link, toast "Link cancelled", focus on Make invite link.
- Failures (make, copy, cancel) are toasts and change nothing, so pressing the same button again is the retry.
- Two waits use Loading and ErrorWithRetry, as on the account page: "Checking your account…" / "Couldn't reach Tastebook", then "Getting your household…" / "Couldn't load your household". Signed out, /household goes to sign in and back.
- Under forced colours, the squiggle must take CanvasText (checked by the e2e test against the heading's colour); avatars and the dialog panel keep their transparent borders.

## Proposed rule change

docs/design.md › Components › Dialog: the way out is "Cancel", **or names what it keeps when the action itself is a cancel ("Keep link")**. Why: "Cancel" beside "Cancel link" reads as two ways to cancel. Every other dialog keeps "Cancel"; the way out keeps its look, place and first focus.

## Components

- ConfirmDialog — changed: a new optional `cancelLabel?: string` (default "Cancel"). Only the label changes. New story `KeepLabel`, open, with its two baselines.
