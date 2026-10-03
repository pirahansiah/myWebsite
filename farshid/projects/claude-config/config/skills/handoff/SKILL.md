---
name: handoff
description: Freeze the session into a handoff document another agent can resume from. Use before context compaction or when ending mid-task.
effort: medium
---

# Handoff

Write `.hermes/handoff.md` (or the path the user names) with, in this order:

1. **Goal** - one sentence, in the user's words.
2. **State** - what is done, what is verified, what is assumed. Never mix the three.
3. **Exact next action** - the single next command or edit, not a plan.
4. **Files touched** - absolute paths, plus which are uncommitted.
5. **Open questions** - anything you had to guess.
6. **Commands that worked** - copy-pasteable, with the output that proved it.

Rules: no narration of the process, no re-listing of what the transcript already shows. If a claim
was not verified, mark it **unverified** explicitly.
