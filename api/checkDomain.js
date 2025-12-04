// ✅ Vercel-style Universal Domain Search API
// Uses Domainr's official public API (https://domainr.com/developer)
// Automatically lists all TLDs, both taken + available

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
    const cleanQuery = query.trim().toLowerCase();

    // Optional: Add your free Domainr developer key for higher rate limits
    // Create one here: https://domainr.com/developer
    const apiKey = process.env.DOMAINR_KEY || "";

    // 🔍 Call Domainr official API (returns list of all possible TLDs)
    const url = `https://api.domainr.com/v2/search?query=${encodeURIComponent(
      cleanQuery
    )}&location=us${apiKey ? `&key=${apiKey}` : ""}`;

    const resp = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!resp.ok) {
      throw new Error(`Domainr returned ${resp.status}`);
    }

    const data = await resp.json();

    if (!data.results || data.results.length === 0) {
      return res
        .status(200)
        .json({ query: cleanQuery, results: [], message: "No domains found" });
    }

    // 🧠 Map Domainr's response into simple frontend-ready data
    const results = data.results.map((r) => ({
      domain: r.domain,
      availability: r.availability || "unknown", // 'available' | 'taken' | 'unavailable' | 'tld' | 'maybe'
      registerURL: `https://domains.opslinkcad.com/cart.php?a=add&domain=register&query=${encodeURIComponent(
        r.domain
      )}`,
    }));

    return res.status(200).json({ query: cleanQuery, results });
  } catch (err) {
    console.error("Domainr error:", err);
    res.status(500).json({
      error: "Domain lookup failed",
      details: err.message,
    });
  }
}
