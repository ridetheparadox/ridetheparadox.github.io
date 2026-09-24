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

## 2026-09-24 — GPT-6 Sol — sol/unified-portal — REVIEW READY
Task: Simplify the first-film acknowledgement; keep the exact 25% off with code offer in the site test; prepare a shareable GitHub Pages link.
Changed: `studio/index.html` replaces three required film checkboxes with one age and Terms of Use acknowledgement, while keeping the AI notice and a privacy link.
Changed: `studio/portal.css` styles the privacy link in the film dialog. The local `work/check_site.py` test now checks the simplified film form and the exact Runway offer text.
Verified: first-film dialog inspected in a clean browser origin; unchecked form blocked entry, and close dismissed the dialog. Static test passes (47 references, 93 film paths, exact offer text), JS syntax and diff whitespace pass. JEV code review CLEAR (0 block, 0 review; 9,627 input tokens). No form submission, analytics change, deployment, or social profile edit.
Needs PARADOX: approve the pull request and later merge as separate public actions. The proposed public share URL is https://ridetheparadox.github.io/ after deployment. Analytics implementation needs a specific ruling because the 2026-09-20 no-observability instruction conflicts with this request; the user was asked to clarify.
Cost: modest context; browser interaction and the JEV code gate were the largest steps.

## 2026-09-24 — GPT-6 Sol — sol/unified-portal — PR READY
Task: Track the unified site's destination choices with consented GA4, disclose it accurately, and prepare the short GitHub Pages link for socials.
Changed: `studio/index.html` labels the five portal links with fixed identifiers. `studio/links/analytics.js` emits a separate GA4 event for each portal after Allow analytics, including the internal project link; advertising signals and ad personalization are disabled.
Changed: `studio/cookies.html` and `studio/privacy.html` now disclose optional GA4 traffic and portal-choice measurement, Google's role, and the Essential only choice. PARADOX specifically approved both legal-page edits.
Verified: local site test checks 47 references, 93 film paths, all five portal identifiers, and the exact Runway "25% off with code PARADOX25" offer. Node analytics test checks no GA4 script on Essential only, portal event after opt-in, and no new event after revocation. JS syntax and diff whitespace pass. The signed-in PARADOX GA4 property shows recent traffic, but an email-preferences prompt prevented inspecting account settings without changing preferences. JEV code review CLEAR; decision review findings resolved and graded. No form submission or public deployment.
Needs PARADOX: review this pull request and merge it personally after pending rules PR #2. Once deployed, share https://ridetheparadox.github.io/ on socials; it redirects to the unified studio portal. GA4 event counts can be checked after real consenting visits.
Cost: moderate context; legal research, browser account inspection, and JEV gates were the largest steps.
