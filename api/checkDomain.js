import fetch from "node-fetch";
import { whois } from "@sonnyp/whois";

const KEY = process.env.NAMESILO_KEY;
const CHECK_API = "https://www.namesilo.com/api/checkRegisterAvailability";

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const query = url.searchParams.get("domain") || url.searchParams.get("query");

  if (!query) return res.status(400).json({ error: "Missing domain" });

  const base = query
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*/, "")
    .split(".")[0];

  const tlds = [
    "com","net","org","co","io","xyz","dev","app","me","ca","us","uk","store","shop",
    "info","biz","cloud","gg","tv","tech","ai","in","fr","de","nl","es","it","jp",
    "br","mx","ru","be","cz","pt","sa","ae","sg","hk","ph","id","nz","ie","tr"
  ];

  async function check(fqdn) {
    const checkURL = `${CHECK_API}?version=1&type=xml&key=${KEY}&domains=${fqdn}`;

    try {
      const xml = await fetch(checkURL).then(r => r.text());
      const available = xml.includes(`<domain>${fqdn}</domain>`);

      if (available) return { domain: fqdn, available: true };

      // WHOIS fallback for TAKEN domains
      const whoisData = await whois(fqdn);
      const taken = whoisData && !whoisData.toLowerCase().includes("no match");

      return { domain: fqdn, available: !taken };
    } catch (err) {
      console.error("Error:", fqdn, err);
      return { domain: fqdn, available: null };
    }
  }

  const results = [];
  for (let tld of tlds) results.push(await check(`${base}.${tld}`));

  results.sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1));

  return res.status(200).json({ base, count: results.length, results });
}
