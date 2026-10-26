# Write each interview question so it holds whatever the earlier answers are

- **Added:** 2026-10-26 · **Applies to:** spec · **Issue:** TAS-17
- **Rule:** The router asks spec questions one at a time, and the human can answer each with any option. Write each question's context so it is true for every option of the questions before it, or say which earlier answer it depends on ("With a fixed list, …; with a model, …"). When an answer breaks a later question's premise, record the consequence in the spec's Decisions and point it out at approval.
- **Why:** On TAS-17, the question about the picker's options said "the whole list comes from the API schema with no extra request", which was only true for a fixed list in code. The human chose a model for cuisines, so the picker needs a request with its own loading and error state. The question about existing recipes likewise left open which cuisine they would get once several and required were both chosen.
