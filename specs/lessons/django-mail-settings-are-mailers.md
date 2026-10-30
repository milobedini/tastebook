# Django 6.1 configures email through MAILERS

- **Added:** 2026-10-30 · **Applies to:** spec | implement | review · **Issue:** TAS-102
- **Paths:** `backend/config/settings.py`
- **Rule:** Django 6.1 deprecates `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_SSL`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` and `EMAIL_TIMEOUT` (a `RemovedInDjango2028Warning` on every start), and refuses them alongside `MAILERS`. Configure email as `MAILERS = {'default': {'BACKEND': …, 'OPTIONS': {'host': …, 'port': …, 'use_ssl': …, 'username': …, 'password': …, 'timeout': …}}}`. `DEFAULT_FROM_EMAIL` isn't deprecated, and pytest-django still swaps every mailer for the in-memory one.
- **Why:** The TAS-102 spec sketched the deprecated settings; the first test run on PR #99 warned, and the build moved to `MAILERS`.
- **Re-check by:** 2027-01-30
