import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const allowedOrigins = [
  "https://aihub-jet.vercel.app",
];

const getCorsHeaders = (origin: string | null) => {
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": 
      "authorization, x-client-info, apikey, content-type",
  };
};

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://orcnkyuwwkfdgvktunkd.supabase.co";
  // Prefer a service role key for server-side operations. Fall back to ANON if not available.
  // IMPORTANT: do not hardcode keys in source. Ensure SUPABASE_SERVICE_ROLE_KEY or ANON_KEY
  // are set in the environment where this function runs (Supabase Dashboard secrets).
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("ANON_KEY") || "";

  if (!supabaseKey) {
    console.error("Missing Supabase key in environment (SUPABASE_SERVICE_ROLE_KEY or ANON_KEY)");
    return new Response(JSON.stringify({ error: "Configuration error: missing Supabase key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !data.user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const user = data.user;

    if (!user?.email) throw new Error("Użytkownik niezalogowany");

    const { priceId, courseId } = await req.json();
    
    // Validate required parameters
    if (!priceId || !courseId) {
      throw new Error("Brak wymaganych parametrów");
    }

    // Validate courseId format (UUID)
    if (!uuidRegex.test(courseId)) {
      throw new Error("Nieprawidłowy format ID kursu");
    }

    // Verify course exists and is published
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('id, is_published, stripe_price_id, title')
      .eq('id', courseId)
      .eq('is_published', true)
      .maybeSingle();

    if (courseError) {
      console.error("Database error:", courseError.message);
      throw new Error("Błąd weryfikacji kursu");
    }

    if (!course) {
      throw new Error("Kurs nie istnieje lub nie jest dostępny");
    }

    // Verify priceId matches the course's stripe_price_id (if set)
    if (course.stripe_price_id && course.stripe_price_id !== priceId) {
      throw new Error("Nieprawidłowy identyfikator ceny dla tego kursu");
    }

    // Check if user already has access
    const { data: existingAccess } = await supabaseClient
      .from('user_course_access')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existingAccess) {
      throw new Error("Masz już dostęp do tego kursu");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.nocreate({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin || allowedOrigins[0]}/course/${courseId}?success=true`,
      cancel_url: `${origin || allowedOrigins[0]}/course/${courseId}`,
      metadata: {
        userId: user.id,
        courseId: courseId,
      },
    });

    console.log("Checkout session created for course:", course.title);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});