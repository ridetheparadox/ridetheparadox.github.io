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
Needs PARADOX: any decision or approval still open.
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
Needs PARADOX: merge the pull request; then create the Claude project on this repo with the
one-line instruction in `CLAUDE.md`.
Cost: small; the most expensive step was the initial clone (416 MB) which sits on D:\Website.

## 2026-09-24 — GPT-6 Sol — sol/unified-portal — REVIEW READY
Task: Merge the separate social links experience into the top of the PARADOX studio website for review.
Changed: `studio/index.html`, `studio/portal.css`, `studio/studio.js` add a destination section after the beach hero and a mobile Explore link.
Changed: root `index.html` and `studio/links/index.html` lead old bio traffic to the studio destination section, retaining query parameters.
Verified: desktop and mobile previews inspected; JS syntax and diff whitespace checked; 47 page references, 93 film paths, form endpoint, legal routes and offer links checked locally. No form submission, deployment or social profile edit.
Needs PARADOX: review the local preview and diff; approve a pull request and later merge separately. This branch starts from pending `claude/website-agent-rules` (PR #2).
Cost: modest context; visual inspection and the local repository clone were the largest steps. JEV code gate CLEAR (0 block, 0 review; 17,521 input tokens), report `portal.patch.jev-prgate.md` in the local review folder.
