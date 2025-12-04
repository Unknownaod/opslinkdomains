// api/checkDomain.js
export default async function handler(req, res) {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: "Missing domain parameter" });

  try {
    // Domainr API — supports all TLDs
    const response = await fetch(`https://api.domainr.com/v2/status?domain=${domain}&client_id=opslink_systems_demo`, {
      headers: { "Accept": "application/json" },
    });
    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (err) {
    console.error("Domain check failed:", err);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ error: "Failed to check domain" });
  }
}
