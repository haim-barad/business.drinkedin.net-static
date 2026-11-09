// generate_lead for the business site, through the shared DrinkedIn loader.
//
// consent-analytics.js (v=8, from drinkedin.net) already listens for
// data-track and data-track-* and sends the event through track(). Two gaps:
//
//   * TRACK_PARAMS does not include lead_type, so a coarse label is dropped.
//   * track() sends whenever gtag is loaded. In advanced consent mode that is
//     before the visitor accepts, as a cookieless ping.
//
// This file loads that script (so there is still one consent switch and no
// gtag snippet here) except on Cloudflare Pages previews, then wraps track()
// so generate_lead is sent only after Accept and only with lead_type
// cta, form, or mailto. Nothing from the form, the link, or the address is
// copied onto the event. The wrap is installed from a setter on
// window.drinkedinConsent, in the same turn the loader assigns it, so a
// click cannot land on the unwrapped track(). If that loader has no
// data-track listener, the same wrap is driven by a fallback listener.

const CONSENT_SRC = 'https://drinkedin.net/consent-analytics.js?v=8';
const LEAD_TYPES = new Set(['cta', 'form', 'mailto']);
const WATCH_TRIES = 40;
const WATCH_MS = 100;

export function isPreviewHost(hostname) {
    const host = String(hostname || '').toLowerCase();
    return host === 'pages.dev' || host.endsWith('.pages.dev');
}

export function leadTypeOf(params) {
    const value = params && params.lead_type;
    return typeof value === 'string' && LEAD_TYPES.has(value) ? value : null;
}

export function paramsFrom(node) {
    const params = {};
    const attrs = (node && node.attributes) || [];
    for (let i = 0; i < attrs.length; i++) {
        const name = attrs[i].name;
        if (name.indexOf('data-track-') === 0) {
            params[name.slice('data-track-'.length).replace(/-/g, '_')] = attrs[i].value;
        }
    }
    return params;
}

function trackedElement(node) {
    if (node && node.nodeType === 3) node = node.parentNode;
    while (node && node.nodeType === 1) {
        if (node.getAttribute && node.getAttribute('data-track')) return node;
        node = node.parentNode;
    }
    return null;
}

// Mirrors the loader: a form's data-track fires on submit, not on clicks
// inside the form (a click would count an invalid submit).
export function handleTrackEvent(win, event, isSubmit) {
    try {
        const api = win.drinkedinConsent;
        if (!api || typeof api.track !== 'function') return;
        const node = isSubmit ? event.target : trackedElement(event.target);
        if (!node || !node.getAttribute || !node.getAttribute('data-track')) return;
        const isForm = String(node.tagName || '').toUpperCase() === 'FORM';
        if (isForm !== isSubmit) return;
        api.track(node.getAttribute('data-track'), paramsFrom(node));
    } catch (err) {
        /* analytics must never break a click or a submit */
    }
}

export function bindFallback(win, doc) {
    if (!doc || doc.__drinkedinTrackBound || doc.__drinkedinLeadFallback) return false;
    if (typeof doc.addEventListener !== 'function') return false;
    doc.__drinkedinLeadFallback = true;
    doc.addEventListener('click', (event) => handleTrackEvent(win, event, false), true);
    doc.addEventListener('submit', (event) => handleTrackEvent(win, event, true), true);
    return true;
}

export function installGenerateLead(win) {
    const api = win && win.drinkedinConsent;
    if (!api || typeof api.track !== 'function' || api.__generateLeadWrapped) return false;
    const original = api.track;
    api.track = function track(name, params) {
        try {
            if (isPreviewHost(win.location && win.location.hostname)) return false;
            if (name !== 'generate_lead') return original.apply(this, arguments);
            const lead = leadTypeOf(params);
            // Drop it rather than calling through: the loader would send
            // generate_lead with the label stripped, including before Accept.
            if (!lead) return false;
            if (typeof api.get !== 'function' || api.get() !== 'accepted') return false;
            if (typeof api.isAnalyticsLoaded !== 'function' || !api.isAnalyticsLoaded()) return false;
            if (typeof win.gtag !== 'function') return false;
            win.gtag('event', 'generate_lead', {
                lead_type: lead,
                transport_type: 'beacon'
            });
            return true;
        } catch (err) {
            return false;
        }
    };
    api.__generateLeadWrapped = true;
    return true;
}

function silence(win) {
    const api = win.drinkedinConsent;
    if (!api || typeof api.track !== 'function' || api.__generateLeadSilenced) return false;
    api.track = function silenced() {
        return false;
    };
    api.__generateLeadSilenced = true;
    return true;
}

export function injectConsentScript(doc, onload) {
    if (!doc || typeof doc.createElement !== 'function' || !doc.head) return false;
    if (typeof doc.querySelector === 'function' && doc.querySelector(`script[src="${CONSENT_SRC}"]`)) {
        return false;
    }
    const script = doc.createElement('script');
    script.defer = true;
    script.async = false;
    script.src = CONSENT_SRC;
    if (typeof onload === 'function') script.onload = onload;
    doc.head.appendChild(script);
    return true;
}

// Only used when the consent object cannot be trapped. A poll that stops
// is not the gate: the property setter wraps track() in the assignment turn.
function watch(win, ready) {
    if (ready()) return;
    const setIntervalFn = win.setInterval || setInterval;
    const clearIntervalFn = win.clearInterval || clearInterval;
    let tries = 0;
    const timer = setIntervalFn(() => {
        tries += 1;
        if (ready() || tries >= WATCH_TRIES) clearIntervalFn(timer);
    }, WATCH_MS);
}

function afterTurn(fn) {
    if (typeof queueMicrotask === 'function') queueMicrotask(fn);
    else setTimeout(fn, 0);
}

// The loader assigns window.drinkedinConsent and only later binds its click
// listener, which reads .track at click time. Wrapping inside the setter
// means the first click already sees the gate, including a click in the
// same turn the script finishes. A poll cannot offer that.
function trapConsent(win, onReady) {
    if (win.drinkedinConsent) {
        onReady();
        return;
    }
    let current;
    const apply = (value) => {
        current = value;
        try {
            onReady();
        } catch (err) {
            /* analytics must never break the loader */
        }
    };
    try {
        Object.defineProperty(win, 'drinkedinConsent', {
            configurable: true,
            enumerable: true,
            get() {
                return current;
            },
            set: apply
        });
    } catch (err) {
        watch(win, () => {
            if (!win.drinkedinConsent) return false;
            onReady();
            return true;
        });
    }
}

function arm(win, doc) {
    installGenerateLead(win);
    // The loader sets __drinkedinTrackBound after the assignment, in the
    // same turn. Binding in that turn would double-send. Binding on the
    // next turn does not, and still covers a loader with no data-track hook.
    afterTurn(() => {
        if (!doc.__drinkedinTrackBound) bindFallback(win, doc);
    });
}

export function boot(win, doc) {
    if (!win || !doc || win.__drinkedinLeadBooted) return;
    win.__drinkedinLeadBooted = true;
    if (isPreviewHost(win.location && win.location.hostname)) {
        if (doc.documentElement && typeof doc.documentElement.setAttribute === 'function') {
            doc.documentElement.setAttribute('data-analytics', 'off');
        }
        trapConsent(win, () => silence(win));
        return;
    }
    trapConsent(win, () => arm(win, doc));
    injectConsentScript(doc, () => {
        if (win.drinkedinConsent) arm(win, doc);
    });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    boot(window, document);
}
