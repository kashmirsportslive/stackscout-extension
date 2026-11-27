# StackScout — Chrome Web Store Listing & Review Guide

## Store Listing Details
- **Extension Name:** StackScout — Tech Stack & Decision-Maker Finder
- **Category:** Productivity / Developer Tools
- **Language:** English
- **Privacy Policy URL:** https://pulse-leads-mcp.onrender.com/privacy
- **Support Email:** adammehfuz@gmail.com
- **Homepage URL:** https://pulse-leads-mcp.onrender.com

## Permission Justifications (For Chrome Web Store Reviewer)
- **`sidePanel`**: Displays the StackScout workspace alongside the active website so users can inspect detected technologies and contacts without losing context.
- **`tabs`**: Reads the active tab's URL and title to display the scanned domain and trigger tech-stack detection only when the user opens StackScout or clicks "Scan Tab".
- **`scripting`**: Injects a read-only DOM collector (`collectDomSignals`) into the active tab upon user action to inspect `<script src>`, `<link href>`, `<meta name="generator">`, and public `mailto:` links.
- **`storage`**: Persists the user's API key locally in `chrome.storage.local`.
- **`host_permissions` (`https://*/*`, `http://*/*`)**: Required so users can scan any public website's tech stack from the Side Panel on demand, and communicate with the `https://pulse-leads-mcp.onrender.com/mcp` backend.

## Data Privacy Disclosure
- StackScout does NOT sell user browsing history or run background tracking on tabs.
- Page signals are analyzed locally in the browser; only the target company domain/industry requested by the user is sent to `https://pulse-leads-mcp.onrender.com/mcp`.
