import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyzeTechSignals } from "../src/detector.js";
import {
  fetchCompanyIntelligence,
  fetchProspectsByIndustry,
  checkAccountCredits,
  exportLeadsCsv,
  getPricingInfo
} from "../src/mcp-client.js";

const root = process.cwd();

// 1. Validate manifest.json & PNG icon dimensions
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
assert.equal(manifest.manifest_version, 3, "Must be Manifest V3");
assert.ok(manifest.side_panel?.default_path, "side_panel.default_path required");
assert.ok(manifest.background?.service_worker, "background.service_worker required");

function readPngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  assert.equal(buf.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `Invalid PNG signature: ${filePath}`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

for (const [size, relPath] of Object.entries(manifest.icons)) {
  const full = path.join(root, relPath);
  assert.ok(fs.existsSync(full), `Missing icon: ${relPath}`);
  const dims = readPngSize(full);
  assert.equal(dims.width, Number(size), `Icon width mismatch for ${relPath}`);
  assert.equal(dims.height, Number(size), `Icon height mismatch for ${relPath}`);
}
console.log("PASS [1/4]: Manifest V3 & PNG icons (16x16, 48x48, 128x128) verified");

// 2. CSP & MV3 static checks
for (const file of ["src/background.js", "src/detector.js", "src/mcp-client.js", "src/sidepanel.js"]) {
  const code = fs.readFileSync(path.join(root, file), "utf8");
  assert.ok(!/\beval\s*\(/.test(code), `Forbidden eval() in ${file}`);
  assert.ok(!/\bnew\s+Function\s*\(/.test(code), `Forbidden new Function() in ${file}`);
}
const html = fs.readFileSync(path.join(root, "src/sidepanel.html"), "utf8");
assert.ok(!/<script[^>]*>[\s\S]+?<\/script>/i.test(html), "Inline <script> not allowed in MV3 HTML");
console.log("PASS [2/4]: MV3 CSP & security static checks passed");

// 3. Tech-stack detector unit tests
const saas = analyzeTechSignals({
  url: "https://www.example-saas.ai/pricing",
  title: "Example SaaS",
  htmlSample: '<div id="__next"></div>',
  scriptSrcs: [
    "https://example-saas.ai/_next/static/chunk.js",
    "https://js.stripe.com/v3/",
    "https://js.hs-scripts.com/123.js",
    "https://app.posthog.com/static/array.js",
    "https://widget.intercom.io/widget/abc"
  ],
  globalHints: ["__NEXT_DATA__", "Stripe", "posthog", "Intercom"],
  mailtoLinks: ["founders@example-saas.ai"],
  socialLinks: ["https://www.linkedin.com/company/example-saas"]
});
const saasNames = saas.technologies.map((t) => t.name);
for (const expected of ["Next.js", "Stripe", "HubSpot", "PostHog", "Intercom"]) {
  assert.ok(saasNames.includes(expected), `Expected ${expected} in ${saasNames}`);
}
assert.equal(saas.domain, "example-saas.ai");
assert.equal(saas.emailsOnPage[0], "founders@example-saas.ai");

const shop = analyzeTechSignals({
  url: "https://store.brand.com",
  scriptSrcs: [
    "https://cdn.shopify.com/s/files/theme.js",
    "https://www.googletagmanager.com/gtag/js?id=G-123",
    "https://connect.facebook.net/en_US/fbevents.js",
    "https://checkout.razorpay.com/v1/checkout.js"
  ],
  globalHints: ["Shopify", "gtag", "fbq", "Razorpay"]
});
const shopNames = shop.technologies.map((t) => t.name);
for (const expected of ["Shopify", "Google Analytics (GA4)", "Meta Pixel", "Razorpay"]) {
  assert.ok(shopNames.includes(expected), `Expected ${expected} in ${shopNames}`);
}
console.log("PASS [3/4]: Tech-stack detector unit tests passed (SaaS + E-Commerce)");

// 4. Live PulseLeads MCP backend integration checks
const credits = await checkAccountCredits("demo_free_key");
assert.equal(credits.status, "active");

const intel = await fetchCompanyIntelligence("demo_free_key", "anthropic");
assert.equal(intel.status, "success");
assert.ok(intel.matches.length >= 1 && intel.matches[0].mailProvider);

const prospects = await fetchProspectsByIndustry("demo_free_key", "AI", 80);
assert.equal(prospects.status, "success");
assert.ok(prospects.count >= 1);

const csv = await exportLeadsCsv("demo_free_key", "AI", 80);
assert.equal(csv.status, "success");
assert.ok(csv.csv.includes("company,domain,industry"));

const pricing = await getPricingInfo();
assert.equal(pricing.status, "ok");
assert.equal(pricing.plans.length, 4);

console.log("PASS [4/4]: Live PulseLeads MCP backend integration passed (5 endpoints)");
console.log("=== ALL STACKSCOUT TESTS PASSED ===");
