# Lessons

Things learnt while building Tastebook that the code and `AGENTS.md` don't say. Agents and people read the entries whose **Applies to** matches their task before planning or building.

## Adding a lesson

One file per lesson, named for what it's about (`openapi-enum-names.md`). Propose new lessons in the PR that taught them.

```markdown
# <Short title>

- **Added:** YYYY-MM-DD · **Applies to:** triage | spec | implement | review | all · **Issue:** TAS-000
- **Rule:** <what to do, or the fact>
- **Why:** <what happened that taught it>
- **Re-check by:** YYYY-MM-DD (project facts only)
```

- **Process** lessons are about how to work. They don't expire.
- **Project facts** describe the code or a dependency as it is now, so they go stale. Each one has a re-check date. After that date, treat it as a lead to verify, not as truth: bump the date if it still holds, delete the file if it doesn't.
- Edit or delete a lesson that turns out to be wrong. Don't add one that contradicts it.
- Never include credentials, personal data or anything copied from a private source.
