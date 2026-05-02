import { fetchLinkedInProfile } from "../_shared/linkedin.ts";
import {
  corsHeaders,
  createServiceClient,
  getAuthenticatedUser,
  jsonResponse,
} from "../_shared/supabase.ts";

const LINKEDIN_CLIENT_ID = Deno.env.get("LINKEDIN_CLIENT_ID")!;
const LINKEDIN_CLIENT_SECRET = Deno.env.get("LINKEDIN_CLIENT_SECRET")!;
const SUPABASE_URL = "https://arlnboevgndtpnprolhz.supabase.co";

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/auth-linkedin?action=callback`;
const DEFAULT_APP_REDIRECT = "https://ninelytics.vercel.app/dashboard/connections";

function normalizeRedirectUrl(value: string | null | undefined) {
  const candidate = (value || DEFAULT_APP_REDIRECT).trim();
  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  return `https://${candidate}`;
}

const APP_REDIRECT = normalizeRedirectUrl(Deno.env.get("LINKEDIN_APP_REDIRECT"));

function buildAppRedirectFromRequest(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && /^https?:\/\//i.test(origin)) {
    return `${origin.replace(/\/$/, "")}/dashboard/connections`;
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return `${refererUrl.origin}/dashboard/connections`;
    } catch {
      // Fall back to configured redirect when referer is not a valid URL.
    }
  }

  return APP_REDIRECT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !SUPABASE_URL) {
      return jsonResponse({ error: "LinkedIn OAuth is not configured correctly on the server" }, 500);
    }

    if (action === "initiate") {
      const { user, response } = await getAuthenticatedUser(req);
      if (response || !user) {
        return response!;
      }

      const callbackRedirect = buildAppRedirectFromRequest(req);
      const scopes = ["openid", "profile"].join(" ");
      const state = btoa(
        JSON.stringify({
          user_id: user.id,
          timestamp: Date.now(),
          app_redirect: callbackRedirect,
        }),
      );

      const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", LINKEDIN_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("state", state);

      console.log("LinkedIn OAuth initiate", {
        scopes,
        redirectUri: REDIRECT_URI,
        callbackRedirect,
        authUrl: authUrl.toString(),
      });

      return jsonResponse({ url: authUrl.toString() });
    }

    if (action === "callback") {
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      const errorParam = url.searchParams.get("error");
      let callbackRedirect = APP_REDIRECT;

      if (stateParam) {
        try {
          const parsed = JSON.parse(atob(stateParam));
          if (parsed.app_redirect && /^https?:\/\//i.test(parsed.app_redirect)) {
            callbackRedirect = parsed.app_redirect;
          }
        } catch {
          // Ignore state parse failures here; they are handled below.
        }
      }

      if (errorParam) {
        const errorDesc = url.searchParams.get("error_description") || "OAuth denied";
        console.error("LinkedIn OAuth Error:", errorParam, errorDesc);
        return Response.redirect(`${callbackRedirect}?error=${encodeURIComponent(errorDesc)}`, 302);
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
        if (parsed.app_redirect && /^https?:\/\//i.test(parsed.app_redirect)) {
          callbackRedirect = parsed.app_redirect;
        }
      } catch {
        return Response.redirect(
          `${APP_REDIRECT}?error=${encodeURIComponent("Invalid state parameter")}`,
          302,
        );
      }

      const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
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

      const tokenData = await tokenResponse.json();
      console.log("LinkedIn token exchange response", {
        ok: tokenResponse.ok,
        status: tokenResponse.status,
        redirectUri: REDIRECT_URI,
        tokenData,
      });
      if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
        console.error("LinkedIn token exchange failed", {
          status: tokenResponse.status,
          tokenData,
        });
        const message = tokenData.error_description || tokenData.error || "Token exchange failed";
        return Response.redirect(`${callbackRedirect}?error=${encodeURIComponent(message)}`, 302);
      }

      const accessToken = tokenData.access_token as string;
      const expiresIn = Number(tokenData.expires_in || 0);
      const expiresAt =
        expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

      let linkedinProfile;
      try {
        linkedinProfile = await fetchLinkedInProfile(accessToken);
      } catch (profileError) {
        console.warn("LinkedIn profile fetch failed after token exchange", profileError);
        linkedinProfile = {
          id: "",
          name: "LinkedIn User",
        };
      }
      const supabase = createServiceClient();

      const { error } = await supabase.from("social_accounts").upsert(
        {
          user_id: userId,
          platform: "linkedin",
          access_token: accessToken,
          refresh_token: null,
          expires_at: expiresAt,
          platform_user_id: linkedinProfile.id || null,
          platform_username: linkedinProfile.name,
          selected_org_id: null,
          selected_org_name: null,
        },
        { onConflict: "user_id,platform" },
      );

      if (error) {
        console.error("Failed to store LinkedIn account:", error);
        return Response.redirect(
          `${callbackRedirect}?error=${encodeURIComponent("Failed to save connection")}`,
          302,
        );
      }

      return Response.redirect(`${callbackRedirect}?connected=LinkedIn`, 302);
    }

    if (action === "disconnect") {
      const { user, response } = await getAuthenticatedUser(req);
      if (response || !user) {
        return response!;
      }

      const supabase = createServiceClient();
      const { error } = await supabase
        .from("social_accounts")
        .delete()
        .eq("user_id", user.id)
        .eq("platform", "linkedin");

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (error: any) {
    console.error("LinkedIn auth error:", error);
    return jsonResponse({ error: error.message || "Unexpected error" }, 500);
  }
});
