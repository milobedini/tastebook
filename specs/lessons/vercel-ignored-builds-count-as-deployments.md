# A Vercel build skipped by ignoreCommand still counts as a deployment

- **Added:** 2026-10-27 · **Applies to:** triage | spec | implement · **Issue:** TAS-35
- **Rule:** Vercel's Ignored Build Step (`ignoreCommand`, on each service in `vercel.json`) cancels a build but still creates the deployment, which counts towards the daily deployment limit (100 on Hobby) and uses a build slot. It saves build minutes, migrations and preview checks, not quota. Only `git.deploymentEnabled` (by branch, not by path), separate Vercel projects per app, or deploying from Actions avoid creating the deployment. Check the quota side in Vercel's docs (project settings, Ignored Build Step) before proposing a skip as a fix for a rate limit.
- **Why:** TAS-35 was filed after the account hit the limit and asked for `ignoreCommand`; triage sized it without checking whether a skipped build counts, and the build stopped to ask whether to go ahead once it found that it does.
- **Re-check by:** 2027-01-27
