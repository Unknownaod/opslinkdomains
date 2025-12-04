import fetch from "node-fetch";

const KEY = process.env.NAMESILO_KEY;
const CHECK_API = "https://www.namesilo.com/api/checkRegisterAvailability";
const INFO_API = "https://www.namesilo.com/api/getDomainInfo";

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const domain = url.searchParams.get("domain") || url.searchParams.get("query");

  if (!domain) return res.status(400).json({ error: "Missing domain" });

  const base = domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*/, "")
    .split(".")[0]
    .trim();

  const tlds = [
    "com","net","org","co","io","xyz","dev","app","me","ca","us","uk","store","shop",
    "info","biz","cloud","gg","tv","tech","ai","in","fr","de","nl","es","it","jp",
    "br","mx","ru","be","cz","pt","sa","ae","sg","hk","ph","id","nz","ie","tr"
  ];

  async function check(fqdn) {
    const checkURL = `${CHECK_API}?version=1&type=xml&key=${KEY}&domains=${fqdn}`;

    try {
      const raw = await fetch(checkURL).then(r => r.text());

      if (raw.includes(`<domain>${fqdn}</domain>`)) {
        return { domain: fqdn, available: true };
      }
    } catch {}

    // Fallback: detect if ALREADY REGISTERED ANYWHERE
    const infoURL = `${INFO_API}?version=1&type=xml&key=${KEY}&domain=${fqdn}`;

    try {
      const raw = await fetch(infoURL).then(r => r.text());
      const registered = raw.includes("<registered>") || raw.includes("<status>Active</status>");

      return { domain: fqdn, available: !registered };
    } catch (err) {
      console.error("Lookup failed:", fqdn, err);
      return { domain: fqdn, available: null };
    }
  }

  const results = [];
  for (let tld of tlds) results.push(await check(`${base}.${tld}`));

  results.sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1));

  return res.status(200).json({ base, count: results.length, results });
}
