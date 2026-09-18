# CREDIT DISCIPLINE — copy of the studio's rule, as it applies in this website repository

> Copied from the owner's private workspace on 2026-09-17. Script names below (backup_snapshot.py,
> session.py, deepseek_operator.py) live on the owner's PC, not here; in this repository the
> equivalents are: `git` for file moves, `node --check` and path checks for verification, and
> `website-agents/HANDOFF.md` in place of the session ledger. The rules themselves are unchanged.

> **Version** 1.1 · **Ruled** 2026-09-16 (rule 3 amended same day: owner-requested timers allowed, capped, fail loudly) by the owner · **Status** ACTIVE
> Applies to every model operator. Written after the 2026-09-13 overspend.

## WHAT HAPPENED

On 2026-09-13 (UTC) the weekly Codex budget was almost entirely consumed in one day by
gpt-6-astra agentic sessions. The session ledger attributes it to:

- 1,208 files created by the model by hand
- 962 files created by the model by hand
- website preview work that validated playback, motion, three seek
  ranges and a full video decode inside the model's context, then published to GitHub
- a heartbeat task that retried after being rejected twice

None of that was judgement work. All of it belongs to scripts.

## THE RULES — paste verbatim

```
CREDIT DISCIPLINE — read before doing anything (ruled by Edwin, 2026-09-16)

On 2026-09-13 you spent almost the entire weekly budget in one day. The ledger shows why:
two sessions that created 1,208 and 962 files by hand, a website session that validated
video playback, seek ranges and a full video decode inside your own context, and a
heartbeat task that retried after being rejected. None of that was model work.
These rules exist so it never happens again.

1. NEVER MOVE FILES IN BULK YOURSELF. Backups, mirrors, copies, renames and archive
   rebuilds go through the scripts: backup_snapshot.py, mirror_marketing.py,
   archive_prompts.py. You run the script once and read its one-line result. If a job
   would touch more than 20 files, stop and use a script or ask.

2. NEVER VALIDATE MEDIA IN YOUR CONTEXT. Do not decode, play, seek, frame-check or
   hash-compare video or images yourself. Write or call a Python checker that prints
   PASS/FAIL and read that line. A video file is never read into the conversation.

3. TIMERS ONLY WHEN EDWIN ASKS, AND THEY FAIL LOUDLY. You never create a heartbeat,
   scheduled task, loop or poll on your own. When Edwin asks for one ("check X every
   hour tonight"), you may set it up, with these limits:
   - It does exactly the check he named. Each run reads the startup files, does the
     one check, writes a one-line result to the log, and closes. Nothing else.
   - Cap it: no more than one run per hour, no more than 12 runs before it needs
     his say-so to continue, and each run stops itself at 5 minutes.
   - If a run is rejected, blocked, times out or cannot do the check, it STOPS THE
     WHOLE TIMER, deletes or disables it, and tells Edwin what failed and why. It
     never retries on its own and never keeps a broken timer alive.
   - Every timer is logged in the timer register (in this repository: a `Timers` section at the top of `website-agents/HANDOFF.md`) with its
     name, what it checks, when it started, who asked, and its cap. Anything running
     that is not in that file gets stopped on sight.

4. NO RETRIES ON REJECTION. If an approval, gate or permission check refuses you once,
   report it and stop. A second attempt at the same thing is a wasted spend.

5. READ ONLY THE STARTUP ORDER. AGENTS.md, CURRENT_HANDOFF.md, CURRENT_STATE.md,
   DURABLE_RULES.md, then only what the task names. Never read whole folders, logs,
   ledgers or transcripts "for context". Use search, then read the matching lines.

6. USE THE CHEAP MODEL FOR CHORES. Anything mechanical — running gates, publishing,
   ledger updates, file checks — runs on gpt-5.6, or is handed to DeepSeek through
   deepseek_operator.py. gpt-6 is for judgement: writing, reviewing, deciding.

7. ONE TASK PER SESSION, THEN CLOSE. Open with session.py, do the one task, close with
   session.py. Do not chain "while I'm here" work. Every extra loop is budget.

8. REPORT THE COST. In your closing summary state roughly how much context you used and
   what the most expensive step was. If you cannot say, that is itself a finding.

If a request conflicts with these rules, say so and wait. Being blocked costs nothing.
Burning the week's credits costs everything.
```

## RELATED

`DURABLE_RULES.md` rule 4 (nothing on auto) · `06_AUTOMATION/README.md` (the scripts) ·
`99_MIGRATION/MODEL_ADAPTERS/ASTRA/ADAPTER.md` · `99_MIGRATION/MODEL_ADAPTERS/DEEPSEEK/ADAPTER.md`
