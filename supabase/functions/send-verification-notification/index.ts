import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_TO_PRICE: Record<string, string> = {
  bronze: "price_1SySzrHHbW88ITTRv8CLOQMs",
  silver: "price_1SyT13HHbW88ITTRuDJQTJJ6",
  gold: "price_1SyT1VHHbW88ITTRRqYBczBx",
  platinum: "price_1SyT2THHbW88ITTRNnrQzu1f",
};

const PRODUCT_TO_TIER: Record<string, string> = {
  prod_TwLhJtew7Uj5Js: "bronze",
  prod_TwLiMWaoBRqYCN: "silver",
  prod_TwLiwjTCCRWWEv: "gold",
  prod_TwLjezgrOf7FKj: "platinum",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[stripe] STRIPE_SECRET_KEY is not set");
      return json(500, { error: "STRIPE_SECRET_KEY is not set" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[stripe] No auth header");
      return json(401, { error: "Unauthorized" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.email) {
      console.error("[stripe] User not authenticated", userError);
      return json(401, { error: "Not authenticated" });
    }

    console.log("[stripe] User authenticated:", userData.user.email);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    console.log("[stripe] Action:", action);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "";

    // ========== CREATE CHECKOUT ==========
    if (action === "create-checkout") {
      const tier = body.tier as string;
      if (!tier || !TIER_TO_PRICE[tier]) {
        console.error("[stripe] Invalid tier:", tier);
        return json(400, { error: "Invalid tier" });
      }
      if (!origin) {
        console.error("[stripe] Missing Origin header");
        return json(400, { error: "Missing Origin header" });
      }

      console.log("[stripe] Creating checkout for tier:", tier);

      const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
      const customerId = customers.data[0]?.id;

      console.log("[stripe] Customer ID:", customerId || "new customer");

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        customer_email: customerId ? undefined : userData.user.email,
        line_items: [{ price: TIER_TO_PRICE[tier], quantity: 1 }],
        success_url: `${origin}/upgrades?success=true&tier=${encodeURIComponent(tier)}`,
        cancel_url: `${origin}/upgrades?canceled=true`,
        client_reference_id: userData.user.id,
        allow_promotion_codes: true,
      });

      console.log("[stripe] Checkout session created:", session.id);

      return json(200, { url: session.url });
    }

    // ========== CHECK SUBSCRIPTION ==========
    if (action === "check-subscription") {
      console.log("[stripe] Checking subscription for:", userData.user.email);

      const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
      const customerId = customers.data[0]?.id;

      if (!customerId) {
        console.log("[stripe] No customer found");
        return json(200, { subscribed: false, tier: null, subscription_end: null });
      }

      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 10,
      });

      const active = subs.data[0];
      if (!active) {
        console.log("[stripe] No active subscription");
        return json(200, { subscribed: false, tier: null, subscription_end: null });
      }

      const productId = String(active.items.data[0]?.price.product ?? "");
      const tier = PRODUCT_TO_TIER[productId] ?? null;
      const subscriptionEnd = new Date(active.current_period_end * 1000).toISOString();

      console.log("[stripe] Active subscription:", tier, subscriptionEnd);

      return json(200, {
        subscribed: true,
        tier,
        product_id: productId,
        subscription_end: subscriptionEnd,
      });
    }

    // ========== CUSTOMER PORTAL ==========
    if (action === "customer-portal") {
      if (!origin) {
        console.error("[stripe] Missing Origin header for portal");
        return json(400, { error: "Missing Origin header" });
      }

      console.log("[stripe] Creating customer portal for:", userData.user.email);

      const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
      const customerId = customers.data[0]?.id;
      if (!customerId) {
        console.error("[stripe] No customer found for portal");
        return json(400, { error: "No Stripe customer found for this user" });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/upgrades`,
      });

      console.log("[stripe] Portal session created:", portalSession.id);

      return json(200, { url: portalSession.url });
    }

    console.error("[stripe] Unknown action:", action);
    return json(400, { error: "Unknown action" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[stripe] Error:", message);
    return json(500, { error: message });
  }
});
