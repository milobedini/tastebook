# A PATCH request body comes out partial in the generated types

- **Added:** 2026-10-30 · **Applies to:** spec | implement | review · **Issue:** TAS-103
- **Paths:** `backend/**/views.py`, `backend/schema.yml`, `frontend/src/api/schema.d.ts`
- **Rule:** drf-spectacular's `COMPONENT_SPLIT_PATCH` (on by default) turns a PATCH's request serializer into a `Patched<Name>` component with every field optional, even when the view validates it with `partial=False` and refuses a missing field with `400`. Write the contract as `Patched<Name>` with optional fields, and let the endpoint's tests prove the field is required, rather than naming a `<Name>` component the schema won't have.
- **Why:** The TAS-103 spec named the `PATCH /api/account/` body `AccountName` with a required `name`; the regenerated schema had `PatchedAccountName` with `name?: string`.
- **Re-check by:** 2027-01-30
