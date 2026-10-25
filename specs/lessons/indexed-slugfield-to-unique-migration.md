# Add a unique SlugField with db_index=False before making it unique

- **Added:** 2026-10-25 · **Applies to:** spec | implement | review · **Issue:** TAS-14
- **Rule:** When a migration adds a `SlugField` (or any indexed `CharField`) in steps (add, backfill, then `AlterField` to `unique=True`), add it with `db_index=False`. On Postgres, Django's `AlterField` from an indexed field to a unique one creates the `varchar_pattern_ops` `_like` index again, and the migration fails with `relation "<table>_<field>_<hash>_like" already exists`. The `AlterField` adds the unique constraint and the `_like` index on its own.
- **Why:** The TAS-14 spec's migration added `slug` with the default `db_index=True`, and the first `migrate` failed, on any database, before the backfill could run.
- **Re-check by:** 2027-01-25
