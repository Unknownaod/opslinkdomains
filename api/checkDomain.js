import fetch from "node-fetch";

const API_KEY = process.env.NAMESILO_KEY;
const NAME_SILO_API = "https://www.namesilo.com/api/checkRegisterAvailability";

export default async function handler(req, res) {
  try {
    // -----------------------------
    // 1️⃣ Ensure API key is present
    // -----------------------------
    if (!API_KEY) {
      console.error("❌ Missing NAMESILO_KEY environment variable");
      return res.status(500).json({
        error: "Server missing NameSilo API key. Configure env var: NAMESILO_KEY",
      });
    }

    // -------------------------------------
    // 2️⃣ Extract domain from query params
    // -------------------------------------
    const url = new URL(req.url, `https://${req.headers.host}`);
    const domain =
      url.searchParams.get("domain") || url.searchParams.get("query");

    if (!domain) {
      return res.status(400).json({ error: "Missing domain parameter" });
    }

    const clean = domain.toLowerCase().replace(/^https?:\/\//, "").trim();
    const base = clean.split(".")[0];

    // ---------------------------------
    // 3️⃣ TLD list to search against
    // ---------------------------------
    const tlds = [
      "com","net","org","co","io","xyz","dev","app","me","ca","us","uk","store","shop",
      "info","biz","cloud","gg","tv","tech","ai","in","fr","de","nl","es","it","jp","br",
      "mx","ru","be","cz","pt","sa","ae","sg","hk","ph","id","nz","ie","tr"
    ];

    // --------------------------------------------------------
    // 4️⃣ NameSilo availability detection:
    // available   → appears under <available_domains>
    // unavailable → appears under <unavailable_domains>
    // --------------------------------------------------------
    async function checkAvailability(tld) {
      const fqdn = `${base}.${tld}`;
      const nsURL = `${NAME_SILO_API}?version=1&type=xml&key=${API_KEY}&domains=${fqdn}`;

      try {
        const resp = await fetch(nsURL);
        const xml = await resp.text();

        const isAvailable =
          xml.includes("<available_domains>") &&
          xml.includes(`<domain>${fqdn}</domain>`);

        const isUnavailable =
          xml.includes("<unavailable_domains>") &&
          xml.includes(`<domain>${fqdn}</domain>`);

        return {
          domain: fqdn,
          available: isAvailable ? true : isUnavailable ? false : null,
        };
      } catch (err) {
        console.error("🔻 Lookup error for", fqdn, err);
        return { domain: fqdn, available: null, error: "Lookup failed" };
      }
    }

    // ---------------------------------------------------------
    // 5️⃣ Concurrency controlled queries to avoid rate limiting
    // ---------------------------------------------------------
    const concurrency = 10;
    const results = [];

    for (let i = 0; i < tlds.length; i += concurrency) {
      const chunk = tlds.slice(i, i + concurrency);
      const part = await Promise.all(chunk.map(checkAvailability));
      results.push(...part);
    }

    // -------------------------------------
    // 6️⃣ Sort: available → unavailable → null
    // -------------------------------------
    results.sort((a, b) => {
      if (a.available === b.available) return 0;
      return a.available ? -1 : 1;
    });

    // --------------------------
    // 7️⃣ Return clean JSON
    // --------------------------
    return res.status(200).json({
      searched: clean,
      base,
      count: results.length,
      results,
    });
  } catch (err) {
    console.error("❌ Fatal server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
