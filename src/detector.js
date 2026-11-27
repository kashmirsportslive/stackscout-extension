/**
 * Pure tech-stack analyzer that takes extracted page signals and returns
 * categorized technologies. Exported for both extension injection and unit tests.
 */
export function analyzeTechSignals(signals) {
  const {
    url = "",
    title = "",
    htmlSample = "",
    generatorMeta = "",
    scriptSrcs = [],
    linkHrefs = [],
    globalHints = [],
    mailtoLinks = [],
    socialLinks = []
  } = signals || {};

  const scriptsText = scriptSrcs.join(" ").toLowerCase();
  const linksText = linkHrefs.join(" ").toLowerCase();
  const htmlLower = htmlSample.toLowerCase();
  const genLower = generatorMeta.toLowerCase();
  const globals = new Set(globalHints);

  const detected = [];
  const add = (name, category, confidence = "High") => {
    if (!detected.some((d) => d.name === name)) {
      detected.push({ name, category, confidence });
    }
  };

  // Frontend Frameworks & Builders
  if (globals.has("__NEXT_DATA__") || scriptsText.includes("/_next/") || htmlLower.includes("__next")) {
    add("Next.js", "Frontend");
  }
  if (globals.has("__NUXT__") || scriptsText.includes("/_nuxt/")) {
    add("Nuxt.js", "Frontend");
  }
  if (globals.has("React") || htmlLower.includes("data-reactroot") || scriptsText.includes("react-dom")) {
    add("React", "Frontend");
  }
  if (globals.has("Vue") || htmlLower.includes("data-v-")) {
    add("Vue.js", "Frontend");
  }
  if (htmlLower.includes("ng-version") || scriptsText.includes("angular")) {
    add("Angular", "Frontend");
  }
  if (htmlLower.includes("svelte-") || scriptsText.includes("svelte")) {
    add("Svelte", "Frontend");
  }
  if (genLower.includes("astro") || htmlLower.includes("astro-island")) {
    add("Astro", "Frontend");
  }
  if (genLower.includes("webflow") || htmlLower.includes("data-wf-domain") || scriptsText.includes("webflow")) {
    add("Webflow", "CMS & Builder");
  }
  if (genLower.includes("framer") || scriptsText.includes("framerusercontent")) {
    add("Framer", "CMS & Builder");
  }
  if (genLower.includes("wordpress") || linksText.includes("/wp-content/") || scriptsText.includes("/wp-includes/")) {
    add("WordPress", "CMS & Builder");
  }
  if (htmlLower.includes("tailwind") || linksText.includes("tailwind")) {
    add("Tailwind CSS", "UI & Styling", "Medium");
  }

  // E-Commerce
  if (globals.has("Shopify") || scriptsText.includes("cdn.shopify.com") || htmlLower.includes("shopify-section")) {
    add("Shopify", "E-Commerce");
  }
  if (htmlLower.includes("woocommerce") || scriptsText.includes("woocommerce")) {
    add("WooCommerce", "E-Commerce");
  }
  if (genLower.includes("wix") || scriptsText.includes("wixstatic.com")) {
    add("Wix", "CMS & Builder");
  }
  if (genLower.includes("squarespace") || scriptsText.includes("squarespace.com")) {
    add("Squarespace", "CMS & Builder");
  }

  // Payments
  if (globals.has("Stripe") || scriptsText.includes("js.stripe.com")) {
    add("Stripe", "Payments");
  }
  if (scriptsText.includes("paypal.com/sdk") || scriptsText.includes("paypalobjects")) {
    add("PayPal", "Payments");
  }
  if (scriptsText.includes("checkout.razorpay.com") || globals.has("Razorpay")) {
    add("Razorpay", "Payments");
  }
  if (scriptsText.includes("cdn.paddle.com") || globals.has("Paddle")) {
    add("Paddle", "Payments");
  }

  // Analytics & Product Telemetry
  if (scriptsText.includes("googletagmanager.com/gtag/js") || globals.has("gtag")) {
    add("Google Analytics (GA4)", "Analytics");
  }
  if (scriptsText.includes("googletagmanager.com/gtm.js") || globals.has("google_tag_manager")) {
    add("Google Tag Manager", "Analytics");
  }
  if (scriptsText.includes("connect.facebook.net") || globals.has("fbq")) {
    add("Meta Pixel", "Analytics");
  }
  if (scriptsText.includes("posthog") || globals.has("posthog")) {
    add("PostHog", "Analytics");
  }
  if (scriptsText.includes("cdn.mxpnl.com") || globals.has("mixpanel")) {
    add("Mixpanel", "Analytics");
  }
  if (scriptsText.includes("cdn.segment.com") || globals.has("analytics")) {
    add("Segment", "Analytics");
  }
  if (scriptsText.includes("hotjar.com") || globals.has("hj")) {
    add("Hotjar", "Analytics");
  }
  if (scriptsText.includes("plausible.io")) {
    add("Plausible Analytics", "Analytics");
  }
  if (scriptsText.includes("sentry.io") || scriptsText.includes("browser.sentry-cdn.com") || globals.has("__SENTRY__")) {
    add("Sentry", "Monitoring");
  }

  // CRM, Marketing & Support
  if (scriptsText.includes("js.hs-scripts.com") || scriptsText.includes("hubspot")) {
    add("HubSpot", "CRM & Marketing");
  }
  if (scriptsText.includes("widget.intercom.io") || globals.has("Intercom")) {
    add("Intercom", "Support & Chat");
  }
  if (scriptsText.includes("static.zdassets.com") || globals.has("zE")) {
    add("Zendesk", "Support & Chat");
  }
  if (scriptsText.includes("client.crisp.chat") || globals.has("$crisp")) {
    add("Crisp Chat", "Support & Chat");
  }
  if (scriptsText.includes("js.driftt.com") || globals.has("drift")) {
    add("Drift", "Support & Chat");
  }
  if (scriptsText.includes("calendly.com")) {
    add("Calendly", "Sales & Scheduling");
  }

  // Hosting & CDN hints
  if (scriptsText.includes("challenges.cloudflare.com") || scriptsText.includes("cloudflareinsights.com")) {
    add("Cloudflare", "CDN & Security");
  }
  if (scriptsText.includes("vercel-insights") || scriptsText.includes("/_vercel/")) {
    add("Vercel", "Hosting & Cloud");
  }

  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    domain = "";
  }

  return {
    domain,
    url,
    title,
    technologies: detected,
    emailsOnPage: Array.from(new Set(mailtoLinks)).slice(0, 10),
    socialLinks: Array.from(new Set(socialLinks)).slice(0, 8)
  };
}

