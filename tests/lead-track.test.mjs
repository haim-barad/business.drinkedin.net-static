import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
    bindFallback,
    boot,
    handleTrackEvent,
    injectConsentScript,
    installGenerateLead,
    isPreviewHost,
    leadTypeOf,
    paramsFrom
} from '../src/scripts/lead-track.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(root, 'src');
const CONSENT_SRC = 'https://drinkedin.net/consent-analytics.js?v=8';

function read(name) {
    return readFileSync(join(srcDir, name), 'utf8');
}

function walk(dir) {
    const found = [];
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) found.push(...walk(path));
        else found.push(path);
    }
    return found;
}

function element(html, tag, pred) {
    const re = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    return [...html.matchAll(re)].map((match) => match[0]).filter(pred);
}

function attr(tag, name) {
    const match = tag.match(new RegExp(`${name}="([^"]*)"`));
    return match ? match[1] : null;
}

test('preview hosts are only Cloudflare Pages domains', () => {
    assert.equal(isPreviewHost('pages.dev'), true);
    assert.equal(isPreviewHost('Foo.Pages.Dev'), true);
    assert.equal(isPreviewHost('abc.business-drinkedin-net-static.pages.dev'), true);
    assert.equal(isPreviewHost('business.drinkedin.net'), false);
    assert.equal(isPreviewHost('drinkedin.net'), false);
    assert.equal(isPreviewHost('localhost'), false);
    assert.equal(isPreviewHost('pages.dev.evil.com'), false);
    assert.equal(isPreviewHost('notpages.dev'), false);
    assert.equal(isPreviewHost(''), false);
});

test('lead_type is one of three fixed words', () => {
    assert.equal(leadTypeOf({ lead_type: 'cta' }), 'cta');
    assert.equal(leadTypeOf({ lead_type: 'form' }), 'form');
    assert.equal(leadTypeOf({ lead_type: 'mailto' }), 'mailto');
    for (const value of ['CTA', 'cta ', 'sales@drinkedin.net', 'mailto:sales@drinkedin.net', '', 'cta<script>', null]) {
        assert.equal(leadTypeOf({ lead_type: value }), null, String(value));
    }
    assert.equal(leadTypeOf(null), null);
    assert.equal(leadTypeOf({}), null);
});

test('params come only from data-track-* attributes', () => {
    const node = {
        attributes: [
            { name: 'href', value: 'mailto:sales@drinkedin.net' },
            { name: 'data-track', value: 'generate_lead' },
            { name: 'data-track-lead-type', value: 'mailto' },
            { name: 'data-track-email', value: 'sales@drinkedin.net' }
        ]
    };
    assert.deepEqual(paramsFrom(node), {
        lead_type: 'mailto',
        email: 'sales@drinkedin.net'
    });
});

function consentApi(overrides = {}) {
    const originalCalls = [];
    const api = {
        get: () => null,
        isAnalyticsLoaded: () => false,
        track(name, params) {
            originalCalls.push({ name, params });
            return true;
        },
        ...overrides
    };
    return { api, originalCalls };
}

function windowWith(hostname, api, gtag) {
    return {
        location: { hostname },
        drinkedinConsent: api,
        gtag
    };
}

