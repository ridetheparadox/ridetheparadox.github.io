# PARADOX — link in bio

The page behind the link in the Instagram and Facebook bios for **PARADOX**
(`@paradox_ai_creatives`).

Static, no build step, no dependencies. Four files:

| File | What it is |
|---|---|
| `index.html` | the page |
| `analytics.js` | consent-gated GA4 loader + outbound click tracking |
| `paradox-logo-mark.jpg` | the chrome wordmark |
| `favicon.png` | tab icon |

## Notes

- Analytics loads **only** after the visitor accepts. The answer is stored in
  `localStorage.pdxCookies` as `all` or `essential` — the same key the main site's entry
  gate uses, so nobody is asked twice on the same origin.
- Outbound clicks are tracked **by card name**, so reporting shows whether people tap
  Hire, Subject 8, Merch, OpenArt or Runway.
- `noindex` — this page should not compete with the main site in search.

Main site: https://paradox-ai-creatives.netlify.app/
