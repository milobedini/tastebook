# pytest-django's admin_user has a password, and allauth's MFA notices

- **Added:** 2026-10-30 · **Applies to:** spec | implement | review · **Issue:** TAS-107
- **Paths:** `backend/tests/**`
- **Rule:** pytest-django's `admin_user` is made with the password `password`, unlike every Tastebook account. With a usable password, allauth's reauthentication check wants it again before anything that changes an account's security (adding an authenticator raises `ReauthenticationRequired`), and an account made with `User.objects.create_user` has no `EmailAddress` row, so signing in by email code stops at `verify_email`. A test of a sign-in or MFA flow should make its accounts as signing up does: no usable password (`set_unusable_password()`) and a verified `EmailAddress`. `backend/tests/conftest.py`'s `admin_client` does the first.
- **Why:** The TAS-107 spec said accounts have no usable password, so setting up an authenticator would never ask to reauthenticate; the overridden `admin_client` built on `admin_user` hit `ReauthenticationRequired` until its password was made unusable, and the sign-in tests stopped at `verify_email` until their accounts had a verified address.
- **Re-check by:** 2027-01-30