test('generate_lead is sent only after Accept, with the coarse label alone', () => {
    const gtagCalls = [];
    const { api, originalCalls } = consentApi();
    const win = windowWith('business.drinkedin.net', api, (...args) => gtagCalls.push(args));
    assert.equal(installGenerateLead(win), true);
    assert.equal(installGenerateLead(win), false);

    assert.equal(api.track('generate_lead', { lead_type: 'cta', email: 'a@b.c' }), false);
    assert.equal(gtagCalls.length, 0);
    assert.equal(originalCalls.length, 0);

    api.get = () => 'declined';
    api.isAnalyticsLoaded = () => true;
    assert.equal(api.track('generate_lead', { lead_type: 'form' }), false);
    assert.equal(gtagCalls.length, 0);

    api.get = () => 'accepted';
    api.isAnalyticsLoaded = () => false;
    assert.equal(api.track('generate_lead', { lead_type: 'form' }), false);
    assert.equal(gtagCalls.length, 0);

    api.isAnalyticsLoaded = () => true;
    assert.equal(api.track('generate_lead', { lead_type: 'form', email: 'a@b.c', message: 'hi' }), true);
    assert.equal(gtagCalls.length, 1);
    assert.deepEqual(gtagCalls[0], [
        'event',
        'generate_lead',
        { lead_type: 'form', transport_type: 'beacon' }
    ]);
    assert.equal(originalCalls.length, 0);

    assert.equal(api.track('generate_lead', { lead_type: 'sales@drinkedin.net' }), false);
    assert.equal(gtagCalls.length, 1);

    assert.equal(api.track('select_venue', { page_type: 'docs' }), true);
    assert.deepEqual(originalCalls, [{ name: 'select_venue', params: { page_type: 'docs' } }]);
    assert.equal(gtagCalls.length, 1);
});

test('a preview host never forwards track(), even after Accept', () => {
    const gtagCalls = [];
    const { api, originalCalls } = consentApi({
        get: () => 'accepted',
        isAnalyticsLoaded: () => true
    });
    const win = windowWith('preview.pages.dev', api, (...args) => gtagCalls.push(args));
    installGenerateLead(win);
    assert.equal(api.track('generate_lead', { lead_type: 'cta' }), false);
    assert.equal(api.track('select_venue', { page_type: 'docs' }), false);
    assert.equal(gtagCalls.length, 0);
    assert.equal(originalCalls.length, 0);
});

function node(tag, attrs, parent) {
    const el = {
        nodeType: 1,
        tagName: tag,
        parentNode: parent || null,
        attributes: Object.entries(attrs).map(([name, value]) => ({ name, value })),
        getAttribute(name) {
            const found = this.attributes.find((item) => item.name === name);
            return found ? found.value : null;
        }
    };
    return el;
}

test('fallback listens for the anchor click and the form submit, not an invalid click', () => {
    const gtagCalls = [];
    const { api } = consentApi({
        get: () => 'accepted',
        isAnalyticsLoaded: () => true
    });
    const win = windowWith('business.drinkedin.net', api, (...args) => gtagCalls.push(args));
    installGenerateLead(win);
    const listeners = [];
    const doc = {
        __drinkedinTrackBound: false,
        addEventListener(type, fn, capture) {
            listeners.push({ type, fn, capture });
        }
    };
    assert.equal(bindFallback(win, doc), true);
    assert.equal(bindFallback(win, doc), false);
    assert.equal(listeners.length, 2);
    assert.ok(listeners.every((item) => item.capture === true));

    const link = node('A', {
        href: 'mailto:sales@drinkedin.net',
        'data-track': 'generate_lead',
        'data-track-lead-type': 'mailto'
    });
    const label = { nodeType: 3, parentNode: link };
    listeners.find((item) => item.type === 'click').fn({ target: label });

    const form = node('FORM', {
        'data-track': 'generate_lead',
        'data-track-lead-type': 'form'
    });
    const field = node('INPUT', { name: 'email', value: 'person@example.com' }, form);
    listeners.find((item) => item.type === 'click').fn({ target: field });
    listeners.find((item) => item.type === 'submit').fn({ target: form });

    assert.deepEqual(
        gtagCalls.map((call) => call[2].lead_type),
        ['mailto', 'form']
    );
    const flat = JSON.stringify(gtagCalls);
    assert.equal(flat.includes('sales@'), false);
    assert.equal(flat.includes('person@example.com'), false);
    assert.equal(flat.includes('mailto:'), false);
});

test('a bound loader listener is not duplicated', () => {
    const doc = {
        __drinkedinTrackBound: true,
        addEventListener() {
            throw new Error('fallback should not bind');
        }
    };
    assert.equal(bindFallback({}, doc), false);
});