/**
 * Self-contained DOM collector injected into active tab via chrome.scripting.executeScript.
 * Must NOT reference external imports because chrome.scripting serializes the function.
 */
export function collectDomSignals() {
  const scriptSrcs = Array.from(document.querySelectorAll("script[src]"))
    .map((s) => s.getAttribute("src") || "")
    .filter(Boolean)
    .slice(0, 80);

  const linkHrefs = Array.from(document.querySelectorAll("link[href]"))
    .map((l) => l.getAttribute("href") || "")
    .filter(Boolean)
    .slice(0, 60);

  const genEl = document.querySelector('meta[name="generator"]');
  const generatorMeta = genEl ? genEl.getAttribute("content") || "" : "";

  const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'))
    .map((a) => (a.getAttribute("href") || "").replace(/^mailto:/i, "").split("?")[0].trim())
    .filter((e) => e.includes("@"));

  const socialLinks = Array.from(document.querySelectorAll('a[href*="linkedin.com/"], a[href*="twitter.com/"], a[href*="x.com/"]'))
    .map((a) => a.getAttribute("href") || "")
    .filter(Boolean);

  const globalHints = [];
  const checkGlobals = [
    "__NEXT_DATA__", "__NUXT__", "React", "Vue", "Shopify", "Stripe",
    "Razorpay", "Paddle", "gtag", "google_tag_manager", "fbq",
    "posthog", "mixpanel", "analytics", "hj", "__SENTRY__",
    "Intercom", "zE", "$crisp", "drift"
  ];
  for (const key of checkGlobals) {
    try {
      if (key in window && window[key] !== undefined) {
        globalHints.push(key);
      }
    } catch {}
  }

  const htmlSample = document.documentElement ? document.documentElement.outerHTML.slice(0, 25000) : "";

  return {
    url: window.location.href,
    title: document.title || "",
    htmlSample,
    generatorMeta,
    scriptSrcs,
    linkHrefs,
    globalHints,
    mailtoLinks,
    socialLinks
  };
}
