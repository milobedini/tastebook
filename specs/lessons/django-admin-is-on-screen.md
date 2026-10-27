# The Django admin is on screen

- **Added:** 2026-10-27 · **Applies to:** implement | verify | review · **Issue:** TAS-39
- **Rule:** A change to `backend/*/admin.py` (inlines, autocomplete fields, a select's choices, help text) changes a page staff use, so it needs on-screen evidence like any other page. Don't mark an admin criterion "Not verified on screen"; send it to verify, which signs in to `/admin/` as a superuser and screenshots the change page with the new fields filled in.
- **Why:** On TAS-39 (PR #39) the recipe admin gained group, line and step inlines, ingredient autocomplete and a group select limited to the recipe's groups, but the PR left "editing in the Django admin" unverified as nothing on screen, and review sent it back.
