import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Domain from "@/models/Domain";

const KEY = process.env.NAMESILO_KEY;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");

  if (!domain) return NextResponse.json({ error: "Missing domain" }, { status: 400 });

  const url = `https://www.namesilo.com/api/dnsListRecords?version=1&type=json&key=${KEY}&domain=${domain}`;
  const records = await fetch(url).then(r => r.json());

  return NextResponse.json(records.reply.resource_record || []);
}
