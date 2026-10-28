# The Django admin is on screen

- **Added:** 2026-10-27 · **Applies to:** implement | verify | review · **Issue:** TAS-39, TAS-59
- **Paths:** `backend/*/admin.py`, `backend/*/templates/admin/**`
- **Rule:** A change to `backend/*/admin.py` (inlines, autocomplete fields, a select's choices, help text, permissions that hide Add, Save or Delete) or to a template under `backend/*/templates/admin/` changes a page staff use, so it needs on-screen evidence like any other page. Don't mark an admin criterion "Not verified on screen", and never report `notOnScreen` for a PR that touches those paths; send it to verify, which signs in to `/admin/` as a superuser and screenshots the changelist and change page that changed.
- **Why:** On TAS-39 (PR #39) the recipe admin gained group, line and step inlines, ingredient autocomplete and a group select limited to the recipe's groups, but the PR left "editing in the Django admin" unverified as nothing on screen, and review sent it back. On TAS-59 (PR #52) the catalogue admins became read-only with a notice from new admin templates, and the PR reached review with no verify run, so nothing showed the notice or the missing controls.
