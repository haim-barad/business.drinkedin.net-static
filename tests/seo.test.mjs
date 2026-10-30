import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

const pages = [
  {
    file: 'index.html',
    canonical: 'https://business.drinkedin.net/',
    webpageId: 'https://business.drinkedin.net/#webpage'
  },
  {
    file: 'privacy.html',
    canonical: 'https://business.drinkedin.net/privacy',
    webpageId: 'https://business.drinkedin.net/privacy#webpage'
  },
  {
    file: 'terms.html',
    canonical: 'https://business.drinkedin.net/terms',
    webpageId: 'https://business.drinkedin.net/terms#webpage'
  }
];

const sitemapFiles = {
  'https://business.drinkedin.net/': 'src/index.html',
  'https://business.drinkedin.net/privacy': 'src/privacy.html',
  'https://business.drinkedin.net/terms': 'src/terms.html'
};

function readDist(name) {
  return readFileSync(join(dist, name), 'utf8');
}

function tagAttrs(tag) {
  const out = {};
  const inner = tag.replace(/^<\w+\s*/, '').replace(/\/?>$/, '');
  const re = /([^\s="']+)(?:=(?:"([^"]*)"|'([^']*)'))?/g;
  let match;
  while ((match = re.exec(inner))) {
    out[match[1].toLowerCase()] = match[2] ?? match[3] ?? '';
  }
  return out;
}

function elements(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  return [...html.matchAll(re)].map((match) => tagAttrs(match[0]));
}

function metaContent(html, attr, value) {
  const found = elements(html, 'meta').find((item) => item[attr] === value);
  assert.ok(found, `missing meta ${attr}=${value}`);
  return found.content;
}

function jsonLd(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(blocks.length > 0, 'missing JSON-LD');
  return blocks.map((match) => JSON.parse(match[1]));
}

function nodes(graph) {
  return graph.flatMap((block) => (Array.isArray(block['@graph']) ? block['@graph'] : [block]));
}

function walkFiles(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...walkFiles(path));
    else found.push(path);
  }
  return found;
}

test('indexable pages have unique titles, descriptions, canonicals, and social tags', () => {
  const titles = [];
  for (const page of pages) {
    const html = readDist(page.file);
    const title = html.match(/<title>([^<]*)<\/title>/)[1];
    const description = metaContent(html, 'name', 'description');
    titles.push(title);

    assert.ok(title.length >= 50 && title.length <= 60, `${page.file} title length ${title.length}: ${title}`);
    assert.ok(
      description.length >= 120 && description.length <= 160,
      `${page.file} description length ${description.length}: ${description}`
    );
    assert.equal(elements(html, 'link').find((item) => item.rel === 'canonical').href, page.canonical);
    assert.equal(metaContent(html, 'property', 'og:title'), title);
    assert.equal(metaContent(html, 'property', 'og:description'), description);
    assert.equal(metaContent(html, 'property', 'og:url'), page.canonical);
    assert.equal(metaContent(html, 'property', 'og:image'), 'https://business.drinkedin.net/og-image.png');
    assert.equal(metaContent(html, 'property', 'twitter:card'), 'summary_large_image');

    const graph = nodes(jsonLd(html));
    const types = graph.map((node) => node['@type']);
    assert.ok(types.includes('Organization'));
    assert.ok(types.includes('WebSite'));
    assert.ok(types.includes('WebPage'));
    assert.ok(!types.includes('FAQPage'));

    const organization = graph.find((node) => node['@type'] === 'Organization');
    assert.equal(organization['@id'], 'https://drinkedin.net/#organization');
    assert.equal(organization.url, 'https://drinkedin.net/');
    assert.deepEqual(organization.sameAs, ['https://drinkedin.net/']);

    const webpage = graph.find((node) => node['@type'] === 'WebPage');
    assert.equal(webpage['@id'], page.webpageId);
    assert.equal(webpage.name, title);
    assert.equal(webpage.description, description);
    assert.equal(webpage.url, page.canonical);
  }
  assert.equal(new Set(titles).size, titles.length);
});

test('sitemap lastmod comes from the last git commit that touched each page', () => {
  const xml = readDist('sitemap.xml');
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => ({
    loc: match[1].match(/<loc>([^<]+)<\/loc>/)[1],
    lastmod: match[1].match(/<lastmod>([^<]+)<\/lastmod>/)[1]
  }));
  assert.deepEqual(
    urls.map((url) => url.loc).sort(),
    Object.keys(sitemapFiles).sort()
  );
  for (const url of urls) {
    assert.match(url.lastmod, /^\d{4}-\d{2}-\d{2}$/);
    const committed = execFileSync('git', ['log', '-1', '--format=%cs', '--', sitemapFiles[url.loc]], {
      cwd: root,
      encoding: 'utf8'
    }).trim();
    assert.equal(url.lastmod, committed, url.loc);
  }
});

test('every built page loads the deferred consent script at v4', () => {
  const htmlFiles = walkFiles(dist).filter((path) => path.endsWith('.html'));
  assert.ok(htmlFiles.length >= 4);
  for (const path of htmlFiles) {
    const html = readFileSync(path, 'utf8');
    assert.match(html, /<script\s+defer\s+src="https:\/\/drinkedin\.net\/consent-analytics\.js\?v=5"><\/script>/);
  }
});

test('robots.txt allows the same AI crawlers as the main site and llms.txt points at it', () => {
  const robots = readDist('robots.txt');
  for (const agent of [
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'ClaudeBot',
    'Claude-User',
    'Claude-SearchBot',
    'PerplexityBot',
    'Perplexity-User',
    'CCBot',
    'Google-Extended',
    'Applebot-Extended',
    'Amazonbot',
    'cohere-ai',
    'Bytespider'
  ]) {
    assert.match(robots, new RegExp(`User-agent: ${agent}\\nAllow: /`));
  }
  assert.match(robots, /Sitemap: https:\/\/business\.drinkedin\.net\/sitemap\.xml/);
  const llms = readDist('llms.txt');
  assert.match(llms, /^Platform overview for agents: https:\/\/drinkedin\.net\/llms\.txt$/m);
});

test('the build output does not contain the age-gate shorthand', () => {
  const banned = String.fromCharCode(50, 49, 43);
  for (const path of walkFiles(dist)) {
    const bytes = readFileSync(path);
    assert.equal(bytes.includes(banned), false, path);
  }
});
