// app/api/checkDomain/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("domain");

  if (!raw) {
    return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
  }

  const base = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .split(".")[0];

  try {
    // 1️⃣ Fetch the official IANA TLD list (always up to date)
    const tldRes = await fetch("https://data.iana.org/TLD/tlds-alpha-by-domain.txt", {
      cache: "no-store",
    });

    if (!tldRes.ok) {
      throw new Error("Failed to fetch TLD list from IANA");
    }

    const tldText = await tldRes.text();
    const allTlds = tldText
      .split("\n")
      .filter((l) => l && !l.startsWith("#"))
      .map((t) => t.trim().toLowerCase());

    // 2️⃣ Helper to check one domain
    async function checkOne(tld: string) {
      const fqdn = `${base}.${tld}`;
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

        return { domain: fqdn, tld, available };
      } catch {
        return { domain: fqdn, tld, available: null, error: "Lookup failed" };
      }
    }

    // 3️⃣ Run all in limited parallel batches to avoid hitting Google DNS limits
    const concurrency = 20;
    const results: any[] = [];
    for (let i = 0; i < allTlds.length; i += concurrency) {
      const chunk = allTlds.slice(i, i + concurrency);
      const partial = await Promise.all(chunk.map((tld) => checkOne(tld)));
      results.push(...partial);
    }

    // Sort with available ones first
    const sorted = results.sort((a, b) =>
      a.available === b.available ? 0 : a.available ? -1 : 1
    );

    return NextResponse.json({ base, count: sorted.length, results: sorted });
  } catch (err: any) {
    console.error("Domain check error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error during TLD lookup" },
      { status: 500 }
    );
  }
}
