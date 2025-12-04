import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Pending from "@/models/PendingDomain";
import Domain from "@/models/Domain";

const API = "https://www.namesilo.com/api";
const KEY = process.env.NAMESILO_KEY;

// OPTIONAL — set these ONLY if you want to force Namesilo DNS
// If using Vercel DNS, REMOVE the nameserver params completely
const FORCE_NS = false; // Change to true if you want custom nameservers
const NS = [
  "ns1.vercel-dns.com",
  "ns2.vercel-dns.com"
];

export const runtime = "nodejs";

export async function GET() {
  await connectDB();

  const pendings = await Pending.find();
  if (!pendings.length) {
    return NextResponse.json({ msg: "No pending domains" });
  }

  const processed = [];

  for (const order of pendings) {
    for (const domain of order.domains) {
      let url =
        `${API}/registerDomain?version=1&type=xml&key=${KEY}&domain=${domain}&years=1`;

      if (FORCE_NS) {
        url += `&nameserver=${NS[0]}&nameserver=${NS[1]}`;
      }

      const xml = await fetch(url).then(r => r.text());

      if (!xml.includes("<code>300</code>")) {
        console.log("❌ FAILED:", domain);
        console.log(xml);
        processed.push({ domain, status: "FAILED" });
        continue;
      }

      const expiration = xml.match(/<expiration>(.*?)<\/expiration>/i)?.[1] || null;

      // Assign to user profile
      await User.findByIdAndUpdate(order.userId, { $push: { domains: domain } });

      // Save domain record
      await Domain.create({
        userId: order.userId,
        domain,
        createdAt: Date.now(),
        expiresAt: expiration ? new Date(expiration).getTime() : null,
      });

      processed.push({ domain, status: "REGISTERED", expires: expiration });
      console.log("🟢 REGISTERED:", domain);
    }

    await Pending.findByIdAndDelete(order._id);
  }

  return NextResponse.json({
    msg: "Pending domains processed",
    results: processed
  });
}
