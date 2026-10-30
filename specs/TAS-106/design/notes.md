# TAS-106: Add an account page with your name and units

Canvas: https://claude.ai/artifact/9GGSFtYoW17HzKhFEQGUWx

## Boards

- `docs/design/picnic/account-page.dc.html` (The account page, phone): /account at 390 px in six states: as it opens, saving the name, name saved, blank name, refused by the server (over 50 characters) and couldn't save the name.
- `docs/design/picnic/account-page-units.dc.html` (Choosing units): the Units segmented control in four states: focus on the group, chosen and saving, units saved, and couldn't save the units (the saved choice comes back).
- `docs/design/picnic/account-page-session.dc.html` (Before the page, and the way in): the account menu open with its Account item, then Checking your account… and Couldn't reach Tastebook while the session is unknown.
- `docs/design/picnic/account-page-laptop.dc.html` (The account page, laptop): the same 400 px column at 1280 px, with the toast at the bottom right; tablets match with the phone's bar and 32 px gutters.
- `docs/design/picnic/account-page-recipe.dc.html` (A recipe opens in your units): the recipe page's Units switch starting at the account's choice (US) when signed in, and metric when signed out or the session can't be checked.
- `docs/design/picnic/account-page-forced-colours.dc.html` (The account page under forced colours): the page simulated in High Contrast Black, with what to check on the built page.

## Decisions

- One Display XL heading, "Your account", with the screen's one squiggle under "account"; each setting is a section with a Title heading ("Name", "Units"), so download everything (TAS-133) and delete your account (TAS-134) join later as sections. The spec drew no heading over the name; "Name" was added so both sections read alike.
- The name works as on the name page: the same field, help line, 50-character limit and errors in the field's own line. "Save name" is the screen's one peach button.
- A failed name save is a toast, not a Banner; the typed name stays, so Save name again is the retry. Success is a "Name saved" toast, and the top bar's account button takes the new name at once.
- Units save the moment they're picked, with no button and no spinner: the control shows the latest choice, a "Units saved" toast confirms it, and a failure puts the saved choice back with an error toast. Choosing again queues behind the first save; the last choice wins.
- The account page says "US customary" (the glossary's term); the recipe page's compact switch keeps "Metric" / "US".
- The line under "Units" says recipes open in these units and you can still switch on any recipe; switching on a recipe changes that visit only.
- Opened straight at a recipe, the page shows its existing loading line until the session answers, so a US account never sees metric first; if the session can't be checked, it opens in metric.
- Account comes first in the account menu, above Sign out; the menu's heading is the person's name.
- While the session is unknown, /account shows Dino's Loading, then Error with retry, and the bar shows no account end; signed out, /account goes to sign-in and back; an account with no name yet meets the name page first.
- On laptop nothing rearranges: the 400 px column sits under the wordmark, as on the name and sign-in pages.
- The household isn't mentioned; renaming a household belongs to the household page (TAS-108).
- Under forced colours: the squiggle must take CanvasText, the chosen unit keeps its border and check, the group's focus ring is one Highlight outline, Save name stays an outlined pill, and the toast keeps its border and icon.

## Proposed rule changes

None.

## New or changed components

None: the design reuses existing Dino components (Wordmark, IconButton, SearchInput, Squiggle, Input, Button, SegmentedControl, ServingsStepper, AmountList, Loading, Error, the account menu and the toast).
