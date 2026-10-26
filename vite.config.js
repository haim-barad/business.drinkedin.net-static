import { resolve } from 'path';
import { defineConfig } from 'vite';
import { generateSitemap } from './scripts/generate-sitemap.mjs';

function sitemapLastmod() {
  return {
    name: 'sitemap-lastmod',
    apply: 'build',
    enforce: 'post',
    // Runs after the public dir is copied, so dist/sitemap.xml carries
    // lastmod from git rather than the dateless file in public/.
    closeBundle() {
      generateSitemap(resolve(__dirname, 'dist/sitemap.xml'));
    }
  };
}

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  plugins: [sitemapLastmod()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      // Multi-page. Without these entries Vite builds index.html only, and the
      // footer's Privacy/Terms links would 404 -- which is a large part of how
      // they ended up as dead "#" links in the first place.
      input: {
        main: resolve(__dirname, 'src/index.html'),
        privacy: resolve(__dirname, 'src/privacy.html'),
        terms: resolve(__dirname, 'src/terms.html'),
        notfound: resolve(__dirname, 'src/404.html')
      },
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
