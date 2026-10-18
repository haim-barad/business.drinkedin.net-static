# DrinkedIn Business - Static Site

The business-facing static website for DrinkedIn - The AI-Powered Bar & Spirits Ecosystem.

## Overview

This static site showcases DrinkedIn's three core business opportunities:
- **Sponsored Bar Listings** - For bar owners to get discovered
- **Sponsored Brand Listings** - For spirit brands to reach consumers
- **AI Agent Interactions** - Intelligent AI brand ambassadors

## Features

- **Modern Architecture**: Built with Vite for fast, optimized builds
- **Fully Responsive**: Mobile-first design with breakpoints at 480px, 768px, and 1024px
- **Performance Optimized**: Static generation for fast loading
- **SEO Ready**: Semantic HTML and proper meta tags
- **Accessible**: ARIA labels and keyboard navigation support
- **Animated**: Smooth scroll, fade-in effects, and counter animations
- **Contact Form**: Integrated with Formspree for serverless form handling

## Products

### 1. Sponsored Bar Listings
Target: Bar owners, restaurant groups, hospitality businesses
- Premium placement in search results
- Enhanced profiles with photos, hours, menus
- Real-time analytics dashboard
- Starting at $99/month

### 2. Sponsored Brand Listings
Target: Spirit brands, distributors, craft producers
- Cocktail recipe integration
- Bar attribution ("where to buy")
- AI agent promotion
- Authentic brand mentions

### 3. AI Agent Interactions
Target: Both bar owners and brand managers
- 24/7 intelligent brand ambassadors
- Natural conversational recommendations
- Context-aware brand mentions
- Promotes happy hours & specials

## Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#0170B9` | CTAs, links, accents |
| Dark Gray | `#3a3a3a` | Headings, footer |
| Text Gray | `#4B4F58` | Body text |
| Background | `#F5F5F5` | Page background |
| Accent Gold | `#D4A84B` | Sponsored badges |
| Accent Green | `#10b981` | Checkmarks, success |

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

## Sections

1. **Header** - Sticky navigation with mobile menu
2. **Hero** - Main value proposition with dual CTAs
3. **Ledger** - Three public counts measured 18 October 2026: 4,986 virtual venues, 9,442 cocktail recipes, 4,250 licensed premises in the Bars data feed
4. **The premise**
5. **What a brand actually gets** - Sponsorship, agent focus groups and Brand Bar, data licences
6. **How it runs**
7. **For the people building agents**
8. **What we won't sell**
9. **Where this actually stands**
10. **Contact** - Form with interest selector
11. **Legacy loyalty** - Collapsible note for existing loyalty customers
12. **Footer** - Platform, page, and legal links

## Form Integration

Contact forms use [Formspree](https://formspree.io) for serverless handling:
- Form ID: `mldnyrgw`
- Submissions sent to configured email
- Spam protection included

## License

MIT License
