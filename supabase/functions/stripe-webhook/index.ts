import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2026-01-28.clover",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Received Stripe event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId;
      const courseId = session.metadata?.courseId;
      const paymentIntentId = session.payment_intent as string;

      console.log("Processing payment:", { userId, courseId, paymentIntentId });

      if (!userId || !courseId) {
        console.error("Missing userId or courseId in session metadata");
        return new Response("Missing metadata", { status: 400 });
      }

      
      const { data: existingAccess } = await supabaseAdmin
        .from("user_course_access")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();

      if (existingAccess) {
        console.log("Access already exists for user:", userId, "course:", courseId);
        return new Response(JSON.stringify({ received: true, status: "already_exists" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }

    
      const { error } = await supabaseAdmin
        .from("user_course_access")
        .insert({
          user_id: userId,
          course_id: courseId,
          stripe_payment_id: paymentIntentId,
        });

      if (error) {
        console.error("Error granting access:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }

      console.log("Access granted successfully for user:", userId, "course:", courseId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});