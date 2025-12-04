import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || searchParams.get("domain");

  if (!query) {
    return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
  }

  // Clean & normalize
  const clean = query
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\s/g, "");

  // Remove tld if present (soundwave.net → soundwave)
  const base = clean.split(".")[0];

  // ✅ Popular & widely used TLDs (covers 95% of global domains)
  const tlds = [
    "com","net","org","co","io","xyz","dev","app","me","ca","us","uk","au","store","shop",
    "info","biz","cloud","gg","tv","tech","ai","in","fr","de","nl","pl","es","it","ch",
    "no","se","dk","fi","jp","kr","cn","za","br","mx","ru","gr","be","at","cz","pt",
    "sa","ae","sg","hk","ph","pk","id","nz","ie","il","ar","cl","tr","ng","qa","kw"
  ];

  // ✅ Common subdomains that might resolve
  const subdomains = ["", "www", "api", "panel", "shop", "blog", "portal"];

  async function checkDomain(tld: string, sub: string) {
    const fqdn = sub ? `${sub}.${base}.${tld}` : `${base}.${tld}`;
    const url = `https://dns.google/resolve?name=${encodeURIComponent(fqdn)}&type=A`;

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/dns-json" },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("DNS query failed");
      const data = await res.json();

      const status = data.Status;
      const hasAnswers = Array.isArray(data.Answer) && data.Answer.length > 0;
      const available = status === 3 || !hasAnswers;

      return { domain: fqdn, tld, subdomain: sub || null, available };
    } catch {
      return { domain: fqdn, tld, subdomain: sub || null, available: null };
    }
  }

  // Limit concurrency to keep under Edge timeouts
  const concurrency = 20;
  const tasks: any[] = [];

  for (const tld of tlds) {
    for (const sub of subdomains) tasks.push({ tld, sub });
  }

  const results: any[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const chunk = tasks.slice(i, i + concurrency);
    const part = await Promise.all(chunk.map((x) => checkDomain(x.tld, x.sub)));
    results.push(...part);
  }

  // Sort with available ones first
  const sorted = results.sort((a, b) =>
    a.available === b.available ? 0 : a.available ? -1 : 1
  );

  return NextResponse.json({
    base,
    count: sorted.length,
    results: sorted,
  });
}
