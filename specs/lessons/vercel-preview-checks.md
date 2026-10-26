# Checking a Vercel preview from GitHub Actions

- **Added:** 2026-10-26 · **Applies to:** triage | spec | implement | review · **Issue:** TAS-26
- **Rule:** Vercel creates a GitHub deployment per push, environment `Preview` or `Production`, with `ref` set to the commit SHA. A `deployment_status` workflow runs from the file at that SHA, so a new or changed one runs on its own PR's preview; `workflow_dispatch` can't, because GitHub only finds dispatchable workflows on the default branch. To get a browser tool past the sign-in, send `x-vercel-set-bypass-cookie: true` with `x-vercel-protection-bypass`: Lighthouse fetches `robots.txt` without its extra headers and only the cookie gets that request through.
- **Why:** On TAS-26 the triage brief expected the workflow to be provable only by a manual dispatch, which GitHub refused, while the `deployment_status` run on PR #24 worked. Without the cookie, Lighthouse read Vercel's sign-in page as `robots.txt` and held SEO at 86.
- **Re-check by:** 2027-01-26
