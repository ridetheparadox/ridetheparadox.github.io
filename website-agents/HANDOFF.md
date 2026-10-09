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
Done: Local unified portal, simplified film acknowledgement, consented GA4 portal events, and approved legal disclosures are ready for PR review.
Proof: `python work/check_site.py` PASS; `node work/analytics_test.js` PASS; both JS syntax checks PASS; `git diff --check` PASS; JEV code review CLEAR.
PARADOX next:
1. Merge the pending website-rules PR #2.
2. Review and merge this unified-portal PR when ready to publish.
Open questions: The GA4 account's retention setting was not verified because an email-preferences prompt blocks the admin screen; no account preference was changed.
Context cost: moderate; account inspection and JEV review were the largest steps.

## 2026-10-08 — Claude — claude/ads-landing-page — PR READY
Task: Concept 1 from the ads strategy: a separate landing page for paid-ad traffic that shows Paradox makes short ads for any business, not only sci-fi. PARADOX: "dont touch the main website".
Changed: new files only, `studio/ads/index.html`, `studio/ads/ads.css`, `studio/ads/ads.js`. No existing site file edited; homepage, films, gate, legal pages, sitemap, worker and collection untouched.
Form: copied byte for byte from `studio/index.html` (same Formspree endpoint and fields); only the privacy/terms links gained `../`. The email subject reads "PARADOX ADS ENQUIRY" so ad leads are recognisable. No test submission.
Analytics: same consent gate and `links/analytics.js` as the studio page; no new tracker or pixel.
Verified: `node --check studio/ads/ads.js`; every local path in the page exists except the two pending sample files; form diff identical; headless Chromium at 1440 and 390 wide, no horizontal overflow, no JS errors.
Media: `studio/ads/media/EMBER-AND-OAK_15s_9x16.mp4` (15,541,491 bytes) and `EMBER-AND-OAK_poster_9x16.jpg` (220,864 bytes), copied byte-identical from PARADOX's folder `C:\PARADOX\BUSINESS\SMALL BUSINESS ADS\Ember and Oak (spec 2026-10-08)\` after PARADOX named it in the thread. Served as static files outside `/clips/`, so `VIDEO_SIZES` and `_routes.json` are untouched. The other two sample slots are "Coming soon".
Needs PARADOX: check the clip on the branch preview, then merge; a Meta Pixel would need a separate ruling plus cookie/privacy updates.
Cost: small; two headless screenshots were the largest step.

## 2026-10-08 — Claude — claude/ads-enquiry-event — PR READY
Task: Count quote requests from the /ads/ page so Google Ads can see which ads bring enquiries. PARADOX approved in the thread ("do 1 and 2").
Changed: `studio/ads/ads.js` only. After Formspree confirms a submission, and only when `pdxCookies` is `all`, it sends GA4 event `generate_lead` with `lead_source: ads_page`. No form fields are sent. No new tracker, pixel or script.
Verified: `node --check`; headless Chromium with Formspree intercepted (nothing reached Formspree): consent `all` fires exactly one `generate_lead`, consent `essential` fires none, success message unchanged.
Legal: privacy and cookie pages already disclose GA4 "site interactions" and that form fields are not sent; not edited.
Needs PARADOX: merge; then in GA4 mark `generate_lead` as a key event, link GA4 to Google Ads and import it as a conversion.
Samples (added to this branch 2026-10-08 evening): `studio/ads/media/HALDEN_15s_9x16.mp4` (14,234,618 bytes), `HALDEN_poster_9x16.jpg` (196,914), `NORTHSIDE-BARBER-CO_15s_9x16.mp4` (14,454,767), `NORTHSIDE-BARBER-CO_poster_9x16.jpg` (159,510), copied byte-identical from PARADOX's `C:\PARADOX\BUSINESS\SMALL BUSINESS ADS\Halden (spec 2026-10-08)\` and `...\Northside Barber Co (spec 2026-10-08)\`. Both folder ledgers confirm these are the final DaVinci-graded cuts (Northside after the owner's clipper-macro cut). They replace the two "Coming soon" cards; the leftover "In production" label now reads "Sample ad".

