import { analyzeTechSignals, collectDomSignals } from "./detector.js";
import {
  PORTAL_URL,
  fetchCompanyIntelligence,
  fetchProspectsByIndustry,
  checkAccountCredits,
  exportLeadsCsv
} from "./mcp-client.js";

let currentDomain = "";

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getSavedApiKey() {
  const { apiKey } = await chrome.storage.local.get(["apiKey"]);
  return apiKey || "demo_free_key";
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      panels.forEach((p) => p.classList.toggle("active", p.id === `tab-${target}`));
    });
  }
}

async function scanActiveTab() {
  const domainEl = document.getElementById("site-domain");
  const titleEl = document.getElementById("site-title");
  const badgesEl = document.getElementById("tech-badges");
  const contactsEl = document.getElementById("page-contacts");

  domainEl.textContent = "Scanning active tab...";
  badgesEl.innerHTML = "";
  contactsEl.innerHTML = "";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith("http")) {
      domainEl.textContent = "Open an http/https webpage";
      titleEl.textContent = "Chrome internal pages cannot be scanned.";
      currentDomain = "";
      return;
    }

    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectDomSignals
    });

    const signals = injectionResults?.[0]?.result;
    if (!signals) {
      domainEl.textContent = "Unable to read page signals";
      return;
    }

    const analysis = analyzeTechSignals(signals);
    currentDomain = analysis.domain;
    domainEl.textContent = analysis.domain || analysis.url;
    titleEl.textContent = analysis.title || "No page title";

    if (analysis.technologies.length === 0) {
      badgesEl.innerHTML = `<span class="muted small">No common frameworks detected on this page.</span>`;
    } else {
      badgesEl.innerHTML = analysis.technologies
        .map(
          (t) =>
            `<span class="tech-badge"><span>${escapeHtml(t.name)}</span><span class="tech-cat">${escapeHtml(t.category)}</span></span>`
        )
        .join("");
    }

    const parts = [];
    if (analysis.emailsOnPage.length > 0) {
      parts.push(`<div><strong>Emails on page:</strong> ${analysis.emailsOnPage.map(escapeHtml).join(", ")}</div>`);
    }
    if (analysis.socialLinks.length > 0) {
      parts.push(`<div><strong>Social profiles found:</strong> ${analysis.socialLinks.length}</div>`);
    }
    contactsEl.innerHTML = parts.join("");
  } catch (err) {
    domainEl.textContent = "Scan error";
    titleEl.textContent = err.message;
  }
}

function renderLeadCards(container, leads) {
  if (!leads || leads.length === 0) {
    container.innerHTML = `<div class="muted small">No matching decision-makers found.</div>`;
    return;
  }
  container.innerHTML = leads
    .map((l) => {
      const emailDisplay = l.directEmail || l.verifiedEmailPattern || "N/A";
      const mxBadge = l.emailDeliverable
        ? `<span class="ok-text">✓ MX Verified (${escapeHtml(l.mailProvider || "Valid")})</span>`
        : `<span class="muted">MX: ${escapeHtml(l.mailProvider || "Unverified")}</span>`;
      const hookHtml = l.outreachHook
        ? `<div class="hook-box">${escapeHtml(l.outreachHook)}</div>`
        : "";
      return `
        <div class="lead-card">
          <div class="lead-title">${escapeHtml(l.company)} (${escapeHtml(l.domain)})</div>
          <div class="lead-meta"><strong>Role:</strong> ${escapeHtml(l.decisionMakerTitle)}${l.decisionMakerName ? ` (${escapeHtml(l.decisionMakerName)})` : ""}</div>
          <div class="lead-meta"><strong>Email:</strong> <code>${escapeHtml(emailDisplay)}</code> &bull; ${mxBadge}</div>
          <div class="lead-meta"><strong>Intent:</strong> ${escapeHtml(l.intentScore)}/100 &bull; ${escapeHtml(l.recentHiringTrigger)}</div>
          ${hookHtml}
        </div>
      `;
    })
    .join("");
}

