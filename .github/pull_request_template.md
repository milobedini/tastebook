Fixes TAS-

## Description

<!-- 2–5 one-line bullets: what changed and why. -->

-

<!-- Optional. Up to 5 bullets: "<what was decided>, because <why>". -->

**Decisions**

-

## Evidence

<!-- Feature: walkthrough video or screenshots. Bug: before, after and the failing test. Chore: "No visible change." End with the checks line. -->

Checks: <lint> · <types> · <n tests passed>

## Checklist

- [ ] Tests cover each behaviour in the spec or issue
- [ ] Every new request has a loading state and error handling
- [ ] `backend/schema.yml` and `frontend/src/api/schema.d.ts` are regenerated if the API changed
- [ ] Migrations are included for model changes
