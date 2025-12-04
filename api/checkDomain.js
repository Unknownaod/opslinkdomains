// api/checkDomain.js
export default async function handler(req, res) {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  try {
    // Domainr Search API – returns many TLDs at once
    const response = await fetch(`https://api.domainr.com/v2/search?query=${query}&client_id=opslink_systems_demo`, {
      headers: { "Accept": "application/json" },
    });
    const data = await response.json();

    const results = data.results.map(r => ({
      domain: r.domain,
      availability: r.availability
    }));

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ results });
  } catch (err) {
    console.error("Domain search failed:", err);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: "Failed to fetch domain list" });
  }
}