test('handleTrackEvent ignores a click inside a tracked form', () => {
    const calls = [];
    const win = {
        drinkedinConsent: {
            track(name, params) {
                calls.push({ name, params });
            }
        }
    };
    const form = node('FORM', { 'data-track': 'generate_lead', 'data-track-lead-type': 'form' });
    const field = node('INPUT', {}, form);
    handleTrackEvent(win, { target: field }, false);
    handleTrackEvent(win, { target: form }, true);
    assert.deepEqual(calls, [{ name: 'generate_lead', params: { lead_type: 'form' } }]);
});

function fakeDocument() {
    const scripts = [];
    const doc = {
        __drinkedinTrackBound: true,
        documentElement: {
            attrs: {},
            setAttribute(name, value) {
                this.attrs[name] = value;
            },
            getAttribute(name) {
                return this.attrs[name] || null;
            }
        },
        head: {
            appendChild(el) {
                scripts.push(el);
            }
        },
        createElement() {
            return { defer: false, async: true, src: '' };
        },
        querySelector(sel) {
            const src = sel.match(/src="([^"]+)"/);
            if (!src) return null;
            return scripts.find((script) => script.src === src[1]) || null;
        },
        scripts
    };
    return doc;
}

test('boot does not load the consent script on a preview host', () => {
    const doc = fakeDocument();
    const win = {
        location: { hostname: 'hash.pages.dev' },
        document: doc,
        setInterval() {
            throw new Error('preview must not poll');
        }
    };
    boot(win, doc);
    boot(win, doc);
    assert.equal(doc.scripts.length, 0);
    assert.equal(doc.documentElement.getAttribute('data-analytics'), 'off');
    const late = {
        track() {
            return true;
        }
    };
    win.drinkedinConsent = late;
    assert.equal(late.track(), false);
    assert.equal(late.__generateLeadSilenced, true);

    const later = fakeDocument();
    const win2 = {
        location: { hostname: 'hash.pages.dev' },
        setInterval() {
            throw new Error('api is already there');
        },
        drinkedinConsent: {
            track() {
                return true;
            }
        }
    };
    boot(win2, later);
    assert.equal(later.scripts.length, 0);
    assert.equal(win2.drinkedinConsent.track(), false);
    assert.equal(win2.drinkedinConsent.__generateLeadSilenced, true);
});

test('track is gated in the same turn the loader appears', async () => {
    const doc = fakeDocument();
    doc.__drinkedinTrackBound = false;
    let bound = 0;
    doc.addEventListener = () => {
        bound += 1;
    };
    const gtagCalls = [];
    const win = {
        location: { hostname: 'business.drinkedin.net' },
        setInterval() {
            throw new Error('the setter is the gate');
        },
        gtag(...args) {
            gtagCalls.push(args);
        }
    };
    boot(win, doc);
    const { api, originalCalls } = consentApi({
        get: () => 'declined',
        isAnalyticsLoaded: () => true
    });
    win.drinkedinConsent = api;
    assert.equal(api.__generateLeadWrapped, true);
    assert.equal(api.track('generate_lead', { lead_type: 'mailto', href: 'mailto:sales@drinkedin.net' }), false);
    assert.equal(gtagCalls.length, 0);
    assert.equal(originalCalls.length, 0);
    assert.equal(bound, 0);
    doc.__drinkedinTrackBound = true;
    await Promise.resolve();
    assert.equal(bound, 0);

    const doc2 = fakeDocument();
    doc2.__drinkedinTrackBound = false;
    doc2.addEventListener = () => {
        bound += 1;
    };
    const win2 = {
        location: { hostname: 'business.drinkedin.net' },
        gtag() {},
        drinkedinConsent: undefined
    };
    boot(win2, doc2);
    win2.drinkedinConsent = consentApi({
        get: () => 'accepted',
        isAnalyticsLoaded: () => true
    }).api;
    await Promise.resolve();
    assert.equal(doc2.__drinkedinLeadFallback, true);
    assert.equal(bound, 2);
});

