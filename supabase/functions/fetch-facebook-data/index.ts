import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwtToken = authHeader.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwtToken);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: account, error: accError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "facebook")
      .single();

    if (accError || !account) {
      return new Response(JSON.stringify({ error: "Facebook not connected" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = account.access_token;
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Token missing. Please reconnect Facebook." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pageId = account.platform_user_id;
    if (!pageId) {
      return new Response(JSON.stringify({ error: "No Facebook Page linked. Please reconnect." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reqUrl = new URL(req.url);
    const days = parseInt(reqUrl.searchParams.get("days") || "30");
    const since = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
    const until = Math.floor(Date.now() / 1000);

    // Fetch page info
    const pageRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=name,fan_count,followers_count,picture.type(large)&access_token=${accessToken}`
    );
    const pageInfo = await pageRes.json();

    if (pageInfo.error) {
      console.error("Page info error:", pageInfo.error);
      return new Response(JSON.stringify({ error: pageInfo.error.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch page insights (daily)
    const insightsMetrics = "page_impressions,page_engaged_users,page_post_engagements,page_fan_adds";
    const insightsRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/insights?metric=${insightsMetrics}&period=day&since=${since}&until=${until}&access_token=${accessToken}`
    );
    const insightsData = await insightsRes.json();

    // Parse insights into daily data and totals
    const dailyMap: Record<string, any> = {};
    const totals: Record<string, number> = {
      page_impressions: 0,
      page_engaged_users: 0,
      page_post_engagements: 0,
      page_fan_adds: 0,
    };

    if (insightsData.data) {
      for (const metric of insightsData.data) {
        const metricName = metric.name;
        for (const v of metric.values || []) {
          const date = v.end_time?.split("T")[0];
          if (!date) continue;
          if (!dailyMap[date]) dailyMap[date] = { date };
          dailyMap[date][metricName] = v.value || 0;
          if (totals[metricName] !== undefined) {
            totals[metricName] += v.value || 0;
          }
        }
      }
    }

    const dailyMetrics = Object.values(dailyMap).sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    );

    // Fetch recent posts
    const postsRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,created_time,shares,likes.summary(true),comments.summary(true)&limit=25&access_token=${accessToken}`
    );
    const postsData = await postsRes.json();

    const posts = (postsData.data || []).map((p: any) => ({
      id: p.id,
      message: p.message || "",
      created_time: p.created_time,
      likes: p.likes?.summary?.total_count || 0,
      comments: p.comments?.summary?.total_count || 0,
      shares: p.shares?.count || 0,
    }));

    const totalLikes = posts.reduce((s: number, p: any) => s + p.likes, 0);
    const totalComments = posts.reduce((s: number, p: any) => s + p.comments, 0);
    const totalShares = posts.reduce((s: number, p: any) => s + p.shares, 0);

    // Store key metrics
    const today = new Date().toISOString().split("T")[0];
    const metricsToStore = [
      { metric_name: "followers", metric_value: pageInfo.followers_count || pageInfo.fan_count || 0 },
      { metric_name: "impressions", metric_value: totals.page_impressions },
      { metric_name: "engaged_users", metric_value: totals.page_engaged_users },
      { metric_name: "post_engagements", metric_value: totals.page_post_engagements },
    ];

    for (const m of metricsToStore) {
      await supabase.from("analytics_data").upsert(
        { user_id: user.id, platform: "facebook", date: today, metric_name: m.metric_name, metric_value: m.metric_value },
        { onConflict: "user_id,platform,date,metric_name", ignoreDuplicates: false },
      );
    }

    // Fetch historical follower data
    const { data: historyData } = await supabase
      .from("analytics_data")
      .select("date, metric_value")
      .eq("user_id", user.id)
      .eq("platform", "facebook")
      .eq("metric_name", "followers")
      .order("date", { ascending: true })
      .limit(90);

    const response = {
      page: {
        name: pageInfo.name,
        picture_url: pageInfo.picture?.data?.url || "",
        followers_count: pageInfo.followers_count || pageInfo.fan_count || 0,
      },
      totals: {
        impressions: totals.page_impressions,
        engaged_users: totals.page_engaged_users,
        post_engagements: totals.page_post_engagements,
        new_fans: totals.page_fan_adds,
        total_likes: totalLikes,
        total_comments: totalComments,
        total_shares: totalShares,
      },
      daily_metrics: dailyMetrics,
      posts,
      followers_history: historyData || [],
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Fetch Facebook data error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
