import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Pending from "@/models/PendingDomain";
import Domain from "@/models/Domain";

const API = "https://www.namesilo.com/api";
const KEY = process.env.NAMESILO_KEY;

// Your Vercel nameservers
const NS = [
  "dns1.p01.nsone.net",
  "dns2.p01.nsone.net"
]; // Replace if needed

export async function GET() {
  await connectDB();

  const pendings = await Pending.find();
  if (!pendings.length) {
    return NextResponse.json({ msg: "No pending domains" });
  }

  for (const order of pendings) {
    for (const domain of order.domains) {
      const registerUrl =
        `${API}/domain/register?version=1&type=xml&key=${KEY}` +
        `&domain=${domain}&years=1` +
        `&nameserver=${NS[0]}&nameserver=${NS[1]}`;

      const res = await fetch(registerUrl).then(r => r.text());

      if (!res.includes("<code>300</code>")) {
        console.log("Registration failed:", domain, res);
        continue;
      }

      // Find expiration date
      const expiration = res.match(/<expiration>(.*?)<\/expiration>/i)?.[1];

      // Assign to user
      await User.findByIdAndUpdate(order.userId, {
        $push: { domains: domain },
      });

      // Store domain record
      await Domain.create({
        userId: order.userId,
        domain,
        createdAt: Date.now(),
        expiresAt: expiration ? new Date(expiration).getTime() : null
      });

      console.log("Registered:", domain);
    }

    // Clear processed order
    await Pending.findByIdAndDelete(order._id);
  }

  return NextResponse.json({ msg: "All pending domains processed" });
}
