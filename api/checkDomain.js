import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Needs Node for HTTPS requests (Edge too limited)

// 🔑 Set your NameSilo API key in your Vercel Environment Variables
// Example: NAMESILO_KEY=abcd1234...
const NAME_SILO_API = "https://www.namesilo.com/api/checkRegisterAvailability";
const API_KEY = process.env.NAMESILO_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || searchParams.get("domain");

  if (!query) {
    return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
  }

  const clean = query
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\s/g, "");

  const base = clean.split(".")[0];

  // ✅ List of major TLDs to check (can be expanded)
  const tlds = [
    "com","net","org","co","io","xyz","dev","app","me","ca","us","uk","store","shop",
    "info","biz","cloud","gg","tv","tech","ai","in","fr","de","nl","es","it","jp","br",
    "mx","ru","be","cz","pt","sa","ae","sg","hk","ph","id","nz","ie","tr"
  ];

  // ✅ Helper: check NameSilo API for each TLD
  async function checkTld(tld: string) {
    const fqdn = `${base}.${tld}`;

    const url = `${NAME_SILO_API}?version=1&type=xml&key=${API_KEY}&domains=${encodeURIComponent(fqdn)}`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to reach NameSilo");

      const xml = await res.text();

      // Parse simple XML for <available>yes/no
      const available = /<available>yes<\/available>/i.test(xml);
      return { domain: fqdn, tld, available };
    } catch (err) {
      console.error(`Error checking ${fqdn}:`, err);
      return { domain: fqdn, tld, available: null, error: "Lookup failed" };
    }
  }

  // Limit concurrency to avoid hitting NameSilo rate limit (max 10 req/sec)
  const concurrency = 10;
  const results: any[] = [];

  for (let i = 0; i < tlds.length; i += concurrency) {
    const chunk = tlds.slice(i, i + concurrency);
    const partial = await Promise.all(chunk.map(checkTld));
    results.push(...partial);
  }

  // Sort available first
  const sorted = results.sort((a, b) =>
    a.available === b.available ? 0 : a.available ? -1 : 1
  );

  return NextResponse.json({
    base,
    count: sorted.length,
    results: sorted,
  });
}
