import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// The redirect URI must match exactly what is in the Meta App Dashboard
const REDIRECT_URI_BASE = `${SUPABASE_URL}/functions/v1/auth-instagram`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  try {
    // ── Step 1: Initiate OAuth ──
    if (action === "initiate") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = authHeader.replace("Bearer ", "");
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Using Instagram Login scopes
      const scopes = [
        "instagram_business_basic",
        "instagram_business_manage_messages",
        "instagram_business_manage_comments",
        "instagram_business_content_publish",
        "instagram_business_manage_insights"
      ].join(",");

      const state = btoa(JSON.stringify({ user_id: user.id }));

      // Strictly using Instagram API authorization URL
      const authUrl = new URL("https://api.instagram.com/oauth/authorize");
      authUrl.searchParams.set("client_id", INSTAGRAM_APP_ID);
      authUrl.searchParams.set("redirect_uri", REDIRECT_URI_BASE);
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("response_type", "code");

      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 2: Handle OAuth Callback ──
    // Instagram does not return custom query params, so we detect callback via code and state
    if (code && stateParam) {
      let finalCode = code;
      const errorParam = url.searchParams.get("error");
      
      const appOrigin = url.origin.replace(
        "arlnboevgndtpnprolhz.supabase.co", 
        "ninelytics.vercel.app"
      );

      if (errorParam) {
        const errorDesc = url.searchParams.get("error_description") || "OAuth denied";
        return Response.redirect(
          `${appOrigin}/dashboard/connections?error=${encodeURIComponent(errorDesc)}`,
          302,
        );
      }

      // Important: Instagram sometimes appends #_ to the code, which breaks the exchange
      finalCode = finalCode.replace(/#_$/, "");

      // Decode state to get user_id
      const { user_id } = JSON.parse(atob(stateParam));

      // Exchange code for short-lived access token
      const tokenFormData = new URLSearchParams();
      tokenFormData.append("client_id", INSTAGRAM_APP_ID);
      tokenFormData.append("client_secret", INSTAGRAM_APP_SECRET);
      tokenFormData.append("grant_type", "authorization_code");
      tokenFormData.append("redirect_uri", REDIRECT_URI_BASE);
      tokenFormData.append("code", finalCode);

      const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        body: tokenFormData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
      
      const tokenData = await tokenRes.json();

      if (tokenData.error_type || tokenData.error_message) {
        console.error("Token exchange error:", tokenData);
        return Response.redirect(
          `${appOrigin}/dashboard/connections?error=${encodeURIComponent(tokenData.error_message || "Token exchange failed")}`,
          302,
        );
      }

      const shortLivedToken = tokenData.access_token;
      
      // Exchange for long-lived token (Instagram API)
      const longLivedUrl = new URL("https://graph.instagram.com/access_token");
      longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
      longLivedUrl.searchParams.set("client_secret", INSTAGRAM_APP_SECRET);
      longLivedUrl.searchParams.set("access_token", shortLivedToken);

      const longLivedRes = await fetch(longLivedUrl.toString());
      const longLivedData = await longLivedRes.json();

      const accessToken = longLivedData.access_token || shortLivedToken;
      const expiresIn = longLivedData.expires_in || 5184000; // ~60 days default

      // Fetch the authenticated user's Instagram profile
      const igProfileRes = await fetch(
        `https://graph.instagram.com/v19.0/me?fields=id,username&access_token=${accessToken}`
      );
      const igProfile = await igProfileRes.json();

      const igUserId = igProfile.id || tokenData.user_id;
      const igUsername = igProfile.username || null;

      // Store in Supabase
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      // Upsert: update if already exists for this user + platform
      const { error: dbError } = await supabase
        .from("social_accounts")
        .upsert(
          {
            user_id,
            platform: "instagram",
            access_token: accessToken,
            refresh_token: null, 
            expires_at: expiresAt,
            platform_user_id: igUserId,
            platform_username: igUsername,
          },
          { onConflict: "user_id,platform" },
        );

      if (dbError) {
        console.error("DB upsert error:", dbError);
      }

      // Redirect back to dashboard
      return Response.redirect(`${appOrigin}/dashboard/connections?connected=instagram`, 302);
    }

    // ── Disconnect ──
    if (action === "disconnect") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = authHeader.replace("Bearer ", "");
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: delError } = await supabase
        .from("social_accounts")
        .delete()
        .eq("user_id", user.id)
        .eq("platform", "instagram");

      if (delError) {
        return new Response(JSON.stringify({ error: delError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
