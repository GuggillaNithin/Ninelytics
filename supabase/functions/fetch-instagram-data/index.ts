import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;

async function refreshLongLivedToken(currentToken: string): Promise<{ token: string; expiresIn: number } | null> {
  try {
    const url = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", INSTAGRAM_APP_ID);
    url.searchParams.set("client_secret", INSTAGRAM_APP_SECRET);
    url.searchParams.set("fb_exchange_token", currentToken);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.access_token) {
      return { token: data.access_token, expiresIn: data.expires_in || 5184000 };
    }
    return null;
  } catch {
    return null;
  }
}

async function getValidToken(supabase: any, userId: string, account: any): Promise<string | null> {
  const token = account.access_token;
  if (!token) return null;

  // Check if token expires within 7 days
  if (account.expires_at) {
    const expiresAt = new Date(account.expires_at).getTime();
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;

    if (expiresAt < Date.now()) {
      // Token expired, try to refresh
      const refreshed = await refreshLongLivedToken(token);
      if (!refreshed) return null;

      await supabase
        .from("social_accounts")
        .update({
          access_token: refreshed.token,
          expires_at: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
        })
        .eq("user_id", userId)
        .eq("platform", "instagram");

      return refreshed.token;
    }

    if (expiresAt < sevenDaysFromNow) {
      // Proactively refresh
      const refreshed = await refreshLongLivedToken(token);
      if (refreshed) {
        await supabase
          .from("social_accounts")
          .update({
            access_token: refreshed.token,
            expires_at: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
          })
          .eq("user_id", userId)
          .eq("platform", "instagram");

        return refreshed.token;
      }
    }
  }

  return token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwtToken = authHeader.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwtToken);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's Instagram social account
    const { data: account, error: accError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "instagram")
      .single();

    if (accError || !account) {
      return new Response(JSON.stringify({ error: "Instagram not connected" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getValidToken(supabase, user.id, account);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Token expired. Please reconnect Instagram." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const igUserId = account.platform_user_id;
    if (!igUserId) {
      return new Response(JSON.stringify({ error: "No Instagram Business Account linked" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile info
    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}?fields=username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${accessToken}`
    );
    const profile = await profileRes.json();

    if (profile.error) {
      console.error("Profile fetch error:", profile.error);
      return new Response(JSON.stringify({ error: profile.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch insights (last 30 days)
    const insightsMetrics = ["reach", "impressions", "profile_views"].join(",");
    const insightsRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/insights?metric=${insightsMetrics}&period=day&since=${Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)}&until=${Math.floor(Date.now() / 1000)}&access_token=${accessToken}`
    );
    const insightsData = await insightsRes.json();

    // Aggregate insights
    const insights: Record<string, number> = { reach: 0, impressions: 0, profile_views: 0 };
    if (insightsData.data) {
      for (const metric of insightsData.data) {
        const total = metric.values?.reduce((sum: number, v: any) => sum + (v.value || 0), 0) || 0;
        insights[metric.name] = total;
      }
    }

    // Fetch recent media
    const mediaRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count&limit=25&access_token=${accessToken}`
    );
    const mediaData = await mediaRes.json();

    const posts = (mediaData.data || []).map((m: any) => ({
      id: m.id,
      caption: m.caption || "",
      media_type: m.media_type,
      media_url: m.media_url || m.thumbnail_url,
      timestamp: m.timestamp,
      likes: m.like_count || 0,
      comments: m.comments_count || 0,
    }));

    // Calculate engagement rate
    const totalEngagement = posts.reduce((sum: number, p: any) => sum + p.likes + p.comments, 0);
    const engagementRate = profile.followers_count > 0 && posts.length > 0
      ? ((totalEngagement / posts.length) / profile.followers_count * 100).toFixed(2)
      : "0";

    // Store key metrics in analytics_data for historical tracking
    const today = new Date().toISOString().split("T")[0];
    const metricsToStore = [
      { metric_name: "followers", metric_value: profile.followers_count || 0 },
      { metric_name: "reach", metric_value: insights.reach },
      { metric_name: "impressions", metric_value: insights.impressions },
      { metric_name: "profile_views", metric_value: insights.profile_views },
      { metric_name: "media_count", metric_value: profile.media_count || 0 },
    ];

    for (const m of metricsToStore) {
      await supabase.from("analytics_data").upsert(
        {
          user_id: user.id,
          platform: "instagram",
          date: today,
          metric_name: m.metric_name,
          metric_value: m.metric_value,
        },
        { onConflict: "user_id,platform,date,metric_name", ignoreDuplicates: false }
      );
    }

    // Fetch historical follower data for chart
    const { data: historyData } = await supabase
      .from("analytics_data")
      .select("date, metric_value")
      .eq("user_id", user.id)
      .eq("platform", "instagram")
      .eq("metric_name", "followers")
      .order("date", { ascending: true })
      .limit(90);

    const response = {
      profile: {
        username: profile.username,
        name: profile.name,
        profile_picture_url: profile.profile_picture_url,
        followers_count: profile.followers_count || 0,
        follows_count: profile.follows_count || 0,
        media_count: profile.media_count || 0,
      },
      insights: {
        reach: insights.reach,
        impressions: insights.impressions,
        profile_views: insights.profile_views,
        engagement_rate: parseFloat(engagementRate),
      },
      posts,
      followers_history: historyData || [],
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Fetch Instagram data error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
