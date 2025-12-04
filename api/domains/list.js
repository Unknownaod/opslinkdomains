import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Domain from "@/models/Domain";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  await connectDB();

  const token = cookies().get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const domains = await Domain.find({ userId: decoded.id });

  return NextResponse.json({ domains });
}
