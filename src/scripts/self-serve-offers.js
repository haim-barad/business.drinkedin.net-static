/**
 * Per-product self-serve offers on the business site.
 *
 * status:
 *   - "hidden"       omit the product
 *   - "coming_soon"  show the product with a Coming soon label and no CTA
 *   - "live"         show the drinkedin.net page link, and a pay CTA only when
 *                    paymentLink is a real https://buy.stripe.com/… URL
 *
 * Flip a product to "live" only after that feature is enabled on production
 * drinkedin.net. Live since 2026-11-24 (enabled via Emergency ops): list-scan
 * with its free sample, the licence lead feed, and licence status lookup at
 * 0.05 USDC. Outlet density is live since 2026-11-24 (its public page returns 200);
 * its tier prices are not shown here because no tier has a Payment Link yet. Never invent a Payment Link;
 * leave paymentLink empty (or a TODO comment in source) until a real existing
 * buy.stripe.com URL can be pasted.
 */

const BUY_LINK = /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9_-]+$/;

/** @typedef {"hidden" | "coming_soon" | "live"} OfferStatus */

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
    // TODO: paste an existing Academic, Government, or Commercial buy.stripe.com Payment Link when live.
    paymentLink: "",
    blurb:
      "An extract of outlet density for a chosen area. Fulfilment stays manual. Payment Links, when configured, are the ones already referenced on drinkedin.net.",
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
};

export function isLivePaymentLink(url) {
  return typeof url === "string" && BUY_LINK.test(url);
}

export function visibleOffers(config = SELF_SERVE_OFFERS) {
  return Object.values(config).filter(
    (item) => item && (item.status === "coming_soon" || item.status === "live")
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
  const coming = item.status !== "live";
  const status = coming
    ? `<p class="offer-status">Coming soon</p>`
    : "";
  const pageLink =
    !coming && item.page && item.page.startsWith("https://drinkedin.net/")
      ? `<p><a href="${escapeHtml(item.page)}" target="_blank" rel="noopener noreferrer">Open on drinkedin.net</a></p>`
      : "";
  const payLink =
    !coming && isLivePaymentLink(item.paymentLink)
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
