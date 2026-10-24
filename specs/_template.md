---
issue: TAS-000
status: draft # draft | approved | building | done
branch: tas-000-short-slug
pr:
---

# <Issue title>

Linear: TAS-000

## Summary

<Two or three sentences: what changes for whom, and why now.>

## Required reading

- `AGENTS.md`: hard constraints
- `<path/to/file>`: mirror this pattern for <what>
- `specs/lessons/<file>.md`: <why it applies>

## Product behaviour

One numbered claim per acceptance criterion, each a single true-or-false sentence about what someone can now do or see.

1. <claim>
2. <claim>

## Technical design

- **Approach:** <what changes, layer by layer: model, service, serializer, endpoint, schema, hook, page>
- **API contract:** <new or changed endpoints and their shapes, or "No change">
- **Blast radius:** <shared code this touches and what to re-check, or "Nothing outside this feature">
- **Not changing:** <what a reader might expect to move but stays as it is>

```mermaid
%% optional: a sequence or state diagram when the flow isn't obvious
```

### Steps

1. **<Step title>.** `<path>` (new | edit | delete)
   <what changes>
   Done when: <the check that proves this step>

### Tests

- `<path/to/test file>`
  - <case>, asserts: <literal, observable result>

## Decisions

- <what was decided>, because <why>. Asked: <question> → <answer> (when a human decided it)

## Assumptions

- <what the spec assumes, and who confirms it>

## Out of scope

- <what this issue deliberately doesn't do>

## Validation criteria

- [ ] <lint, type-check and test commands that must pass>
- [ ] <end-to-end or manual check against a behaviour above>
- Evidence: <feature: walkthrough video | bug: before and after, plus the failing test | chore: "No visible change.">
