# StackScout — Chrome Extension (Manifest V3)

Detect any website's live tech stack, verify email deliverability (MX records), and discover B2B decision-makers with non-expiring rollover credits.

## Features
- **Instant Tech-Stack Detection:** Identifies 35+ technologies (Next.js, React, Shopify, Stripe, Razorpay, HubSpot, PostHog, Intercom, GA4, and more) directly in Chrome Side Panel.
- **Decision-Maker Lookup:** One-click enrichment via `PulseLeads MCP` (`https://pulse-leads-mcp.onrender.com/mcp`) with MX deliverability status and personalized outreach hooks.
- **CSV Export:** Export B2B leads in CRM-ready CSV format.
- **Rollover Credits:** Start free with 20 trial credits (`$9` Starter / `$19` Pro / `$29` Growth — paid credits never expire).

## Local Installation (Developer Mode)
1. Open `chrome://extensions` in Google Chrome.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select `d:\Caddle\P3-stackscout-extension`.
4. Click the **StackScout** icon in the toolbar to open the Side Panel.

## Automated Tests & Packaging
```bash
npm test
npm run package
```
