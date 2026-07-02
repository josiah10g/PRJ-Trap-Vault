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
  return NextResponse.json(
    { error: "Payment verification is temporarily disabled." },
    { status: 503 }
  );
}
