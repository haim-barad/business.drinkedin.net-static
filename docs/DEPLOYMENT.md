# Deployment Guide - DrinkedIn Business Static Site

This guide covers deploying the DrinkedIn business site to various static hosting platforms.

## 🚀 Cloudflare Pages Quick Reference

**Essential Settings:**
- Framework preset: **None** (not VitePress)
- Build command: `npm install && npm run build`
- Build output directory: `dist`
- Node.js version: 18+

## Quick Start

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder** to your chosen platform.

## Platform-Specific Instructions

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Set build configuration:
   - **Framework preset**: None (leave blank) - Do NOT select "VitePress" as that's different
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: (leave blank)
   - **Node.js version**: 18 or later
3. Deploy automatically on git push

**Important Notes for Cloudflare Pages:**
- **Framework preset must be "None"** - Cloudflare has "VitePress" but that's for VitePress sites, not Vite builds
- VitePress ≠ Vite (VitePress is a static site generator, Vite is a build tool)
- Our project uses Vite as a build tool, so select "None" for framework preset

**Troubleshooting Cloudflare Pages:**
- If you get "Module not found" errors, ensure the build command includes `npm install &&`
- Make sure the Node.js version is set to 18 or later in Cloudflare Pages settings
- DO NOT select "VitePress" - that's for different projects
- Verify the build output directory is exactly `dist` (not `./dist` or `/dist`)

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build configuration:
   - **Base directory**: (leave empty)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Deploy automatically on git push

### Vercel

1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect the Vite configuration
3. Deploy automatically on git push

### GitHub Pages

1. Enable GitHub Pages in repository settings
2. Use GitHub Actions for deployment:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Custom Server/VPS

1. Upload the `dist/` folder contents to your web server
2. Configure your web server to serve static files
3. Ensure proper MIME types are set for assets

## Environment Variables

No environment variables are required for basic functionality. The Formspree endpoint is hardcoded in the HTML.

## Custom Domain Setup

### DNS Configuration
- Set up A records or CNAME records pointing to your hosting provider
- Most platforms provide specific DNS instructions

### SSL/HTTPS
- Most modern static hosting platforms provide automatic SSL certificates
- Ensure your site is served over HTTPS for security

## Performance Optimization

The built site includes:
- ✅ Minified CSS and JavaScript
- ✅ Optimized images
- ✅ Gzipped assets
- ✅ Cache-friendly file names with hashes

## Monitoring

Consider setting up:
- Google Analytics for traffic monitoring
- Uptime monitoring for availability
- Performance monitoring with tools like Lighthouse CI

## Rollback Strategy

- Keep previous builds in version control
- Most platforms support rollback to previous deployments
- Test thoroughly in staging before production deploys

## Contact Form Notes

- The Formspree contact form will work immediately after deployment
- No additional server configuration needed
- Form submissions will be processed by Formspree's servers
- Make sure the Formspree endpoint `https://formspree.io/f/mldnyrgw` is configured properly

## Troubleshooting

### Common Issues

1. **Assets not loading**: Check file paths and ensure build completed successfully
2. **Form not working**: Verify Formspree endpoint and form HTML structure
3. **Mobile menu not working**: Check JavaScript loading and errors in browser console
4. **Images not displaying**: Verify image files are in the correct location and properly referenced

### Build Issues

If the build fails:
1. Clear node_modules: `rm -rf node_modules package-lock.json`
2. Reinstall dependencies: `npm install`
3. Try building again: `npm run build`

## Support

For deployment-specific issues, consult the documentation for your chosen hosting platform:
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
