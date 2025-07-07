# DrinkedIn Business - Static Site

A static version of business.drinkedin.net - The Alcohol Marketing Platform.

## Overview

DrinkedIn's alcohol marketing platform is dragging the alcohol industry kicking and screaming into the 21st century. This static version maintains the core design and messaging of the original WordPress site while providing improved performance and easier maintenance.

## Features

- **Modern Architecture**: Built with modern web standards
- **Responsive Design**: Mobile-first approach with breakpoints at 544px, 921px, and 1240px
- **Performance Optimized**: Static generation with Vite for fast loading
- **SEO Ready**: Semantic HTML and proper meta tags
- **Accessible**: ARIA labels and keyboard navigation support
- **Hero Section**: Full-screen hero with background image and overlay
- **Service Sections**: BrandFinder, Loyalty, BarDeals/Events, and Signature Cocktails
- **Contact Form**: Integrated with Formspree for serverless form handling
- **Smooth Animations**: Fade-in effects and smooth scrolling
- **Mobile Menu**: Responsive hamburger menu for mobile devices

## Color Scheme

- Primary: `#0170B9` (DrinkedIn Blue)
- Secondary: `#3a3a3a` (Dark Gray)
- Text: `#4B4F58` (Medium Gray)
- Background: `#F5F5F5` (Light Gray)
- White: `#FFFFFF`

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

docs/                   # Documentation
dist/                   # Production build output
```

## Deployment

This site is optimized for deployment on:
- Cloudflare Pages
- Netlify
- Vercel
- GitHub Pages
- Any static hosting provider

Simply build the project and deploy the `dist/` folder.

## License

MIT License
