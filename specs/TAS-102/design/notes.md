# TAS-102: Sign in and out with an email code, design

Canvas: https://claude.ai/artifact/AzBJxK2tDPKeocDQ2oKALa

## Boards

- `Main.dc.html`: the journey on a phone (390 px): signed out on any page, step 1 (email), step 2 (code), back on the page signed in, the account menu with Sign out, and signed out again on the same page.
- `Step1.dc.html`: step 1 in every state: empty, typed with focus, sending, not an address, refused by the server (a tastebook.test address on production), and couldn't reach Tastebook.
- `Step2.dc.html`: step 2 in every state: code sent (focus on the heading), typed, signing in, not 6 digits, wrong code (400), run out (409), and couldn't reach Tastebook.
- `Laptop.dc.html`: both steps at 1280 px: the same 400 px column on the page's left edge, and the two step 2 buttons on one line.
- `Narrow.dc.html`: 320 px (WCAG 1.4.10): a long address refused, a long address breaking anywhere in step 2, and the tallest step 2 (banner plus Signing in…).
- `ForcedColours.dc.html`: both steps simulated under Windows High Contrast Black, with what to check on the built page.

## Decisions

- One page at `/sign-in` with two steps, built from Page, Field, Input, Button and Banner as they are. The heading is the screen title (Display XL) with no squiggle.
- The heading, text and form sit in one column at most 400 px wide, left-aligned with the wordmark like every other page. There's no centred card.
- There's one peach button per step (Send code, then Sign in). Use a different email is secondary: beside Sign in where it fits, under it at 390 px and narrower.
- When step 2 opens, focus moves to its heading (tabindex −1). Use a different email returns focus to the email field and keeps the address.
- On `/sign-in` the bar shows neither Sign in nor the avatar. Search stays.
- Signed in with no name yet, the avatar is Dino's UserRound icon in a button named "Account". Its menu has one item, Sign out, until TAS-103 adds the name.
- Signing in returns to the page you came from (`?next=`). Signing out keeps you on the page.
- Step 1 shows at once while the session is checked; if you turn out to be signed in, the page replaces itself with where you were going. There's no spinner.
- Errors sit in the field's help line (danger, CircleAlert, aria-describedby and aria-invalid) and keep what was typed. The address and the 6 digits are checked in the browser first (`novalidate`, so there's one message in our words). After a failed press, focus goes back to the field.
- Couldn't reach Tastebook is a danger Banner between the intro and the form. It has no action of its own (the submit button is the retry) and it goes when the button is pressed again.
- Code field: numeric keyboard, `one-time-code` autofill, at most 6 characters. Wrong and run-out codes stay in the field.
- There's no "send another code" button: a new code comes from step 1. TAS-104 sets the limits a resend button would need.
- Document title: "Sign in · Tastebook" on both steps.
- The address in step 2 is bold and uses `overflow-wrap: anywhere`.

## Proposed rule changes

None.

## New or changed components

None. Nothing new or changed in Dino.
