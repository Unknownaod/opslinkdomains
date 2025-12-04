import Domain from "@/models/Domain";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectDB();
  const jwt = req.headers.get("authorization");
  if (!jwt) return NextResponse.json({ error: "Missing token" }, { status: 401 });

  const payload = JSON.parse(atob(jwt.split(".")[1]));
  const domains = await Domain.find({ userId: payload.id });
  return NextResponse.json(domains);
}
