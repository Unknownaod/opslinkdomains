import fetch from "node-fetch";

const NAME_SILO_API = "https://www.namesilo.com/api/checkRegisterAvailability";
const API_KEY = process.env.NAMESILO_KEY;

export default async function handler(req, res) {
  try {
    if (!API_KEY) {
      console.error("❌ Missing NAMESILO_KEY env var");
      return res.status(500).json({ error: "Server missing NameSilo API key" });
    }

    const url = new URL(req.url, `https://${req.headers.host}`);
    const domain =
      url.searchParams.get("domain") || url.searchParams.get("query");

    if (!domain) {
      return res.status(400).json({ error: "Missing domain parameter" });
    }

    const clean = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*/, "")
      .trim();

    const base = clean.split(".")[0];

    const tlds = [
      "com","net","org","co","io","xyz","dev","app","me","ca","us","uk","store","shop",
      "info","biz","cloud","gg","tv","tech","ai","in","fr","de","nl","es","it","jp","br",
      "mx","ru","be","cz","pt","sa","ae","sg","hk","ph","id","nz","ie","tr"
    ];

    async function checkTld(tld) {
      const fqdn = `${base}.${tld}`;
      const checkUrl = `${NAME_SILO_API}?version=1&type=xml&key=${API_KEY}&domains=${fqdn}`;

      try {
        const resp = await fetch(checkUrl);
        const xml = await resp.text();
        const available = xml.includes(`<domain>${fqdn}</domain>`);
        return { domain: fqdn, available };
      } catch (err) {
        console.error(`❌ Lookup failed for ${fqdn}`, err);
        return { domain: fqdn, available: null, error: "Lookup failed" };
      }
    }

    const results = [];
    const concurrency = 10;

    for (let i = 0; i < tlds.length; i += concurrency) {
      const chunk = tlds.slice(i, i + concurrency);
      const part = await Promise.all(chunk.map(checkTld));
      results.push(...part);
    }

    results.sort((a, b) =>
      a.available === b.available ? 0 : a.available ? -1 : 1
    );

    return res.status(200).json({
      searched: clean,
      base,
      count: results.length,
      results
    });

  } catch (err) {
    console.error("❌ Fatal server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
