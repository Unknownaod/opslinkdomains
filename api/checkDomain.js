import fetch from "node-fetch";

const KEY = process.env.NAMESILO_KEY;
const API = "https://www.namesilo.com/api/checkRegisterAvailability";

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const query = url.searchParams.get("domain") || url.searchParams.get("query");

    if (!query) return res.status(400).json({ error: "Missing domain parameter" });

    const clean = query
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*/, "")
      .trim();

    const base = clean.split(".")[0];

    const tlds = [
      "com","net","org","co","io","xyz","dev","app","me","ca","us","uk","store","shop",
      "info","biz","cloud","gg","tv","tech","ai","in","fr","de","nl","es","it","jp",
      "br","mx","ru","be","cz","pt","sa","ae","sg","hk","ph","id","nz","ie","tr"
    ];

    async function check(fqdn) {
      try {
        const checkURL = `${API}?version=1&type=xml&key=${KEY}&domains=${fqdn}`;
        const xml = await fetch(checkURL).then(r => r.text());

        // NameSilo returns available domains ONLY inside <available_domains>
        const available =
          xml.includes("<available_domains>") &&
          xml.includes(`<domain>${fqdn}</domain>`);

        return { domain: fqdn, available };
      } catch (err) {
        console.error("Error checking:", fqdn, err);
        return { domain: fqdn, available: null };
      }
    }

    // Parallel lookup (fast)
    const results = await Promise.all(tlds.map(t => check(`${base}.${t}`)));

    // Sort so available domains appear first
    results.sort((a, b) =>
      a.available === b.available ? 0 : a.available ? -1 : 1
    );

    return res.status(200).json({
      base,
      count: results.length,
      results
    });
  } catch (err) {
    console.error("CHECKDOMAIN FAILED", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
