# A blank=True model field comes out optional in the generated types

- **Added:** 2026-10-25 · **Applies to:** spec | implement | review · **Issue:** TAS-13
- **Rule:** A `ModelSerializer` makes a `blank=True` model field `required=False`, so drf-spectacular leaves it out of the component's `required` list and `schema.d.ts` types it as optional (`description?: string`), even though every response includes it. When a response always sends the field, set `extra_kwargs = {'<field>': {'required': True, 'allow_blank': True}}` on the serializer, and say so in the spec's API contract.
- **Why:** The TAS-13 spec's contract said `description: string (may be "")`, but the first regenerated schema typed it `description?: string`. The build had to add the `extra_kwargs`.
- **Re-check by:** 2027-01-25
