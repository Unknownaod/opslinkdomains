import Stripe from "stripe";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  await connectDB();
  const body = await req.json();

  const { userId, domains } = body;
  if (!userId || !domains || domains.length === 0) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // YOUR PRICE MARKUP
  const pricePerDomain = 5; // USD profit
  const total = domains.length * pricePerDomain * 100;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: domains.map(domain => ({
      price_data: {
        currency: "usd",
        unit_amount: 500, // $5 per domain
        product_data: {
          name: `Register ${domain}`,
        },
      },
      quantity: 1,
    })),
    success_url: `${process.env.NEXT_PUBLIC_URL}/auth/login.html?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/auth/login.html?canceled=true`,
    metadata: {
      userId,
      domains: JSON.stringify(domains),
    },
  });

  return NextResponse.json({ url: session.url });
}
