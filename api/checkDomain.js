import { NextResponse } from "next/server";
export const runtime = "nodejs";

const API_KEY = process.env.NAMESILO_KEY;
const NAME_SILO_API = "https://www.namesilo.com/api/checkRegisterAvailability";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("query") || searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
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

  async function checkTld(tld: string) {
    const fqdn = `${base}.${tld}`;

    const url = `${NAME_SILO_API}?version=1&type=xml&key=${API_KEY}&domains=${fqdn}`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      const xml = await res.text();

      // A domain is available ONLY if it appears in <available_domains>
      const isAvailable = new RegExp(`<domain>${fqdn}</domain>`, "i").test(xml);

      return { domain: fqdn, available: isAvailable };
    } catch (e: any) {
      console.error("Lookup failed:", fqdn, e);
      return { domain: fqdn, available: null, error: "Lookup failed" };
    }
  }

  const concurrency = 10;
  let results: any[] = [];

  for (let i = 0; i < tlds.length; i += concurrency) {
    const chunk = tlds.slice(i, i + concurrency);
    const partial = await Promise.all(chunk.map(checkTld));
    results = results.concat(partial);
  }

  results.sort((a, b) =>
    a.available === b.available ? 0 : a.available ? -1 : 1
  );

  return NextResponse.json({
    base,
    searched: clean,
    count: results.length,
    results,
  });
}
