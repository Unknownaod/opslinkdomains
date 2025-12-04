import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  const { pathname } = new URL(req.url);
  const body = await req.json();

  // /api/auth?type=login
  const type = new URL(req.url).searchParams.get("type");

  try {
    switch (type) {
      case "login":
        return await loginUser(body);
      case "register":
        return await registerUser(body);
      case "me":
        return await getCurrentUser(body);
      default:
        return NextResponse.json({ error: "Invalid auth type" }, { status: 400 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Auth route failed" }, { status: 500 });
  }
}

// Example functions
async function loginUser(data) {
  return NextResponse.json({ success: true, action: "login", user: data });
}
async function registerUser(data) {
  return NextResponse.json({ success: true, action: "register", user: data });
}
async function getCurrentUser() {
  return NextResponse.json({ success: true, action: "me", user: "OpsLink Admin" });
}
