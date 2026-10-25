# A re-check resets a never-successful query to pending

- **Added:** 2026-10-25 · **Applies to:** spec | implement | review · **Issue:** TAS-11
- **Rule:** In TanStack Query 5, refetching a query that has no data sets `status: 'pending'` and `error: null` while the fetch runs (`fetchState` in `@tanstack/query-core/src/query.ts`). `isError` is only stable across a refetch once the query has had data. To show the last result during a background refetch, compare `dataUpdatedAt` and `errorUpdatedAt`, which a refetch leaves alone.
- **Why:** The TAS-11 spec branched on `isPending` and `isError`, so polling after a first failure flashed "Checking the API…" every minute. The test for that caught it during the build.
- **Re-check by:** 2027-01-25
