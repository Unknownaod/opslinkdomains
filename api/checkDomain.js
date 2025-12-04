// app/api/checkDomain/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge"; // or remove this if you prefer Node.js

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("domain");

  if (!raw) {
    return NextResponse.json(
      { error: "Missing domain parameter" },
      { status: 400 }
    );
  }

  // Normalize: strip protocol, path, spaces, uppercase, etc.
  const domain = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  // Google Public DNS JSON API
  const dnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(
    domain
  )}&type=A`;

  try {
    const dnsRes = await fetch(dnsUrl, {
      headers: { Accept: "application/dns-json" },
      cache: "no-store",
    });

    if (!dnsRes.ok) {
      return NextResponse.json(
        {
          domain,
          available: null,
          error: "DNS lookup failed",
        },
        { status: 502 }
      );
    }

    const data = await dnsRes.json();

    // From Google DoH JSON:
    // - "Status" === 3 → NXDOMAIN (no such domain)
    // - "Answer" present with records → domain resolves
    const status = data.Status;
    const hasAnswers = Array.isArray(data.Answer) && data.Answer.length > 0;

    // If DNS says NXDOMAIN or there are no answers, we *assume* it's available
    // Otherwise, we treat it as taken.
    const available = status === 3 || !hasAnswers ? true : false;

    return NextResponse.json({
      domain,
      available,
      debug: {
        status,
        hasAnswers,
      },
    });
  } catch (err) {
    console.error("Domain check error:", err);
    return NextResponse.json(
      {
        domain,
        available: null,
        error: "Internal error while checking domain",
      },
      { status: 500 }
    );
  }
}
