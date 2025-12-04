import { NextResponse } from "next/server";

const API = "https://www.namesilo.com/api";
const KEY = process.env.NAMESILO_KEY;

export async function POST(req) {
  const body = await req.json();
  const { domain, record_id } = body;

  if (!domain || !record_id)
    return NextResponse.json({ error: "Missing domain or record_id" }, { status: 400 });

  const url =
    `${API}/dnsDeleteRecord?version=1&type=json&key=${KEY}` +
    `&domain=${domain}&rrid=${record_id}`;

  const res = await fetch(url).then(r => r.json());

  if (res?.reply?.code !== 300)
    return NextResponse.json({ error: res?.reply?.detail || "Failed" }, { status: 500 });

  return NextResponse.json({ success: true });
}
