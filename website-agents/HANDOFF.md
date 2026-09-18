# HANDOFF — shared log between every operator on this website

> Append-only. Newest at the bottom. Never edit or delete another operator's entry.
> Claude and Astra/Sol read this before starting and write to it before opening a pull request.
> This is the only place the two can talk to each other about this site.

Format for every entry:

```
## YYYY-MM-DD — <model> — <branch> — <status: PR OPEN | MERGED BY EDWIN | ABANDONED>
Task: one line, the owner's words.
Changed: files touched, one line each.
Verified: what was checked and how. What was NOT checked.
Needs Edwin: any decision or approval still open.
Cost: rough context used; the most expensive step.
```

---

## 2026-09-17 — Claude (Opus 5, desktop session) — claude/website-agent-rules — PR OPEN
Task: "Set up the website project; leave clear instructions for both Claude and Astra/Sol."
Changed: added `AGENTS.md`, `CLAUDE.md`, `website-agents/RULES.md`, `website-agents/HANDOFF.md`,
`website-agents/CREDIT_DISCIPLINE.md`. No site file touched.
Verified: repo cloned read-only; both live addresses, the Formspree endpoint, the GA4 id, the
liability limit, the worker's size table and the routes file confirmed from the files. Nothing
decoded, nothing played.
Needs Edwin: merge the pull request; then create the Claude project on this repo with the
one-line instruction in `CLAUDE.md`.
Cost: small; the most expensive step was the initial clone (416 MB) which sits on D:\Website.