## 2026-10-08 — Claude — claude/ads-quote-form — PR READY
Task: make the /ads/ quote form tell PARADOX what kind of ad a lead wants and roughly what they can spend, so leads can be quoted.
Ruling: PARADOX chose "Ranges + ad types" on 2026-10-08 after being told the form fields are locked and that budget ranges come close to the no-public-prices rule. These are the visitor's budget ranges, not PARADOX prices or package tiers. The dollar figures are the defaults Claude proposed; PARADOX can change them.
Changed: `studio/ads/index.html` only. "What are we making?" (`service`, still required) now lists ad types: Product ad / online store; Restaurant, café or food; Local service; Real estate or venue; App, software or online business; Event or launch; Something else. "Budget" (`budget`) is now a required dropdown: Under $500, $500–1,500, $1,500–5,000, $5,000+, Not sure yet. Field names and the Formspree address are unchanged. The main studio form is untouched.
Verified: headless Chromium at 390 wide, both selects required, no JS errors, no horizontal overflow; Formspree requests were intercepted and none was sent. No test submission.
Also on this branch (2026-10-08, after PARADOX saw "Coming soon" on this preview and asked for bug and security checks): merged `claude/ads-enquiry-event` (PR #10) in, because this branch was cut from `main` before the Halden and Northside samples existed. Added `studio/_headers` with nosniff, frame-deny, referrer and permissions headers for `/ads` and `/ads/*` only; no other path gets new headers.
Tests: all three MP4s decode end to end with ffmpeg (H.264 High, yuv420p, AAC, moov at the front for fast start); in Chromium, with short VP9 stand-ins swapped in only for playback testing, all three sample cards and the hero play at 390 and 1440 wide; no fallback cards, no 4xx, no JS errors, no overflow; reduced motion loads no video; empty submit is blocked and nothing reached Formspree. Code scan: no innerHTML, eval, http links or target=_blank.
Needs PARADOX: check the preview, then merge. Merging this PR also delivers PR #10 (tracking and samples); PR #10 can then be closed or will show as merged.
Cost: small.

## 2026-10-09 — Claude — claude/ads-prelaunch-fixes — PR READY
Task: pre-launch bug scan of the /ads/ landing page before PARADOX publishes the Google Ads, with fixes on /ads/ only (owner: "dont touch the main website").
Changed: `studio/ads/ads.css` makes the cookie panel a slimmer bar on phones (600px and narrower) so it no longer covers the hero "Get a quote" button on arrival; it also drops the CSS `@import` for Google Fonts. `studio/ads/index.html` loads the same font URL with a `<link>` and preconnects, so fonts start downloading without waiting for ads.css. `studio/ads/ads.js` gives sample videos native tap-to-play controls when autoplay is blocked (iPhone Low Power Mode), on reduced motion and on data-saver, instead of leaving a still poster with no way to play; nothing downloads until the visitor taps. Consent, analytics, the form and media are unchanged.
Verified (local copy in headless Chromium; the live site is not reachable from the cloud container or the owner's device sandbox): iPhone SE, iPhone 13, Pixel 7 and 1440 desktop; no JS errors; no horizontal overflow; hero CTA now tappable with the cookie panel showing on iPhone 13 (was covered); no GA request before consent, GA loads after "Allow analytics"; a filled form posts once (Formspree intercepted, nothing sent) and fires `generate_lead`; empty submit blocked; every local link, script, image and poster on all studio pages and the root page resolves; studio pages and the root page load with no JS errors.
Not verified: real playback of the H.264 MP4s (test Chromium has no H.264; media unchanged since the last pass decoded them); the live Cloudflare deploy and headers.
Needs PARADOX (as first written; see the update below for item 1): (1) Google Ads conversion tracking. `studio/links/analytics.js` sets `ad_user_data` and `ad_storage` to denied, so Google Ads will likely not credit leads imported from GA4 `generate_lead`; changing it is an analytics and cookie-policy change that needs your yes. (2) Each sample MP4 is about 14–15 MB for 15 s; a phone visitor downloads the hero clip right away. Smaller encodes (2–4 MB) would help page speed, but media is only changed when you name files. (3) Optional: hidden form fields to capture `gclid` and UTMs with each enquiry; that is a form change.
Update (2026-10-09, same branch): Paradox said yes to item (1) in the project chat ("yes" to "Say yes to fix 1"). Google Ads can now count leads from the ads page. `studio/ads/ads.js` records `pdxAdMeasurement=yes` when the visitor allows analytics on /ads/ and sets `window.PDX_AD_MEASUREMENT` before loading `studio/links/analytics.js`, which then defaults `ad_storage` and `ad_user_data` to granted; `ad_personalization` stays denied everywhere and every other page is unchanged (ad storage denied, including /ads/ visitors who only consented elsewhere). Choosing Essential only revokes it and deletes `_gcl` as well as `_ga` cookies. The /ads/ cookie panel now asks "May we use analytics and ad cookies?" and says it is never used for ad personalisation. `studio/cookies.html` and `studio/privacy.html` disclose ads-page ad measurement and `_gcl` cookies (dated 9 October 2026); the contact address and liability limit are untouched. Verified in headless Chromium: consent defaults per page as above, revoke clears cookies, form and `generate_lead` still work, hero CTA still tappable on iPhone 13 and Pixel 7.
Needs PARADOX for this to count anything: in Google Ads, link the GA4 property, mark `generate_lead` as a key event in GA4 and import it as a conversion. Items (2) and (3) were not approved and are not done.
Cost: small.
