import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Membership tiers (subscriptions)
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

// Daily rewards per tier
const TIER_DAILY_REWARDS: Record<string, { coins: number; cash: number }> = {
  bronze: { coins: 15, cash: 0 },
  silver: { coins: 35, cash: 1 },
  gold: { coins: 60, cash: 3 },
  platinum: { coins: 100, cash: 5 },
};

// Achievement IDs per tier
const TIER_ACHIEVEMENTS: Record<string, string> = {
  bronze: "cb5dbce9-ebd6-453c-8889-851ed2618a3b",
  silver: "80998a60-a2eb-4e58-95db-d609a8d1d59c",
  gold: "b5bb330b-6e53-4253-9e7f-c9a6e578c302",
  platinum: "18eb532f-7dbe-4a05-9cc9-6c12a7472e87",
};

// Currency packs (one-time payments)
const CURRENCY_PACK_TO_PRICE: Record<string, string> = {
  coins_500: "price_1SyfiZHHbW88ITTRXMAAjpR3",
  coins_1000: "price_1SyfiiHHbW88ITTRUKURYCXL",
  coins_2500: "price_1SyfiiHHbW88ITTRlzeUtqof",
  coins_5000: "price_1SyfijHHbW88ITTRGQw52bhW",
  cash_50: "price_1SyfikHHbW88ITTR9TxbpxIS",
  cash_100: "price_1SyfilHHbW88ITTRvYKbJhAl",
  cash_250: "price_1SyfimHHbW88ITTRsR9aVmfk",
  cash_500: "price_1SyfinHHbW88ITTRmU9PLm5l",
};

