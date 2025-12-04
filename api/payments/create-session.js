import Stripe from "stripe";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    await connectDB();
    const { userId, domains } = await req.json();

    if (!userId || !domains?.length) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Ensure Stripe Customer exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Price per domain we charge the user
    const pricePerDomain = 500; // 500 cents = $5

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: domains.map(domain => ({
        price_data: {
          currency: "usd",
          unit_amount: pricePerDomain,
          product_data: {
            name: `Register ${domain}`,
          },
        },
        quantity: 1,
      })),
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/domains.html?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/domains.html?canceled=true`,

      metadata: {
        userId,
        domains: JSON.stringify(domains), // Namesilo processing API will use this
      }
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("Stripe Session Error:", err);
    return NextResponse.json({ error: "Internal payment error" }, { status: 500 });
  }
}
