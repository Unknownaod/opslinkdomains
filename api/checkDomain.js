// /api/checkDomain.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: "Missing domain parameter" });

  try {
    const apiUrl = `https://secure.duoservers.com/tld-search/api-search.php?store=store244290&domain=${encodeURIComponent(domain)}`;
    const response = await fetch(apiUrl);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to reach ResellersPanel API" });
  }
}
