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

test('default config: only products enabled on production are live, with no Payment Links', () => {
  const items = Object.values(SELF_SERVE_OFFERS);
  assert.ok(items.length >= 4);
  const status = Object.fromEntries(
    Object.entries(SELF_SERVE_OFFERS).map(([key, item]) => [key, item.status])
  );
  assert.deepEqual(status, {
    list_scan: 'live',
    outlet_density: 'preview',
    licence_status_lookup: 'live',
    lead_feed: 'live',
    sample_market_reports: 'live',
    licence_alerts: 'live',
    bars_near_widget: 'live',
  });
  for (const item of items) {
    assert.equal(isLivePaymentLink(item.paymentLink), false);
    assert.ok(!String(item.paymentLink).includes('buy.stripe.com'));
  }
  // The only price on the page is the production lookup price.
  assert.match(SELF_SERVE_OFFERS.licence_status_lookup.blurb, /0\.05 USDC per call/);
  for (const [key, item] of Object.entries(SELF_SERVE_OFFERS)) {
    if (key !== 'licence_status_lookup') {
      assert.ok(!JSON.stringify(item).includes('0.05'), `${key} lists a price`);
    }
  }
});

test('default render: products link to drinkedin.net; outlet density is a preview, not orderable', () => {
  const html = renderSelfServeOffers();
  assert.match(html, /Account-list scan/);
  assert.match(html, /Outlet density extract/);
  assert.match(html, /Licence status lookup/);
  assert.match(html, /Weekly new-licence lead feed/);
  assert.match(html, /Sample market reports/);
  assert.match(html, /Licence expiry and closure alerts/);
  assert.match(html, /Bars near here widget/);
  assert.match(html, /href="https:\/\/drinkedin\.net\/data\/list-scan"/);
  assert.match(html, /href="https:\/\/drinkedin\.net\/data\/outlet-density"/);
  assert.match(html, /href="https:\/\/drinkedin\.net\/data\/sample-reports"/);
  assert.match(html, /href="https:\/\/drinkedin\.net\/data\/licence-alerts"/);
  assert.match(html, /href="https:\/\/drinkedin\.net\/embed\/bars-near"/);
  assert.match(html, /href="https:\/\/drinkedin\.net\/data#licence-status-lookup"/);
  assert.match(html, /Digests are generated, but they are not sent yet\./);
  assert.match(html, /the full report stays locked/);
  assert.match(html, /the no-branding tier stays locked/);
  assert.doesNotMatch(html, /21\+/);
  assert.doesNotMatch(html, /Coming soon/);
  assert.equal((html.match(/Preview live, ordering opens soon/g) || []).length, 1);
  assert.match(html, /Fulfilment stays manual\./);
  assert.doesNotMatch(html, /when configured, are the ones already referenced/);
  assert.match(
    html,
    /id="outlet-density" data-status="preview">\s*<h4>Outlet density extract<\/h4>\s*<p class="offer-status">Preview live, ordering opens soon<\/p>/
  );
  assert.doesNotMatch(html, /buy\.stripe\.com/);
  assert.doesNotMatch(html, /Pay with Stripe/);
});

test('a preview product never gets a pay CTA, even with a real Payment Link', () => {
  const html = renderSelfServeOffers({
    outlet_density: {
      ...SELF_SERVE_OFFERS.outlet_density,
      paymentLink: 'https://buy.stripe.com/test_abc123',
    },
  });
  assert.match(html, /Preview live, ordering opens soon/);
  assert.match(html, /href="https:\/\/drinkedin\.net\/data\/outlet-density"/);
  assert.doesNotMatch(html, /Pay with Stripe/);
  assert.doesNotMatch(html, /buy\.stripe\.com/);
});

test('a coming_soon product shows the label and no link', () => {
  const html = renderSelfServeOffers({
    outlet_density: { ...SELF_SERVE_OFFERS.outlet_density, status: 'coming_soon' },
  });
  assert.match(
    html,
    /id="outlet-density" data-status="coming_soon">\s*<h4>Outlet density extract<\/h4>\s*<p class="offer-status">Coming soon<\/p>/
  );
  assert.doesNotMatch(html, /drinkedin\.net\/data\/outlet-density/);
});

test('hidden products are omitted', () => {
  const hidden = Object.fromEntries(
    Object.entries(SELF_SERVE_OFFERS).map(([key, item]) => [
      key,
      { ...item, status: 'hidden' },
    ])
  );
  const html = renderSelfServeOffers(hidden);
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
  assert.match(mount.innerHTML, /Outlet density extract/);
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