// Amount to award for each pack (including bonuses)
const CURRENCY_PACK_AMOUNTS: Record<string, { type: "coins" | "cash"; amount: number }> = {
  coins_500: { type: "coins", amount: 500 },
  coins_1000: { type: "coins", amount: 1100 }, // 1000 + 100 bonus
  coins_2500: { type: "coins", amount: 3000 }, // 2500 + 500 bonus
  coins_5000: { type: "coins", amount: 6500 }, // 5000 + 1500 bonus
  cash_50: { type: "cash", amount: 50 },
  cash_100: { type: "cash", amount: 110 }, // 100 + 10 bonus
  cash_250: { type: "cash", amount: 300 }, // 250 + 50 bonus
  cash_500: { type: "cash", amount: 650 }, // 500 + 150 bonus
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Client for user authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    // Admin client for database updates
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
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

    // ========== CREATE CHECKOUT (Membership Subscription) ==========
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
        success_url: `${origin}/upgrades?success=true&tier=${encodeURIComponent(tier)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/upgrades?canceled=true`,
        client_reference_id: userData.user.id,
        allow_promotion_codes: true,
      });

      console.log("[stripe] Checkout session created:", session.id);

      return json(200, { url: session.url });
    }

    // ========== CREATE CURRENCY CHECKOUT (One-time Payment) ==========
    if (action === "create-currency-checkout") {
      const packId = body.packId as string;
      if (!packId || !CURRENCY_PACK_TO_PRICE[packId]) {
        console.error("[stripe] Invalid pack ID:", packId);
        return json(400, { error: "Invalid currency pack" });
      }
      if (!origin) {
        console.error("[stripe] Missing Origin header");
        return json(400, { error: "Missing Origin header" });
      }

      console.log("[stripe] Creating currency checkout for pack:", packId);

      const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
      const customerId = customers.data[0]?.id;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        customer_email: customerId ? undefined : userData.user.email,
        line_items: [{ price: CURRENCY_PACK_TO_PRICE[packId], quantity: 1 }],
        success_url: `${origin}/upgrades?currency_success=true&pack=${encodeURIComponent(packId)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/upgrades?canceled=true`,
        client_reference_id: userData.user.id,
      });

      console.log("[stripe] Currency checkout session created:", session.id);

      return json(200, { url: session.url });
    }

    // ========== FULFILL CURRENCY PURCHASE ==========
    if (action === "fulfill-currency") {
      const sessionId = body.sessionId as string;
      const packId = body.packId as string;

      if (!sessionId || !packId) {
        return json(400, { error: "Missing sessionId or packId" });
      }

      console.log("[stripe] Fulfilling currency purchase:", packId, sessionId);

      // Verify the session is paid
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== "paid") {
        console.error("[stripe] Payment not completed:", session.payment_status);
        return json(400, { error: "Payment not completed" });
      }

      // Check if already fulfilled (prevent double-spending)
      const { data: existing } = await supabaseAdmin
        .from("currency_purchases")
        .select("id")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (existing) {
        console.log("[stripe] Already fulfilled:", sessionId);
        return json(200, { success: true, already_fulfilled: true });
      }

      // Get the forum user
      const { data: forumUser, error: fuError } = await supabaseAdmin
        .from("forum_users")
        .select("id, coins, cash")
        .eq("user_id", userData.user.id)
        .single();

      if (fuError || !forumUser) {
        console.error("[stripe] Forum user not found:", fuError);
        return json(400, { error: "Forum user not found" });
      }

      const packInfo = CURRENCY_PACK_AMOUNTS[packId];
      if (!packInfo) {
        return json(400, { error: "Invalid pack" });
      }

      // Award the currency
      const updateData = packInfo.type === "coins"
        ? { coins: forumUser.coins + packInfo.amount }
        : { cash: forumUser.cash + packInfo.amount };

      const { error: updateError } = await supabaseAdmin
        .from("forum_users")
        .update(updateData)
        .eq("id", forumUser.id);

      if (updateError) {
        console.error("[stripe] Failed to update currency:", updateError);
        return json(500, { error: "Failed to award currency" });
      }

      // Record the purchase to prevent double-fulfillment
      await supabaseAdmin.from("currency_purchases").insert({
        forum_user_id: forumUser.id,
        stripe_session_id: sessionId,
        pack_id: packId,
        currency_type: packInfo.type,
        amount: packInfo.amount,
      });

      console.log("[stripe] Currency awarded:", packInfo.type, packInfo.amount);

      return json(200, { success: true, type: packInfo.type, amount: packInfo.amount });
    }

    // ========== FULFILL MEMBERSHIP ==========
    if (action === "fulfill-membership") {
      const sessionId = body.sessionId as string;
      const tier = body.tier as string;

      if (!sessionId || !tier) {
        return json(400, { error: "Missing sessionId or tier" });
      }

      console.log("[stripe] Fulfilling membership:", tier, sessionId);

      // Verify the session
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.status !== "complete") {
        console.error("[stripe] Session not complete:", session.status);
        return json(400, { error: "Session not complete" });
      }

      // Get the forum user
      const { data: forumUser, error: fuError } = await supabaseAdmin
        .from("forum_users")
        .select("id, coins, cash, membership_tier")
        .eq("user_id", userData.user.id)
        .single();

      if (fuError || !forumUser) {
        console.error("[stripe] Forum user not found:", fuError);
        return json(400, { error: "Forum user not found" });
      }

      // Check if already on this tier (prevent double rewards)
      if (forumUser.membership_tier === tier) {
        console.log("[stripe] Already on this tier:", tier);
        return json(200, { success: true, already_active: true });
      }

      // Get daily rewards for this tier
      const rewards = TIER_DAILY_REWARDS[tier] || { coins: 0, cash: 0 };

      // Update membership and award first day's currency
      const { error: updateError } = await supabaseAdmin
        .from("forum_users")
        .update({
          membership_tier: tier,
          coins: forumUser.coins + rewards.coins,
          cash: forumUser.cash + rewards.cash,
        })
        .eq("id", forumUser.id);

      if (updateError) {
        console.error("[stripe] Failed to update membership:", updateError);
        return json(500, { error: "Failed to update membership" });
      }

      // Award tier achievement
      const achievementId = TIER_ACHIEVEMENTS[tier];
      if (achievementId) {
        // Check if user already has this achievement
        const { data: existingAchievement } = await supabaseAdmin
          .from("forum_user_achievements")
          .select("id")
          .eq("forum_user_id", forumUser.id)
          .eq("achievement_id", achievementId)
          .maybeSingle();

        if (!existingAchievement) {
          await supabaseAdmin.from("forum_user_achievements").insert({
            forum_user_id: forumUser.id,
            achievement_id: achievementId,
          });
          console.log("[stripe] Achievement awarded:", tier);
        }
      }

      console.log("[stripe] Membership activated:", tier, "Awarded:", rewards);

      return json(200, { success: true, tier, coins_awarded: rewards.coins, cash_awarded: rewards.cash });
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
