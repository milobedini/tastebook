# Biome lints Django templates as HTML

- **Added:** 2026-10-30 · **Applies to:** spec | implement | review · **Issue:** TAS-107
- **Paths:** `backend/*/templates/**/*.html`
- **Rule:** `biome check` (in `pnpm lint` and the pre-commit hook) parses every `.html` under `backend/` as HTML, template tags included, so a tag with double quotes inside a double-quoted attribute, as Django's own admin templates write it (`href="{% static "admin/css/forms.css" %}"`), fails with "expected `>` but instead found `css`". Quote a template tag's argument with single quotes inside an attribute (`href="{% static 'admin/css/forms.css' %}"`); don't copy Django's templates verbatim.
- **Why:** On TAS-107 (PR #105) the two-factor admin templates mirrored `registration/password_change_form.html` and the commit hook refused them until the quotes changed.
- **Re-check by:** 2027-01-30
