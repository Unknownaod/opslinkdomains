import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const API = "https://www.namesilo.com/api";
const KEY = process.env.NAMESILO_KEY;

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  const userId = searchParams.get("userId");

  if (!domain || !userId)
    return NextResponse.json({ error: "Missing domain or userId" }, { status: 400 });

  // Verify domain belongs to this user
  const user = await User.findById(userId);
  if (!user || !user.domains.includes(domain))
    return NextResponse.json({ error: "Unauthorized domain" }, { status: 403 });

  const url = `${API}/dnsListRecords?version=1&type=json&key=${KEY}&domain=${domain}`;
  const res = await fetch(url).then(r => r.json());

  const records = res?.reply?.resource_record || [];

  return NextResponse.json(records);
}
