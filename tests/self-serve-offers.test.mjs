import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  SELF_SERVE_OFFERS,
  isLivePaymentLink,
  mountSelfServeOffers,
  renderSelfServeOffers,
  visibleOffers,
} from '../src/scripts/self-serve-offers.js';

const root = fileURLToPath(new URL('..', import.meta.url));

test('default config is coming soon or hidden, with no live Payment Links or prices', () => {
  const items = Object.values(SELF_SERVE_OFFERS);
  assert.ok(items.length >= 4);
  for (const item of items) {
    assert.ok(
      item.status === 'coming_soon' || item.status === 'hidden',
      `${item.id} default status is ${item.status}`
    );
    assert.equal(isLivePaymentLink(item.paymentLink), false);
    assert.ok(!String(item.paymentLink).includes('buy.stripe.com'));
    assert.ok(!JSON.stringify(item).includes('0.05'));
  }
});

test('coming-soon render has a label and no live CTA', () => {
  const html = renderSelfServeOffers();
  assert.match(html, /Coming soon/);
  assert.match(html, /Account-list scan/);
  assert.match(html, /Outlet density extract/);
  assert.match(html, /Licence status lookup/);
  assert.match(html, /Weekly new-licence lead feed/);
  assert.doesNotMatch(html, /buy\.stripe\.com/);
  assert.doesNotMatch(html, /Pay with Stripe/);
  assert.doesNotMatch(html, /href="https:\/\/drinkedin\.net\/data/);
  assert.doesNotMatch(html, /0\.05/);
});

test('hidden products are omitted', () => {
  const html = renderSelfServeOffers({
    list_scan: { ...SELF_SERVE_OFFERS.list_scan, status: 'hidden' },
    outlet_density: { ...SELF_SERVE_OFFERS.outlet_density, status: 'hidden' },
    licence_status_lookup: {
      ...SELF_SERVE_OFFERS.licence_status_lookup,
      status: 'hidden',
    },
    lead_feed: { ...SELF_SERVE_OFFERS.lead_feed, status: 'hidden' },
  });
  assert.equal(html, '');
  assert.equal(visibleOffers({ list_scan: { status: 'hidden' } }).length, 0);
});

test('live products get a page link, and a pay CTA only for a real Payment Link', () => {
  const livePageOnly = renderSelfServeOffers({
    list_scan: { ...SELF_SERVE_OFFERS.list_scan, status: 'live' },
  });
  assert.match(livePageOnly, /Open on drinkedin\.net/);
  assert.match(livePageOnly, /https:\/\/drinkedin\.net\/data\/list-scan/);
  assert.doesNotMatch(livePageOnly, /Pay with Stripe/);
  assert.doesNotMatch(livePageOnly, /Coming soon/);

  const livePay = renderSelfServeOffers({
    list_scan: {
      ...SELF_SERVE_OFFERS.list_scan,
      status: 'live',
      paymentLink: 'https://buy.stripe.com/test_live_link_example',
    },
  });
  assert.match(livePay, /Pay with Stripe/);
  assert.match(livePay, /https:\/\/buy\.stripe\.com\/test_live_link_example/);

  const fakePay = renderSelfServeOffers({
    list_scan: {
      ...SELF_SERVE_OFFERS.list_scan,
      status: 'live',
      paymentLink: 'https://evil.example/pay',
    },
  });
  assert.doesNotMatch(fakePay, /Pay with Stripe/);
  assert.doesNotMatch(fakePay, /evil\.example/);

  const todoPay = renderSelfServeOffers({
    list_scan: {
      ...SELF_SERVE_OFFERS.list_scan,
      status: 'live',
      paymentLink: 'TODO',
    },
  });
  assert.doesNotMatch(todoPay, /Pay with Stripe/);
});

test('mount fills the list and unhides the section only when something is visible', () => {
  const mount = { innerHTML: 'stale' };
  const wrap = {
    hiddenAttr: 'hidden',
    setAttribute(name) {
      if (name === 'hidden') this.hiddenAttr = 'hidden';
    },
    removeAttribute(name) {
      if (name === 'hidden') this.hiddenAttr = '';
    },
  };
  mountSelfServeOffers({ mount, section: wrap });
  assert.match(mount.innerHTML, /Coming soon/);
  assert.equal(wrap.hiddenAttr, '');
  mountSelfServeOffers({
    mount,
    section: wrap,
    config: { list_scan: { ...SELF_SERVE_OFFERS.list_scan, status: 'hidden' } },
  });
  assert.equal(mount.innerHTML, '');
  assert.equal(wrap.hiddenAttr, 'hidden');
});

test('built index, when present, has no live self-serve Payment Link', () => {
  const index = join(root, 'dist', 'index.html');
  if (!existsSync(index)) {
    // Unit tests above do not require a Vite build. The package test script
    // builds first, so this assertion runs in `npm test`.
    return;
  }
  const html = readFileSync(index, 'utf8');
  assert.match(html, /id="self-serve"/);
  const start = html.indexOf('id="self-serve"');
  const end = html.indexOf('class="price-asof"', start);
  const section = html.slice(start, end === -1 ? undefined : end);
  assert.doesNotMatch(section, /buy\.stripe\.com/);
  assert.doesNotMatch(section, /Pay with Stripe/);
});
