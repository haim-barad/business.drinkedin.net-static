# business.drinkedin.net — Project Instructions

## What this repo is

The **B2B marketing site** for DrinkedIn, at `business.drinkedin.net`. Static HTML built by Vite, hosted on **Cloudflare Pages** — completely separate from the main platform on the DigitalOcean droplet. Pushing to `main` here deploys within about a minute.

This is *not* the product. The product lives in [`haim-barad/drinkedin`](https://github.com/haim-barad/drinkedin) (Flask + React, `drinkedin.net` and `ai.drinkedin.net`). **That repo's `CLAUDE.md` is the authority on the business, the strategy, and the rules.** This file exists because those rules do not otherwise reach this repo — which is a large part of how this site sat five months out of date, publishing invented customer testimonials.

Work is tracked in **Linear**, team *Software Engineering*, project *DrinkedIn Monetization & Acquisition Readiness*. This repo is scheduled to be folded into the main one and archived — see **SWE-1043**. Until then, keep this file in sync with the main repo's rules.

## Who the page is for

**Brands who would fund their agents' presence in DrinkedIn's virtual venues**, and the humans who control those budgets. Decided 2026-07-30.

**Not agents.** External agents discover DrinkedIn through `skill.md`, `llms.txt`, `openapi.json` and the MCP server; they never read a marketing page. Links to developer docs exist here for the *human* building an agent, not for the agent.

## Hard rules

1. **Never invent social proof.** No testimonial, logo, case study, or quote unless it comes from a real, named, consenting customer. Three fabricated testimonials ("Maria Chen, Owner, The Velvet Lounge" and two others, one claiming a 23% sales lift) were live here from 2026-02-24 until 2026-07-30. DrinkedIn has earned $0 and has never had a paying partner. Placeholder copy that ships is a lie, not a placeholder.

2. **Every number must be counted, dated, and checkable.** Do not carry a figure forward because it was already on the page. Verify against production and label it with the date you verified it. The page previously claimed `3M+` monthly views (real: ~13 sessions/day per GA4) and `25,000+` bars (real: 54,358 — understated). Both had been hand-typed and never re-checked.

3. **No real-world alcohol commerce.** No affiliate links to liquor retailers, no transactions with real venues, no implication that anything physical is sold. "Nothing real is sold. No real alcohol, ever." belongs on the page and does.

4. **Disclosure always.** Agent-generated content is labelled AI-generated. Paid placement is labelled sponsored (FTC). Agents we operate are labelled house agents — never "shills". This applies to mockups and screenshots too.

5. **Do not use a real third party's brand in a mock.** The old AI demo showed an agent recommending a real, named spirits brand with "Featured this week". Use the `YOUR BRAND` placeholder.

6. **Do not sell sponsored placement inside agent decisions.** Paid ranking in the API responses agents use to choose is a **cancelled product** — FTC exposure, and it corrupts the behavioural dataset we intend to license. It is now also a public commitment in `/terms.html`. Presence and sponsorship are labelled and sit *beside* the decision, never inside it.

7. **Say what is not yet true.** The "Where this actually stands" section states that most agents in the venues are house agents we operate and that brand programmes are opening rather than established. Do not quietly delete it to make the page read stronger.

## Email addresses that exist

`drinkedin.net` mail is on Microsoft 365 and **there is no catch-all** — mail to an undefined address bounces. Only two aliases exist:

| Address | Use |
| -- | -- |
| `sales@drinkedin.net` | Business, partner and brand enquiries. Also the Stripe account email, so it is demonstrably monitored. |
| `support@drinkedin.net` | Support, and privacy / data-rights requests. |

Both may route into the Freshdesk queue shared with loyalty.dog. That is fine — a real monitored destination beats a tidy-looking dead one.

**Never publish an address without checking it against this list.** `partners@` and `privacy@` were published here on 2026-07-30 purely because they read well; neither existed, so every message to them would have bounced.

## Verifying numbers

Live, public, unauthenticated. Figures on the page as of 18 October 2026:

```
GET https://ai.drinkedin.net/api/health                 # features.virtual_venues → 4,986 virtual venues
GET https://ai.drinkedin.net/api/cocktails/            # pagination.total → 9,442 cocktail recipes
GET https://drinkedin.net/api/data/v1/products         # products.bars.records_available → 4,250 licensed premises in the Bars data feed
```

Directory totals and logged-conversation totals are not publicly measurable, so the page does not show them.

`public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`, and `src/404.html` exist. The sitemap must list any new page.

**`drinkedin.net` returns HTTP 200 for every path** — the React shell, 1,771 bytes. A 200 does not mean a page exists. Always fetch a deliberately bogus URL as a control and compare byte counts. `drinkedin.net/docs` is real (42 KB); `drinkedin.net/privacy` and `/terms` are **not**.

## Layout

| Path | |
| -- | -- |
| `src/index.html` | The page. Vite's root is `src/`. |
| `src/privacy.html`, `src/terms.html`, `src/404.html` | Legal pages, and the not-found page. Registered as entries in `vite.config.js` — a new page **must** be added there or it silently will not build. `404.html` is `noindex`. |
| `public/` | `robots.txt` (allow all), `sitemap.xml` (this site's own pages only — list any new page), `llms.txt`, `_headers` (long-cache rule for hashed `/assets/*` only), `favicon.ico` (a copy of drinkedin.net's), `og-image.png` (the 1200x630 share card named in `index.html`'s og:image and twitter:image; unhashed so the URL stays stable). Every page links the favicon and preconnects to `drinkedin.net` for the consent script; the legal pages carry their own canonical. Copied into `dist/`. Cloudflare Pages 308-redirects /x.html to /x, so the sitemap and links use the extensionless URLs. |
| `src/styles/main.css` | All styles. |
| `src/scripts/main.js` | Mobile menu and form state. Intentionally small. No scroll reveals: content at `opacity:0` until an observer fires shows as blank bands in captures and link previews. |
| `index-source.html` | **Dead.** Vite's root is `src/`, so this is never served. |

## Analytics and consent

Google Analytics is loaded **only** through the shared DrinkedIn consent script, `<script src="https://drinkedin.net/consent-analytics.js?v=3"></script>`, in the `<head>` of every page (SWE-1240). It implements Google Consent Mode v2, draws the consent banner, and stores the choice in the `drinkedin_cookie_consent` cookie on `.drinkedin.net`, shared with drinkedin.net. **Never add a gtag snippet here.** The consent mode is one switch in that file in `haim-barad/drinkedin`; see `docs/ops/analytics-consent.md` there. It is **advanced** since 2026-09-25 (gtag.js loads with every signal denied and sends cookieless pings; GA cookies only after Accept), and `src/privacy.html` describes that, so it must change if the mode does. The `?v=N` is a cache buster: when the script changes in the main repo, N is bumped there (`SCRIPT_VERSION` in `backend/tests/test_consent_analytics.py`) and must be bumped on every page here too. Merge that bump here only **after** the main-repo deploy is live, and do not open this repo's Pages preview before then: it requests the new URL from production, and Cloudflare would cache the old file under it for a year (that is what burned `?v=2`). A new page needs the tag too.

## Design

"Last call, for machines" — a dim bar rendered through a terminal. Warm brass and lamplight against mono type and precise rules; the tension between the two is the product.

- **Instrument Serif** display · **IBM Plex Sans** body · **IBM Plex Mono** data and labels
- Ink `#0A0D0C` · brass `#D99A4E` / `#F2BE7A` · phosphor `#6FE3B0` · bone `#EFE9DE`
- The DrinkedIn mark is drawn for **light** backgrounds. It sits on its own warm plate rather than being recoloured. `box-sizing: content-box` on `.mark-img` — the global `border-box` otherwise lets the padding eat the artwork.
- **Type floor 14px**, buttons 16px sentence case in the sans, and 44px tap targets (the menu button included).
- **No counter animation on the statistics.** They are measurements; counting them up from zero makes them read as decoration.
- Every link that leaves this site takes `target="_blank"` and `rel="noopener noreferrer"`. Internal anchors, the legal pages, and `mailto:` links stay in the same tab.

## Commands

```
npm install
npm run dev        # localhost:3000
npm run build      # -> dist/
npm run preview
```

There is no CI on this repo. Build locally before pushing — a broken build fails silently until someone looks at the live site.
