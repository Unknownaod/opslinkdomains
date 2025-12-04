import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Pending from "@/models/PendingDomain";

const NAMESILO_KEY = process.env.NAMESILO_KEY;

export async function GET() {
  await connectDB();
  const pendings = await Pending.find();

  if (!pendings.length) return NextResponse.json({ msg: "No pending domains" });

  for (const p of pendings) {
    for (const domain of p.domains) {
      const url =
        `https://www.namesilo.com/api/registerDomain?version=1&type=json` +
        `&key=${NAMESILO_KEY}&domain=${domain}&years=1`;

      await fetch(url); // registers domain without forcing nameservers

      await User.findByIdAndUpdate(p.userId, {
        $push: { domains: domain },
      });
    }

    await Pending.findByIdAndDelete(p._id);
  }

  return NextResponse.json({ msg: "Domains registered & assigned" });
}