async function handleEnrichCompany() {
  const statusEl = document.getElementById("enrich-status");
  const resultsEl = document.getElementById("enrich-results");

  if (!currentDomain) {
    statusEl.innerHTML = `<span class="error-text">Scan a website tab first.</span>`;
    return;
  }

  statusEl.textContent = `Looking up ${currentDomain}...`;
  resultsEl.innerHTML = "";

  try {
    const apiKey = await getSavedApiKey();
    const res = await fetchCompanyIntelligence(apiKey, currentDomain);
    statusEl.innerHTML = `<span class="ok-text">Found ${res.count} match(es) &bull; Credits left: ${res.remainingCredits}</span>`;
    renderLeadCards(resultsEl, res.matches);
  } catch (err) {
    statusEl.innerHTML = `<span class="error-text">${escapeHtml(err.message)}</span>`;
  }
}

async function handleProspectSearch() {
  const industry = document.getElementById("industry-input").value.trim();
  const statusEl = document.getElementById("prospects-status");
  const resultsEl = document.getElementById("prospects-results");

  statusEl.textContent = "Searching...";
  resultsEl.innerHTML = "";

  try {
    const apiKey = await getSavedApiKey();
    const res = await fetchProspectsByIndustry(apiKey, industry || undefined, 80);
    statusEl.innerHTML = `<span class="ok-text">${res.count} leads &bull; Credits left: ${res.remainingCredits}</span>`;
    renderLeadCards(resultsEl, res.leads);
  } catch (err) {
    statusEl.innerHTML = `<span class="error-text">${escapeHtml(err.message)}</span>`;
  }
}

async function handleExportCsv() {
  const industry = document.getElementById("industry-input").value.trim();
  const statusEl = document.getElementById("prospects-status");
  statusEl.textContent = "Exporting CSV...";

  try {
    const apiKey = await getSavedApiKey();
    const res = await exportLeadsCsv(apiKey, industry || undefined, 80);
    const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stackscout-leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    statusEl.innerHTML = `<span class="ok-text">Exported ${res.rowCount} rows &bull; Credits left: ${res.remainingCredits}</span>`;
  } catch (err) {
    statusEl.innerHTML = `<span class="error-text">${escapeHtml(err.message)}</span>`;
  }
}

async function refreshAccountStatus() {
  const inputEl = document.getElementById("api-key-input");
  const statusEl = document.getElementById("account-status");
  const apiKey = await getSavedApiKey();
  inputEl.value = apiKey;

  try {
    const info = await checkAccountCredits(apiKey);
    if (info.status === "active") {
      statusEl.innerHTML = `<span class="ok-text">Active Plan: <strong>${escapeHtml(info.plan)}</strong> &bull; Credits: <strong>${escapeHtml(info.creditsRemaining)}</strong></span>`;
    } else {
      statusEl.innerHTML = `<span class="error-text">${escapeHtml(info.message || "Key not found")}</span>`;
    }
  } catch (err) {
    statusEl.innerHTML = `<span class="error-text">${escapeHtml(err.message)}</span>`;
  }
}

async function init() {
  setupTabs();
  document.getElementById("link-trial").href = `${PORTAL_URL}/checkout?plan=trial`;
  document.getElementById("link-upgrade").href = `${PORTAL_URL}/checkout?plan=pro`;

  document.getElementById("btn-scan-top").addEventListener("click", scanActiveTab);
  document.getElementById("btn-enrich").addEventListener("click", handleEnrichCompany);
  document.getElementById("btn-search-prospects").addEventListener("click", handleProspectSearch);
  document.getElementById("btn-export-csv").addEventListener("click", handleExportCsv);
  document.getElementById("btn-save-key").addEventListener("click", async () => {
    const val = document.getElementById("api-key-input").value.trim() || "demo_free_key";
    await chrome.storage.local.set({ apiKey: val });
    await refreshAccountStatus();
  });

  await Promise.all([scanActiveTab(), refreshAccountStatus()]);
}

init();
