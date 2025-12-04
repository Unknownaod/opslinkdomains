import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const runtime = "nodejs";

export async function POST(req) {
  await connectDB();
  const { type } = new URL(req.url).searchParams;
  const data = await req.json();

  switch (type) {
    case "register":
      return register(data);
    case "login":
      return login(data);
    default:
      return NextResponse.json({ error: "Invalid auth type" }, { status: 400 });
  }
}

export async function GET(req) {
  await connectDB();
  const { type } = new URL(req.url).searchParams;

  if (type !== "me") {
    return NextResponse.json({ error: "Invalid route" }, { status: 400 });
  }

  const token = req.headers.get("authorization");
  if (!token) return NextResponse.json({ user: null });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

async function register({ email, password }) {
  if (!email || !password)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const exists = await User.findOne({ email });
  if (exists) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  await User.create({ email, password: hash });

  return NextResponse.json({ success: true });
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

  return NextResponse.json({ token });
}
