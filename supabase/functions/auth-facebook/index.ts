import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID")!;
const FACEBOOK_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/auth-facebook?action=callback`;
const APP_ORIGIN = "https://ninelytics.vercel.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ── Initiate OAuth ──
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

      const scopes = [
        "pages_show_list",
        "pages_read_engagement",
        "read_insights",
      ].join(",");

      const state = btoa(JSON.stringify({ user_id: user.id }));

      const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
      authUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
      authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("response_type", "code");

      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Handle Callback ──
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      const errorParam = url.searchParams.get("error");

      if (errorParam) {
        const errorDesc = url.searchParams.get("error_description") || "OAuth denied";
        return Response.redirect(
          `${APP_ORIGIN}/dashboard/connections?error=${encodeURIComponent(errorDesc)}`,
          302,
        );
      }

      if (!code || !stateParam) {
        return new Response(JSON.stringify({ error: "Missing code or state" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { user_id } = JSON.parse(atob(stateParam));

      // Exchange code for short-lived token
      const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
      tokenUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
      tokenUrl.searchParams.set("redirect_uri", REDIRECT_URI);
      tokenUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
      tokenUrl.searchParams.set("code", code);

      const tokenRes = await fetch(tokenUrl.toString());
      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        console.error("Token exchange error:", tokenData.error);
        return Response.redirect(
          `${APP_ORIGIN}/dashboard/connections?error=${encodeURIComponent(tokenData.error.message || "Token exchange failed")}`,
          302,
        );
      }

      const shortLivedToken = tokenData.access_token;

      // Exchange for long-lived token
      const longLivedUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
      longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
      longLivedUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
      longLivedUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
      longLivedUrl.searchParams.set("fb_exchange_token", shortLivedToken);

      const longLivedRes = await fetch(longLivedUrl.toString());
      const longLivedData = await longLivedRes.json();

      const accessToken = longLivedData.access_token || shortLivedToken;
      const expiresIn = longLivedData.expires_in || 5184000;

      // Get Facebook Pages the user manages
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`,
      );
      const pagesData = await pagesRes.json();

      let pageId = null;
      let pageName = null;
      let pageAccessToken = accessToken;

      if (pagesData.data && pagesData.data.length > 0) {
        const page = pagesData.data[0];
        pageId = page.id;
        pageName = page.name;
        pageAccessToken = page.access_token || accessToken;
      }

      // Store in database
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      const { error: dbError } = await supabase
        .from("social_accounts")
        .upsert(
          {
            user_id,
            platform: "facebook",
            access_token: pageAccessToken,
            refresh_token: null,
            expires_at: expiresAt,
            platform_user_id: pageId,
            platform_username: pageName,
          },
          { onConflict: "user_id,platform" },
        );

      if (dbError) {
        console.error("DB upsert error:", dbError);
      }

      return Response.redirect(`${APP_ORIGIN}/dashboard/connections?connected=Facebook`, 302);
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
        .eq("platform", "facebook");

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
