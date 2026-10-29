# Vercel can take a service for Storybook

- **Added:** 2026-10-29 · **Applies to:** spec | implement · **Issue:** TAS-72
- **Rule:** A dependency that Vercel detects as a framework (Storybook is one) can change how a service builds. Keep each service's `framework` pinned in `vercel.json` (the frontend is `vite`), and when a spec adds a tool with its own build, list `vercel.json` in its blast radius.
- **Why:** On PR #67, adding `storybook` to `frontend` made every preview fail to deploy while CI passed; pinning `"framework": "vite"` on the frontend service fixed it.
- **Re-check by:** 2027-01-29
