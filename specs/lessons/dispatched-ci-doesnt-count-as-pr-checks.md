# A dispatched CI run doesn't pass a PR's required checks, and a bot's push waits for approval

- **Added:** 2026-10-29 · **Applies to:** spec | implement | review · **Issue:** TAS-91
- **Rule:** To get a PR's required checks to report on a commit a workflow makes, have a person (or the factory's App) push it. A `workflow_dispatch` run of `ci.yml` on the PR's head commit doesn't count: the PR keeps showing each required check as "Expected — Waiting for status to be reported" even though the same-named jobs passed. A push with `github.token` starts no workflow at all, and when a bot's push does start the `pull_request` workflows, GitHub holds them as "awaiting approval" until a maintainer clicks Approve.
- **Why:** On tastebook#77 the Update screenshots workflow committed with `github.token` and dispatched CI (TAS-74's design); the dispatched run passed but the required checks stayed pending, and the `pull_request` CI and Labeler waited for an approval click. TAS-91 moved the commit to a local command run by the person.
- **Re-check by:** 2027-01-29
