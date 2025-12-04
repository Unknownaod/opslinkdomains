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
    console.error("Webhook signature failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Only handle events where payment is confirmed
  const validEvents = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "payment_intent.succeeded",
    "charge.succeeded"
  ];

  if (validEvents.includes(event.type)) {
    await connectDB();

    const session =
      event.data.object.metadata ? event.data.object :
      event.type.startsWith("payment_intent") ? event.data.object.metadata :
      null;

    if (!session?.metadata?.userId || !session?.metadata?.domains) {
      console.log("Webhook missing metadata, ignoring.");
      return NextResponse.json({ ignored: true });
    }

    const userId = session.metadata.userId;
    const domains = JSON.parse(session.metadata.domains);

    // Prevent duplicates if webhook fires twice
    const exists = await Pending.findOne({ userId, domains });
    if (!exists) {
      await Pending.create({ userId, domains });
      console.log("🟢 Pending job added:", domains);
    } else {
      console.log("⚠ Skipped duplicate webhook insert");
    }
  }

  return NextResponse.json({ received: true });
}

// Required for raw body
export const config = { api: { bodyParser: false } };
