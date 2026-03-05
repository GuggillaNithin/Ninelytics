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

// Instagram Graph API uses Facebook's OAuth endpoint
const REDIRECT_URI_BASE = `${SUPABASE_URL}/functions/v1/auth-instagram`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ── Step 1: Initiate OAuth ──
    if (action === "initiate") {
      // Verify the user is authenticated
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

      // Build Instagram OAuth URL
      // Instagram Business accounts use Facebook Login
      const scopes = [
        "instagram_basic",
        "instagram_manage_insights",
        "pages_show_list",
        "pages_read_engagement",
      ].join(",");

      const state = btoa(JSON.stringify({ user_id: user.id }));

      const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
      authUrl.searchParams.set("client_id", INSTAGRAM_APP_ID);
      authUrl.searchParams.set("redirect_uri", `${REDIRECT_URI_BASE}?action=callback`);
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("response_type", "code");

      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 2: Handle OAuth Callback ──
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      const errorParam = url.searchParams.get("error");

      if (errorParam) {
        const errorDesc = url.searchParams.get("error_description") || "OAuth denied";
        return Response.redirect(
          `${url.origin.replace("dbgxuneppeupwfcrsbli.supabase.co", "unified-metrics-flow.lovable.app")}/dashboard/connections?error=${encodeURIComponent(errorDesc)}`,
          302,
        );
      }

      if (!code || !stateParam) {
        return new Response(JSON.stringify({ error: "Missing code or state" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Decode state to get user_id
      const { user_id } = JSON.parse(atob(stateParam));

      // Exchange code for access token
      const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
      tokenUrl.searchParams.set("client_id", INSTAGRAM_APP_ID);
      tokenUrl.searchParams.set("redirect_uri", `${REDIRECT_URI_BASE}?action=callback`);
      tokenUrl.searchParams.set("client_secret", INSTAGRAM_APP_SECRET);
      tokenUrl.searchParams.set("code", code);

      const tokenRes = await fetch(tokenUrl.toString());
      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        console.error("Token exchange error:", tokenData.error);
        return Response.redirect(
          `${url.origin.replace("dbgxuneppeupwfcrsbli.supabase.co", "unified-metrics-flow.lovable.app")}/dashboard/connections?error=${encodeURIComponent(tokenData.error.message || "Token exchange failed")}`,
          302,
        );
      }

      const shortLivedToken = tokenData.access_token;

      // Exchange for long-lived token
      const longLivedUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
      longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
      longLivedUrl.searchParams.set("client_id", INSTAGRAM_APP_ID);
      longLivedUrl.searchParams.set("client_secret", INSTAGRAM_APP_SECRET);
      longLivedUrl.searchParams.set("fb_exchange_token", shortLivedToken);

      const longLivedRes = await fetch(longLivedUrl.toString());
      const longLivedData = await longLivedRes.json();

      const accessToken = longLivedData.access_token || shortLivedToken;
      const expiresIn = longLivedData.expires_in || 5184000; // ~60 days default

      // Get Instagram Business Account ID via Facebook Pages
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`,
      );
      const pagesData = await pagesRes.json();

      let igUserId = null;
      let igUsername = null;

      if (pagesData.data && pagesData.data.length > 0) {
        // Get the Instagram Business Account linked to the first page
        const pageId = pagesData.data[0].id;
        const igRes = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`,
        );
        const igData = await igRes.json();

        if (igData.instagram_business_account) {
          igUserId = igData.instagram_business_account.id;

          // Get Instagram username
          const igProfileRes = await fetch(
            `https://graph.facebook.com/v19.0/${igUserId}?fields=username&access_token=${accessToken}`,
          );
          const igProfile = await igProfileRes.json();
          igUsername = igProfile.username || null;
        }
      }

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
      const appOrigin = url.origin.replace(
        "dbgxuneppeupwfcrsbli.supabase.co",
        "unified-metrics-flow.lovable.app",
      );
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
