import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

const KEY = process.env.NAMESILO_KEY;
const TLD_API = "https://www.namesilo.com/api/listTlds";
const CHECK_API = "https://www.namesilo.com/api/checkRegisterAvailability";

let cachedTLDs = [];

async function getTLDs() {
  if (cachedTLDs.length) return cachedTLDs;

  const url = `${TLD_API}?version=1&type=xml&key=${KEY}`;
  const xml = await fetch(url).then(r => r.text());
  const parsed = await parseStringPromise(xml);

  cachedTLDs =
    parsed?.namesilo?.reply?.tlds?.[0]?.tld?.map(t => t.toLowerCase()) || [];

  return cachedTLDs;
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const domain = url.searchParams.get("domain");

    if (!domain) return res.status(400).json({ error: "Missing domain" });

    const base = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*/, "")
      .split(".")[0];

    const tlds = await getTLDs(); // 🔥 Dynamic, not static

    async function check(fqdn) {
      const url = `${CHECK_API}?version=1&type=xml&key=${KEY}&domains=${fqdn}`;
      const xml = await fetch(url).then(r => r.text());
      const parsed = await parseStringPromise(xml);

      const available =
        parsed?.namesilo?.reply?.available_domains?.[0]?.domain?.includes(fqdn);

      return { domain: fqdn, available: Boolean(available) };
    }

    // LIMIT INITIAL RESPONSE FOR PERFORMANCE
    const first50Tlds = tlds.slice(0, 50);
    const results = [];

    for (const tld of first50Tlds) {
      results.push(await check(`${base}.${tld}`));
    }

    return res.status(200).json({
      base,
      requested: domain,
      totalTlds: tlds.length,
      returned: results.length,
      results
    });

  } catch (err) {
    console.error("CHECKDOMAIN ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
