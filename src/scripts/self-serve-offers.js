/**
 * Per-product self-serve offers on the business site.
 *
 * status:
 *   - "hidden"       omit the product
 *   - "coming_soon"  show the product with a Coming soon label and no CTA
 *   - "preview"      the drinkedin.net page is up but ordering is not open:
 *                    a "Preview live, ordering opens soon" label and the page
 *                    link, never a pay CTA
 *   - "live"         show the drinkedin.net page link, and a pay CTA only when
 *                    paymentLink is a real https://buy.stripe.com/… URL
 *
 * Flip a product to "live" only after that feature is enabled on production
 * drinkedin.net. Live since 2026-11-24 (enabled via Emergency ops): list-scan
 * with its free sample, the licence lead feed, licence status lookup at
 * 0.05 USDC, the bars-near widget at /embed/bars-near, and sample market
 * reports at /data/sample-reports. Licence-alert signup stays
 * "coming_soon" (no page link) until the privacy hold on drinkedin #833
 * is released. Outlet density is also "live" since 2026-11-25: the order
 * page is https://drinkedin.net/data/outlet-density (Academic, Government
 * and Commercial tiers; Payment Links are on that page). Tier prices stay
 * on that page rather than being copied here. Never invent a Payment Link;
 * leave paymentLink empty (or a TODO comment in source) until a real
 * existing buy.stripe.com URL can be pasted.
 */

const BUY_LINK = /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9_-]+$/;

/** @typedef {"hidden" | "coming_soon" | "preview" | "live"} OfferStatus */

export const SELF_SERVE_OFFERS = {
  list_scan: {
    id: "list-scan",
    title: "Account-list scan",
    status: "live",
    page: "https://drinkedin.net/data/list-scan",
    // TODO: paste the existing buy.stripe.com list-match Payment Link when live.
    paymentLink: "",
    blurb:
      "Upload an account list and receive a matched extract from the registers DrinkedIn already publishes. A free preview of a few rows comes first; the full file is sold through a Payment Link once one is configured.",
  },
  outlet_density: {
    id: "outlet-density",
    title: "Outlet density extract",
    status: "live",
    page: "https://drinkedin.net/data/outlet-density",
    ctaLabel: "Order on drinkedin.net",
    // TODO: paste an existing Academic, Government, or Commercial buy.stripe.com Payment Link when live.
    paymentLink: "",
    blurb:
      "A one-off extract of on-premise outlets (bars, pubs and similar) taken from official licence registers. Each row has the outlet's coordinates, its licence source, and the date we last read that register, so you can say it was on the register as of that date. A methods note comes with the file. Nothing in the extract is an estimate, and no per-capita figure is supplied. Three tiers, one price each: Academic, Government and Commercial; prices are listed on the order page. After payment the extract is generated for your order from the existing extract script. It is not delivered automatically by the order page. Fulfilment stays manual.",
  },
  licence_status_lookup: {
    id: "licence-status-lookup",
    title: "Licence status lookup",
    status: "live",
    page: "https://drinkedin.net/data#licence-status-lookup",
    paymentLink: "",
    payVia: "x402",
    blurb:
      "A pay-per-call lookup of one licence number on one register, over x402 on Base, at 0.05 USDC per call. The answer says what the register lists and when, never that a venue is compliant.",
  },
  lead_feed: {
    id: "licence-lead-feed",
    title: "Weekly new-licence lead feed",
    status: "live",
    page: "",
    paymentLink: "",
    blurb:
      "A weekly CSV of newly seen licences on eligible registers. No checkout and no outreach.",
  },
  sample_market_reports: {
    id: "sample-reports",
    title: "Sample market reports",
    status: "live",
    page: "https://drinkedin.net/data/sample-reports",
    paymentLink: "",
    blurb:
      "Sample counts of on-premise outlets taken from redistributable official licence registers. Each sample says an outlet was on the register as of the date we last read that register. Westminster and the City of London are not included. This is not a full extract: names, addresses and licence numbers are withheld. Payment is not configured yet, so the full report stays locked.",
  },
  licence_alerts: {
    id: "licence-alerts",
    title: "Licence expiry and closure alerts",
    status: "coming_soon",
    page: "https://drinkedin.net/data/licence-alerts",
    paymentLink: "",
    blurb:
      "Sign up to hear when a redistributable official licence register records an expiry or a closure. Only registers with published reuse terms are included. Westminster and the City of London are not included. Digests are generated, but they are not sent yet.",
  },
  bars_near_widget: {
    id: "bars-near-widget",
    title: "Bars near here widget",
    status: "live",
    page: "https://drinkedin.net/embed/bars-near",
    paymentLink: "",
    blurb:
      "An embeddable list of nearby listed places, for a website or blog. The install snippet on the product page loads an iframe from drinkedin.net. The list and the DrinkedIn attribution backlink are rendered inside that iframe, not in your page. A small script at https://drinkedin.net/embed/bars-near.js can build the same iframe and pass data-lat and data-lng, or ask the browser for a location. The script only sets the iframe src to an https://drinkedin.net URL. Payment is not configured yet, so the no-branding tier stays locked.",
  },
};

export function isLivePaymentLink(url) {
  return typeof url === "string" && BUY_LINK.test(url);
}

export function visibleOffers(config = SELF_SERVE_OFFERS) {
  return Object.values(config).filter(
    (item) =>
      item &&
      (item.status === "coming_soon" || item.status === "preview" || item.status === "live")
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderItem(item) {
  const live = item.status === "live";
  const preview = item.status === "preview";
  const status = live
    ? ""
    : preview
      ? `<p class="offer-status">Preview live, ordering opens soon</p>`
      : `<p class="offer-status">Coming soon</p>`;
  const ctaLabel =
    typeof item.ctaLabel === "string" && item.ctaLabel.trim()
      ? item.ctaLabel.trim()
      : "Open on drinkedin.net";
  const pageLink =
    (live || preview) && item.page && item.page.startsWith("https://drinkedin.net/")
      ? `<p><a href="${escapeHtml(item.page)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ctaLabel)}</a></p>`
      : "";
  const payLink =
    live && isLivePaymentLink(item.paymentLink)
      ? `<p><a class="btn btn-solid btn-sm" href="${escapeHtml(item.paymentLink)}" target="_blank" rel="noopener noreferrer">Pay with Stripe</a></p>`
      : "";
  return `<article class="self-serve-item" id="${escapeHtml(item.id)}" data-status="${escapeHtml(item.status)}">
  <h4>${escapeHtml(item.title)}</h4>
  ${status}
  <p>${escapeHtml(item.blurb)}</p>
  ${pageLink}
  ${payLink}
</article>`;
}

export function renderSelfServeOffers(config = SELF_SERVE_OFFERS) {
  const items = visibleOffers(config);
  if (items.length === 0) return "";
  return items.map(renderItem).join("\n");
}

export function mountSelfServeOffers({
  mount,
  section,
  config = SELF_SERVE_OFFERS,
} = {}) {
  const root =
    mount ||
    (typeof document !== "undefined"
      ? document.getElementById("self-serve-offers")
      : null);
  const wrap =
    section ||
    (typeof document !== "undefined"
      ? document.getElementById("self-serve")
      : null);
  if (!root) return;
  const html = renderSelfServeOffers(config);
  root.innerHTML = html;
  if (wrap) {
    if (html) wrap.removeAttribute("hidden");
    else wrap.setAttribute("hidden", "");
  }
}
