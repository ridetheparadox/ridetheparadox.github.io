# WEBSITE RULES — for every AI operator working in this repository

> **Scope:** this repository only: `ridetheparadox/ridetheparadox.github.io`.
> **Not** the studio's production workspace on the owner's PC. That has its own AGENTS.md, its
> own rules and its own ledgers, and it is never reached from here. If a task mentions prompts,
> clips to generate, publishing to Instagram or Facebook, credits, or `D:\`, it is not a website
> task. Stop and say so.
>
> **Applies to:** Claude (Claude Code, cloud projects), Astra / Sol (OpenAI Codex), DeepSeek,
> and any future model. Same rules, no exceptions by model.
>
> **Owner:** PARADOX. He holds final authority. Operators propose; he merges.

---

## 1. WHAT THIS REPOSITORY IS

Two static sites, no build step, no dependencies.

| Path | Site | Served by | Live address |
|---|---|---|---|
| `/` (root) | Link-in-bio page behind the Instagram and Facebook bios | GitHub Pages | https://ridetheparadox.github.io/ |
| `/studio/` | The PARADOX studio portfolio: 94 films, hire enquiry, legal pages | Cloudflare Pages, project `paradox-ai-creatives` | https://paradox-ai-creatives.pages.dev/ |

`_config.yml` excludes `studio/` from GitHub Pages. Cloudflare serves `studio/` as its root.
The older Netlify site (`paradox-ai-creatives.netlify.app`) is legacy; do not link to it.

**The purpose of the studio site is to attract paid creative clients.** Dark cinematic sci-fi,
curated films, private pricing. It is a portfolio, not a blog and not a shop.

## 2. HARD RULES — never break these

1. **A merge to `main` is a publish.** Both hosts deploy from `main` automatically. Therefore:
   work on a branch, open a pull request, describe the change, and STOP. PARADOX merges. No
   operator merges its own pull request, ever, even for a typo.
2. **No public prices.** Pricing is private and by enquiry. Never add a price, a rate, a
   "from $" or a package tier anywhere on either site, including structured data.
3. **The enquiry form is sacred.** It posts to `https://formspree.io/f/xkjwypyb`. Never change
   that address, never add or remove required fields without a ruling, and never submit a test
   entry: every submission emails the owner and counts against his Formspree quota.
4. **Legal pages are not yours to rewrite.** `privacy`, `terms`, `cookies`, `dmca`,
   `ai-disclosure`, `accessibility`. Fix a broken link or a typo; do not change meaning, the
   contact address (`ridetheparadox@gmail.com`) or the liability limit (US$100).
5. **Media is byte-identical or absent.** Never re-encode, compress, rename, crop or "optimise"
   anything in `studio/clips/`, `studio/posters/` or `studio/images/`. New media is added only
   when the owner names the file. Nothing is generated.
6. **`ridetheparadox.com` does not exist.** The owner never owned it. Never reference it.
7. **Analytics stays consent-gated.** GA4 `G-LRQBSDTF9T` loads only after the visitor accepts,
   via `localStorage.pdxCookies`. Do not add trackers, pixels or third-party scripts.
8. **No secrets, ever.** This is a public repository. No tokens, keys, emails other than the
   published contact, or private notes. Prompts and production workflow are private and never
   appear here in any form.

## 3. HOW THE STUDIO SITE WORKS — read before touching it

- **Video streaming.** `studio/_worker.js` serves `/clips/*` with HTTP byte ranges so mobile
  seeking works. It contains `VIDEO_SIZES`, a table of every clip's exact byte length.
  **If any clip is added, removed or replaced, `VIDEO_SIZES` must be regenerated** from the real
  files or playback breaks. `studio/_routes.json` limits the worker to `/clips/*`; leave it.
- **The collection.** `studio/collection.json` lists every film with its poster. Keep it in
  sync with the files on disk; every entry needs an existing clip and an existing poster.
- **The entry gate.** Visitors acknowledge before films play; ambient films are posters until
  then and pause off-screen, in dialogs, on reduced motion, on hidden tabs and on data-saver.
  Preserve all of that behaviour in any change to `studio/studio.js`.
- **Motion.** Native scrolling drives layered parallax; there is no wheel interception. Keep
  reduced-motion support.
- **The links hub** at `studio/links/` and the root page both track outbound clicks by card name.
  Keep UTM parameters on hub links intact.

## 4. HOW TO WORK — every task, every model

1. Read this file, then `website-agents/HANDOFF.md` to see what the last operator left.
2. Do the one task you were given. Nothing else. No "while I'm here" tidying.
3. Branch name: `<model>/<short-task>`, e.g. `claude/hero-still`, `astra/fix-dmca-link`.
4. Verify without spending: syntax-check JS with `node --check`, confirm every path referenced
   in HTML exists, confirm `collection.json` entries match files, and if a clip changed, run the
   size-table regeneration and diff it. Do not decode or play video in your context; a byte
   count from the filesystem is the check.
5. Open a pull request. Title: what changed. Body: why, what you verified, what you did not
   verify, and anything PARADOX must decide. Link the handoff entry.
6. Append an entry to `website-agents/HANDOFF.md` on the same branch (format below).
7. Stop. Do not merge. Do not deploy. Do not touch Cloudflare or GitHub settings.

## 5. CREDIT DISCIPLINE

`website-agents/CREDIT_DISCIPLINE.md` applies here word for word. In this repository the two
costliest mistakes are validating video inside the model and reading `_worker.js` in full
(the size table is 10 KB of numbers you never need to read). Use `grep`.

## 6. WHAT NEEDS THE OWNER'S EXPLICIT YES

Merging. Deploying. Adding or removing a film. Changing any legal text. Changing the form.
Changing analytics. Anything that reaches the public. Approval is per task, never blanket.

## 7. RELATED

`AGENTS.md` (root pointer) · `CLAUDE.md` (root pointer) · `website-agents/HANDOFF.md` ·
`website-agents/CREDIT_DISCIPLINE.md` · `README.md` (the link-in-bio page)
