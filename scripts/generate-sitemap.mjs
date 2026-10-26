import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const pages = [
  { loc: 'https://business.drinkedin.net/', file: 'src/index.html' },
  { loc: 'https://business.drinkedin.net/privacy', file: 'src/privacy.html' },
  { loc: 'https://business.drinkedin.net/terms', file: 'src/terms.html' }
];

function gitDate(args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

// Prefer the last commit that touched the page. A shallow clone (Cloudflare
// Pages defaults to depth 1) often cannot see that commit; fall back to the
// commit being built so every URL still ships a lastmod.
function fileDate(file) {
  return statSync(resolve(root, file)).mtime.toISOString().slice(0, 10);
}

export function lastmodFor(file) {
  const perFile = gitDate(['log', '-1', '--format=%cs', '--', file]);
  if (/^\d{4}-\d{2}-\d{2}$/.test(perFile)) return perFile;
  const head = gitDate(['log', '-1', '--format=%cs']);
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
  // Last resort when the build environment has no git history at all.
  return fileDate(file);
}

export function sitemapXml() {
  const urls = pages
    .map(({ loc, file }) => {
      const lastmod = lastmodFor(file);
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function generateSitemap(outFile) {
  const xml = sitemapXml();
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, xml);
  return xml;
}
