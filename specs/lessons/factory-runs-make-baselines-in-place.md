# A factory run makes its own screenshot baselines and never hands them to a person

- **Added:** 2026-10-29 · **Applies to:** spec | implement | review · **Issue:** TAS-77
- **Rule:** A stage runs on a GitHub-hosted Ubuntu runner, the same image as CI, so it makes the baselines its change needs there: `pnpm --filter frontend test:visual:update` builds Storybook, removes orphans and rewrites only the shots that changed; look at each changed one against its board before committing. Don't start the Update screenshots workflow: the factory's token is refused (HTTP 403), and since TAS-91 the workflow only uploads them for a person to commit. A spec doesn't plan a person's step for baselines, and review treats missing or stale baselines as a Should fix for implement, never a question for a person.
- **Why:** On PR #81 (TAS-77) the dispatch failed with 403, and the run made the 15 field baselines on its own runner instead. On PR #84 (TAS-81) an implement run hit the same 403, asked a person to run the workflow, and review asked again, though the run could have made them itself.
- **Re-check by:** 2027-01-29
