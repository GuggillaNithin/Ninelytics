import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LINKEDIN_CLIENT_ID = Deno.env.get("LINKEDIN_CLIENT_ID")!;
const LINKEDIN_CLIENT_SECRET = Deno.env.get("LINKEDIN_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/auth-linkedin?action=callback`;
const APP_REDIRECT = "https://ninelytics.vercel.app/dashboard/connections";

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

      // Use OpenID Connect scopes + organization scopes
      const scopes = [
        "openid profile email r_organization_social rw_organization_admin"
      ].join(" ");

      const state = btoa(JSON.stringify({ user_id: user.id }));

      const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", LINKEDIN_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("state", state);

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
          `${APP_REDIRECT}?error=${encodeURIComponent(errorDesc)}`,
          302,
        );
      }

      if (!code || !stateParam) {
        return Response.redirect(
          `${APP_REDIRECT}?error=${encodeURIComponent("Missing code or state")}`,
          302,
        );
      }

      let userId: string;
      try {
        const parsed = JSON.parse(atob(stateParam));
        userId = parsed.user_id;
      } catch {
        return Response.redirect(
          `${APP_REDIRECT}?error=${encodeURIComponent("Invalid state parameter")}`,
          302,
        );
      }

      // Exchange code for access token
      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        }).toString(),
      });

      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        console.error("Token exchange error:", tokenData);
        return Response.redirect(
          `${APP_REDIRECT}?error=${encodeURIComponent(tokenData.error_description || "Token exchange failed")}`,
          302,
        );
      }

      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in || 5184000;
      const refreshToken = tokenData.refresh_token || null;

      // Get user profile using userinfo endpoint (OpenID Connect)
      let linkedinUserId = "";
      let displayName = "LinkedIn User";

      try {
        const userinfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userinfoRes.ok) {
          const userinfo = await userinfoRes.json();
          linkedinUserId = userinfo.sub || "";
          displayName = userinfo.name || `${userinfo.given_name || ""} ${userinfo.family_name || ""}`.trim() || "LinkedIn User";
        }
      } catch (e) {
        console.warn("Could not fetch userinfo, falling back to /v2/me:", e);
        // Fallback to legacy endpoint
        try {
          const profileRes = await fetch("https://api.linkedin.com/v2/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            linkedinUserId = profileData.id || "";
            displayName = `${profileData.localizedFirstName || ""} ${profileData.localizedLastName || ""}`.trim() || "LinkedIn User";
          }
        } catch (e2) {
          console.warn("Could not fetch /v2/me either:", e2);
        }
      }

      // Try to get organizations the user administers
      let orgId: string | null = null;
      let orgName = displayName;

      try {
        const orgRes = await fetch(
          `https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget))`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          if (orgData.elements && orgData.elements.length > 0) {
            const orgUrn = orgData.elements[0].organizationalTarget;
            orgId = orgUrn.split(":").pop() || null;

            // Fetch org name
            if (orgId) {
              try {
                const orgDetailRes = await fetch(
                  `https://api.linkedin.com/v2/organizations/${orgId}`,
                  { headers: { Authorization: `Bearer ${accessToken}` } },
                );
                if (orgDetailRes.ok) {
                  const orgDetail = await orgDetailRes.json();
                  orgName = orgDetail.localizedName || orgName;
                }
              } catch (e) {
                console.warn("Could not fetch org detail:", e);
              }
            }
          }
        }
      } catch (orgErr) {
        console.warn("Could not fetch org data:", orgErr);
      }

      // Store in database
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      const { error: dbError } = await supabase
        .from("social_accounts")
        .upsert(
          {
            user_id: userId,
            platform: "linkedin",
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
            platform_user_id: orgId || linkedinUserId,
            platform_username: orgName,
          },
          { onConflict: "user_id,platform" },
        );

      if (dbError) {
        console.error("DB upsert error:", dbError);
        return Response.redirect(
          `${APP_REDIRECT}?error=${encodeURIComponent("Failed to save connection")}`,
          302,
        );
      }

      return Response.redirect(`${APP_REDIRECT}?connected=LinkedIn`, 302);
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
        .eq("platform", "linkedin");

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
