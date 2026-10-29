# Where a board and docs/design.md disagree, follow the doc without asking

- **Added:** 2026-10-29 · **Applies to:** spec | implement | review · **Issue:** TAS-81
- **Paths:** `frontend/src/dino/**`, `docs/design/**`
- **Rule:** `docs/design.md` says it wins over a board, so a difference between the two is already decided: build to the doc and list each difference in the spec's Decisions ("the board draws X; the doc says Y; built Y"), so the PR shows it. Review checks the difference is listed rather than raising it again. Ask only when the doc contradicts itself or says nothing, and then propose the fix to the doc with the question.
- **Why:** On 29 Oct the TAS-75, TAS-78 and TAS-81 runs each asked the human to choose between a board and the doc (the primary button's border, striking through a ticked row's amount, a mint diet sticker), and each time the recommended answer and the human's was the doc. The boards were drawn before the doc tightened the pastel and forced-colours rules, and they aren't redrawn.
