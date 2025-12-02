// /api/checkDomain.js
export default async function handler(req, res) {
  // Allow CORS (for your OpsLink Domains site)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Grab the query params
  const { domain } = req.query;
  if (!domain) {
    return res.status(400).json({ error: "Missing domain parameter" });
  }

  try {
    // Use your actual ResellersPanel store ID
    const apiUrl = `https://secure.duoservers.com/tld-search/api-search.php?store=store244290&domain=${encodeURIComponent(domain)}`;
    const response = await fetch(apiUrl);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // The API sometimes returns plain text; wrap it
      data = { raw: text };
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Failed to reach upstream API" });
  }
}
