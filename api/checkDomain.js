import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

const KEY = process.env.NAMESILO_KEY;
const API = "https://www.namesilo.com/api/checkRegisterAvailability";

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const domain = url.searchParams.get("domain");

  if (!domain) return res.status(400).json({ error: "Missing domain" });

  const base = domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*/, "")
    .split(".")[0];

  const tlds = [
    "com","net","org","co","io","xyz","dev","app","me","ca","us","uk","store",
    "shop","info","biz","cloud","gg","tv","tech","ai","in","fr","de","nl",
    "es","it","jp","br","mx","ru","be","cz","pt","sa","ae","sg","hk","ph",
    "id","nz","ie","tr"
  ];

  async function check(fqdn) {
    const url = `${API}?version=1&type=xml&key=${KEY}&domains=${fqdn}`;

    try {
      const xml = await fetch(url).then(r => r.text());
      const data = await parseStringPromise(xml);

      const available = data?.namesilo?.reply?.available_domains?.[0]?.domain?.includes(fqdn);
      return { domain: fqdn, available: Boolean(available) };

    } catch (err) {
      console.error("ERROR checking:", fqdn, err);
      return { domain: fqdn, available: null };
    }
  }

  const results = [];
  for (const tld of tlds) results.push(await check(`${base}.${tld}`));

  results.sort((a, b) =>
    a.available === b.available ? 0 : a.available ? -1 : 1
  );

  return res.status(200).json({ base, count: results.length, results });
}
