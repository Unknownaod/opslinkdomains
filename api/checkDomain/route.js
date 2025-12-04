import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

const KEY = process.env.NAMESILO_KEY;
const API = "https://www.namesilo.com/api";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");
    if (!domain) return NextResponse.json({ error: "Missing domain" });

    const base = domain.toLowerCase().split(".")[0];

const tlds = [
  // Core global TLDs
  "com","net","org","co","io","me","info","biz",

  // Tech / Startup
  "dev","app","ai","tech","cloud","digital","systems","network","software",

  // Creative / Personal
  "xyz","site","page","design","studio","media","space","online","life",

  // Business / eCommerce
  "store","shop","services","agency","solutions","group","company",

  // Geo / Regional (high-intent buyers)
  "us","ca","uk","eu","au","in","de","fr",

  // Premium extensions (higher value)
  "gg","tv","app","pro","web"
];

    const results = [];

    for (const tld of tlds) {
      const fqdn = `${base}.${tld}`;
      const url = `${API}/checkRegisterAvailability?version=1&type=xml&key=${KEY}&domains=${fqdn}`;
      const xml = await fetch(url).then(r => r.text());
      const parsed = await parseStringPromise(xml);

      const available =
        parsed?.namesilo?.reply?.available_domains?.[0]?.domain?.includes(fqdn);

      results.push({ domain: fqdn, available: Boolean(available) });
    }

    return NextResponse.json({
      base,
      requested: domain,
      totalTlds: tlds.length,
      returned: results.length,
      results
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: true, message: "Lookup failed" });
  }
}
