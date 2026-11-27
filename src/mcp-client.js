export const MCP_ENDPOINT = "https://pulse-leads-mcp.onrender.com/mcp";
export const PORTAL_URL = "https://pulse-leads-mcp.onrender.com";

async function callMcpTool(toolName, args) {
  const response = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}`);
  }

  const rpc = await response.json();
  if (rpc.error) {
    throw new Error(rpc.error.message || "MCP RPC error");
  }

  const rawText = rpc?.result?.content?.[0]?.text || "{}";
  const parsed = JSON.parse(rawText);
  if (rpc?.result?.isError) {
    const err = new Error(parsed.message || parsed.error || "Tool error");
    err.code = parsed.httpCode || 400;
    err.payload = parsed;
    throw err;
  }
  return parsed;
}

export async function fetchCompanyIntelligence(apiKey, companyOrDomain) {
  return callMcpTool("get_company_intelligence", { apiKey, companyOrDomain });
}

export async function fetchProspectsByIndustry(apiKey, industry, minIntentScore = 80) {
  return callMcpTool("find_b2b_prospects", { apiKey, industry, minIntentScore });
}

export async function checkAccountCredits(apiKey) {
  return callMcpTool("check_account_credits", { apiKey });
}

export async function exportLeadsCsv(apiKey, industry, minIntentScore = 80) {
  return callMcpTool("export_leads_csv", { apiKey, industry, minIntentScore });
}

export async function getPricingInfo() {
  return callMcpTool("get_pricing_and_checkout", {});
}
