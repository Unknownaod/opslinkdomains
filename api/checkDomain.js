import fetch from "node-fetch";

const API_KEY = process.env.NAMESILO_KEY;
const NAME_SILO_API = "https://www.namesilo.com/api/checkRegisterAvailability";

export default async function handler(req, res) {
  try {
    if (!API_KEY) {
      console.error("❌ Missing NAMESILO_KEY env var");
      return res.status(500).json({ error: "Server misconfigured: missing API key" });
    }

    const url = new URL(req.url, `https://${req.headers.host}`);
    const domain = url.searchParams.get("domain") || url.searchParams.get("query");
    if (!domain) {
      return res.status(400).json({ error: "Missing domain parameter" });
    }

    const cleanBase = domain.toLowerCase()
      .replace(/^https?:\/\//,"")
      .replace(/\/.*/, "")
      .trim()
      .split(".")[0];

    const tlds = [
      "com","net","org","co","io","xyz","dev","app","me","ca","us","uk","store","shop",
      "info","biz","cloud","gg","tv","tech","ai","in","fr","de","nl","es","it","jp","br",
      "mx","ru","be","cz","pt","sa","ae","sg","hk","ph","id","nz","ie","tr"
    ];

    async function checkFqdn(tld) {
      const fqdn = `${cleanBase}.${tld}`;
      const apiUrl = `${NAME_SILO_API}?version=1&type=xml&key=${API_KEY}&domains=${encodeURIComponent(fqdn)}`;

      try {
        const r = await fetch(apiUrl);
        const xml = await r.text();

        // Detect available
        const availableTag =
          xml.includes("<available_domains>") &&
          xml.includes(`<domain>${fqdn}</domain>`);

        // Detect unavailable/taken
        const unavailableTag =
          xml.includes("<unavailable_domains>") &&
          xml.includes(`<domain>${fqdn}</domain>`);

        // NameSilo sometimes returns code 300 for unavailable
        const code300 = /\<code\>\s*300\s*<\/code\>/i.test(xml);

        const available = availableTag ? true :
                          unavailableTag || code300 ? false :
                          null;

        return { domain: fqdn, available };
      } catch (err) {
        console.error("❌ Error checking", fqdn, err);
        return { domain: fqdn, available: null, error: "Lookup failed" };
      }
    }

    const results = [];
    const concurrency = 10;

    for (let i = 0; i < tlds.length; i += concurrency) {
      const slice = tlds.slice(i, i + concurrency);
      const part = await Promise.all(slice.map(checkFqdn));
      results.push(...part);
    }

    results.sort((a, b) => {
      if (a.available === b.available) return 0;
      return a.available ? -1 : 1;
    });

    return res.status(200).json({
      base: cleanBase,
      count: results.length,
      results
    });

  } catch (err) {
    console.error("🐛 Unexpected error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
