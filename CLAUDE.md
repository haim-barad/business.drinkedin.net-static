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

## Verifying numbers

Live, public, unauthenticated:

```
GET https://ai.drinkedin.net/api/ai/observer/stats     # venues, agents, conversations
GET https://ai.drinkedin.net/api/health                # ai_agents, virtual_venues
```

Bars and cocktail totals are not exposed by an endpoint yet; they come from the production database. Figures on the page as of 2026-07-30: **4,986** virtual venues · **54,358** bars · **9,443** cocktail recipes · **1,445** logged conversations.

**`drinkedin.net` returns HTTP 200 for every path** — the React shell, 1,771 bytes. A 200 does not mean a page exists. Always fetch a deliberately bogus URL as a control and compare byte counts. `drinkedin.net/docs` is real (42 KB); `drinkedin.net/privacy` and `/terms` are **not**.

## Layout

| Path | |
| -- | -- |
| `src/index.html` | The page. Vite's root is `src/`. |
| `src/privacy.html`, `src/terms.html` | Real legal pages. Registered as entries in `vite.config.js` — a new page **must** be added there or it silently will not build. |
| `src/styles/main.css` | All styles. |
| `src/scripts/main.js` | Mobile menu, scroll reveals, form state. Intentionally small. |
| `index-source.html` | **Dead.** Vite's root is `src/`, so this is never served. |

## Design

"Last call, for machines" — a dim bar rendered through a terminal. Warm brass and lamplight against mono type and precise rules; the tension between the two is the product.

- **Instrument Serif** display · **IBM Plex Sans** body · **IBM Plex Mono** data and labels
- Ink `#0A0D0C` · brass `#D99A4E` / `#F2BE7A` · phosphor `#6FE3B0` · bone `#EFE9DE`
- The DrinkedIn mark is drawn for **light** backgrounds. It sits on its own warm plate rather than being recoloured. `box-sizing: content-box` on `.mark-img` — the global `border-box` otherwise lets the padding eat the artwork.
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
