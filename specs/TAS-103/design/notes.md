# TAS-103: Ask for your name on first sign-in, in a household of one

Canvas: https://claude.ai/artifact/7oqpRknXfhbAVr8JQKaNN5 (approved at Design Review)

## Boards

Each board is in `docs/design/picnic/`, as HTML and PNG.

- `welcome.dc.html`: the name page at /welcome on a phone (390 px), in six states: empty, typed with focus, saving, blank name, refused by the server (over 50 characters), and couldn't reach Tastebook.
- `welcome-session.dc.html`: before the form and the way out: checking your account (Loading), the session failing (Error with retry), and the account menu open with Sign out as its only item.
- `welcome-laptop.dc.html`: the same page at 1280 px; nothing rearranges, the form keeps its 400 px column at the left edge.
- `welcome-forced-colours.dc.html`: the blank-name and couldn't-reach states under forced colours (High Contrast Black), with what to check on the built page.

## Decisions

- The heading "What's your name?" is Display XL with the screen's one squiggle under "name"; the line under it says why Tastebook asks: "It shows on recipes you write, like "by Milo"."
- One field, "Your name" (`autocomplete="name"`, `maxlength` 50), and one peach Continue button that shows "Saving…" while saving and keeps its size.
- No skip. The only way off the page is the top bar's account menu, whose only item is Sign out; its heading appears once there's a name. The "Account" item arrives with its page in TAS-106.
- The top bar is the signed-in one with no name yet: the avatar shows the person icon and is named "Account". After saving, the bar shows "M" and "Account for Milo".
- Errors sit in the field's own line and keep what was typed. A blank or only-spaces name says "Enter your name, like Milo." without a request. A refusal shows the server's own sentence. After a failed press, focus goes back to the field.
- Couldn't reach Tastebook (offline or a 5xx) is a danger Banner between the intro and the form with no action of its own: Continue is the retry.
- While the session is unknown the bar shows no account end, and the page shows Dino's Loading ("Checking your account…" after half a second), then Error with retry, as the recipe page does.
- The household isn't mentioned: saving also makes "Milo's household", but nothing shows a household until TAS-108.
- Layout follows the sign-in page's column at every width; tablets (640 to 1024 px) look like the laptop with the phone's bar and 32 px gutters.
- Under forced colours, check the squiggle turns CanvasText rather than staying peach (lesson: forced-colours-keeps-an-svgs-own-colour), and that Continue and the avatar keep their 2 px transparent borders.

## Proposed rule changes

None.

## New or changed components

None. The page uses Dino's existing Wordmark, IconButton, SearchInput, Squiggle, Input, Button, Banner, Loading, ErrorWithRetry and icons; the named avatar and the account menu are already drawn on the account boards.