test('boot loads the shared consent script and wraps track on the production host', () => {
    const doc = fakeDocument();
    const win = {
        location: { hostname: 'business.drinkedin.net' },
        setInterval() {
            throw new Error('api is already there');
        },
        gtag() {},
        drinkedinConsent: consentApi({
            get: () => 'accepted',
            isAnalyticsLoaded: () => true
        }).api
    };
    boot(win, doc);
    assert.equal(doc.scripts.length, 1);
    assert.equal(doc.scripts[0].src, CONSENT_SRC);
    assert.equal(doc.scripts[0].async, false);
    assert.equal(injectConsentScript(doc), false);
    assert.equal(win.drinkedinConsent.__generateLeadWrapped, true);
});

test('markup wires generate_lead on the main CTAs, the contact form, and sales mailto links', () => {
    const pages = ['index.html', 'privacy.html', 'terms.html', '404.html'];
    const tracked = [];
    for (const name of pages) {
        const html = read(name);
        assert.match(html, /src="\.\/scripts\/lead-track\.js"/);
        assert.doesNotMatch(html, /<script[^>]*src="https:\/\/drinkedin\.net\/consent-analytics\.js/);
        const tags = element(html, 'a', (tag) => tag.includes('data-track=') || tag.includes('mailto:'));
        const forms = element(html, 'form', () => true);
        for (const tag of tags) {
            if (tag.includes('mailto:support@')) {
                assert.equal(attr(tag, 'data-track'), null, name);
                assert.equal(attr(tag, 'data-track-lead-type'), null, name);
            } else if (tag.includes('mailto:')) {
                assert.equal(attr(tag, 'data-track'), 'generate_lead', name);
                assert.equal(attr(tag, 'data-track-lead-type'), 'mailto', name);
            }
            if (tag.includes('data-track=')) tracked.push({ name, tag });
        }
        for (const tag of forms) {
            if (name === 'index.html') {
                assert.equal(attr(tag, 'data-track'), 'generate_lead');
                assert.equal(attr(tag, 'data-track-lead-type'), 'form');
            } else {
                assert.equal(attr(tag, 'data-track'), null, name);
            }
        }
        const ctas = element(html, 'a', (tag) => tag.includes('Start a conversation'));
        for (const tag of ctas) {
            assert.equal(attr(tag, 'data-track'), 'generate_lead', name);
            assert.equal(attr(tag, 'data-track-lead-type'), 'cta', name);
        }
    }
    const ofType = (type) => tracked.filter((item) => attr(item.tag, 'data-track-lead-type') === type);
    assert.equal(ofType('cta').length, 3);
    assert.equal(ofType('mailto').length, 2);
    assert.equal(tracked.length, 5);
    const index = read('index.html');
    const contactLinks = element(index, 'a', (tag) => tag.includes('href="#contact"'));
    const trackedContact = contactLinks.filter((tag) => tag.includes('data-track='));
    assert.equal(trackedContact.length, 3);
    assert.ok(trackedContact.every((tag) => attr(tag, 'data-track-lead-type') === 'cta'));
    assert.equal(contactLinks.length, 4);
    assert.equal(element(index, 'a', (tag) => tag.includes('href="#how"') && tag.includes('data-track')).length, 0);
});

test('privacy names the lead event and no longer claims this site sends none', () => {
    const html = read('privacy.html');
    assert.match(html, /generate_lead/);
    assert.match(html, /lead_type/);
    assert.match(html, /cta/);
    assert.match(html, /form/);
    assert.match(html, /mailto/);
    assert.match(html, /not\s+sent before\s+you accept or if you decline/);
    assert.match(html, /support@drinkedin\.net<\/code>\s+from this page does not/);
    assert.doesNotMatch(html, /in that order/);
    assert.doesNotMatch(html, /mailto:support@drinkedin\.net"[^>]*data-track/);
    assert.doesNotMatch(html, /no link on this site sends one today/);
    assert.match(html, /do\s+not combine analytics with/);
});

test('the lead script does not embed a measurement id or a gtag snippet', () => {
    const js = readFileSync(join(srcDir, 'scripts/lead-track.js'), 'utf8');
    assert.match(js, new RegExp(CONSENT_SRC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(js.includes('G-'), false);
    assert.equal(js.includes('googletagmanager'), false);
    assert.equal(js.includes('gtag/js'), false);
});
