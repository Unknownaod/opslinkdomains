import Stripe from "stripe";
import { NextResponse } from "next/server";
import Pending from "@/models/PendingDomain";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await connectDB();
    const session = event.data.object;

    await Pending.create({
      userId: session.metadata.userId,
      domains: JSON.parse(session.metadata.domains),
      createdAt: Date.now(),
    });
  }

  return NextResponse.json({ success: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
