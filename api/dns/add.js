import { NextResponse } from "next/server";

const API = "https://www.namesilo.com/api";
const KEY = process.env.NAMESILO_KEY;

export async function POST(req) {
  const body = await req.json();
  const { domain, type, host, value, ttl = 3600 } = body;

  if (!domain || !type || !host || !value)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const url =
    `${API}/dnsAddRecord?version=1&type=json&key=${KEY}` +
    `&domain=${domain}&rrtype=${type}&rrhost=${host}&rrvalue=${value}&rrttl=${ttl}`;

  const res = await fetch(url).then(r => r.json());

  if (res?.reply?.code !== 300)
    return NextResponse.json({ error: res?.reply?.detail || "Failed" }, { status: 500 });

  return NextResponse.json({ success: true });
}
