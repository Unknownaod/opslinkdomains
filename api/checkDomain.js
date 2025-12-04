// ✅ Universal Domain Availability Check using Domainr API
// Supports ALL TLDs (com, net, io, gg, xyz, etc.)
// Works fully serverless on Vercel with zero CORS issues

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: "Missing ?query parameter" });
  }

  try {
    const cleanDomain = query.trim().toLowerCase();

    // 🔍 Query Domainr public API
    const resp = await fetch(
      `https://api.domainsdb.info/v1/domains/search?domain=${encodeURIComponent(
        cleanDomain
      )}`
    );

    if (!resp.ok) {
      throw new Error(`DomainsDB API returned ${resp.status}`);
    }

    const data = await resp.json();

    // Handle empty / invalid responses
    if (!data.domains || data.domains.length === 0) {
      return res.status(200).json({
        domain: cleanDomain,
        available: true,
        message: "No existing registration found — domain appears available.",
      });
    }

    // Format results for multiple TLDs
    const results = data.domains.map((d) => ({
      domain: d.domain,
      country: d.country || "Unknown",
      isDead: d.isDead === "False" ? false : true,
      create_date: d.create_date || null,
      update_date: d.update_date || null,
    }));

    res.status(200).json({
      query: cleanDomain,
      available: false,
      message: "One or more domains with this name exist.",
      results,
    });
  } catch (err) {
    console.error("Error in checkDomain:", err);
    res.status(500).json({
      error: "Domain lookup failed",
      details: err.message,
    });
  }
}
