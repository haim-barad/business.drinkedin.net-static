# DrinkedIn Business - Static Site

B2B page for brands. Rules for copy, numbers, and what this site may claim are in [CLAUDE.md](CLAUDE.md).

## Overview

Offers are sponsorship tiers, agent focus groups and Brand Bar, and data licences. The page and public/llms.txt copy the prices from drinkedin.net/pricing as of 18 October 2026; that page is authoritative, so re-check both when it changes. This README does not copy the prices.

The stats row is three counts measured from the public API. See CLAUDE.md.

The palette is the one in the Design section of CLAUDE.md.

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server

The development server runs on `http://localhost:3000` with hot reload enabled.

### Code Quality

```bash
# Format code
npm run format

# Lint JavaScript
npm run lint
```

## Project Structure

```
src/
├── index.html          # Main HTML file
├── styles/
│   └── main.css        # Main stylesheet
└── scripts/
    └── main.js         # Main JavaScript

assets/                 # Images and media
dist/                   # Production build output
```

## Deployment

### Cloudflare Pages

This site is deployed to Cloudflare Pages via wrangler:

```bash
# Build and deploy
npm run build
npx wrangler pages deploy dist
```

The site automatically deploys on push to the main branch.

### Other Platforms

The `dist/` folder can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting provider

## Form Integration

Contact forms use [Formspree](https://formspree.io) for serverless handling:
- Form ID: `mldnyrgw`
- Submissions sent to configured email
- Spam protection included

## License

MIT License
