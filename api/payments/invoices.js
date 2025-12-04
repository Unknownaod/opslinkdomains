import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  try {
    await connectDB();
    const token = req.headers.get("authorization");

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await User.findOne({ token });
    if (!user || !user.stripeCustomerId)
      return NextResponse.json([], { status: 200 });

    // Fetch invoices for customer
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 20,
    });

    const formatted = invoices.data.map(inv => ({
      domain: inv.metadata?.domain || "Domain Purchase",
      amount: inv.amount_paid,
      date: inv.created * 1000,
      url: inv.hosted_invoice_url,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Invoice Load Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
