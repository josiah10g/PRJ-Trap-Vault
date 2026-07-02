import { NextResponse } from "next/server";

/**
 * POST /api/verify-payment
 * Body: { reference: string, cartItems: Array, userEmail: string }
 *
 * 1. Verifies the Paystack transaction reference server-side
 *    using the secret key (never exposed to the client).
 * 2. On success, inserts an order record into Supabase.
 * 3. Returns success/failure JSON to the client.
 */
export async function POST(request) {
  try {
    const { reference, cartItems, userEmail } = await request.json();

    if (!reference) {
      return NextResponse.json(
        { error: "No transaction reference provided." },
        { status: 400 }
      );
    }

    // ── 1. Verify with Paystack ───────────────────────────────────────────
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      console.error("PAYSTACK_SECRET_KEY is not set.");
      return NextResponse.json(
        { error: "Payment configuration error." },
        { status: 500 }
      );
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return NextResponse.json(
        { error: "Payment could not be verified.", details: verifyData.message },
        { status: 402 }
      );
    }

    const amountPaid = verifyData.data.amount / 100; // Paystack returns kobo

    // ── 2. Save order to Supabase (service-role key — server-side only) ────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      await fetch(`${supabaseUrl}/rest/v1/orders`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          paystack_reference: reference,
          amount_paid: amountPaid,
          customer_email: userEmail || verifyData.data.customer?.email,
          items: cartItems,
          status: "paid",
          created_at: new Date().toISOString(),
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and order recorded.",
      amount: amountPaid,
    });
  } catch (err) {
    console.error("verify-payment error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
