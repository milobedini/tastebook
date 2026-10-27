# Vercel's Ignored Build Step doesn't work from vercel.json with services

- **Added:** 2026-10-27 · **Applies to:** triage | spec | implement | review · **Issue:** TAS-35
- **Rule:** In a project that uses `services` (Tastebook does), `vercel.json` has no working `ignoreCommand`. One set on a service is accepted but never runs: the build log shows no output from it, and both services build in a single `vercel build`. One at the top level is refused: the deployment errors before building ("Top-level `ignoreCommand` is not allowed with `services`"). The only route left is the project's Settings › Git › Ignored Build Step, which hasn't been tried with services. Even when a skip works, Vercel still creates the deployment and counts it towards the daily limit, so a skip saves build minutes, not quota. Don't propose an Ignored Build Step for this project without checking these first.
- **Why:** TAS-35 tried both `vercel.json` forms on PR #33 and was canceled. Vercel Pro (6,000 deployments a day) had removed the rate limit it was meant to help with, and a wrongly skipped production deploy would go unnoticed.
- **Re-check by:** 2027-01-27
