import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });
    const data = await res.json();
    if (data.access_token) return { access_token: data.access_token, expires_in: data.expires_in || 3600 };
    return null;
  } catch {
    return null;
  }
}

async function getValidToken(supabase: any, userId: string, account: any): Promise<string | null> {
  const token = account.access_token;
  if (!token) return null;

  if (account.expires_at) {
    const expiresAt = new Date(account.expires_at).getTime();
    if (expiresAt < Date.now() + 5 * 60 * 1000) {
      if (!account.refresh_token) return null;
      const refreshed = await refreshGoogleToken(account.refresh_token);
      if (!refreshed) return null;
      await supabase
        .from("social_accounts")
        .update({
          access_token: refreshed.access_token,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq("user_id", userId)
        .eq("platform", "youtube");
      return refreshed.access_token;
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
      .eq("platform", "youtube")
      .single();

    if (accError || !account) {
      return new Response(JSON.stringify({ error: "YouTube not connected" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getValidToken(supabase, user.id, account);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Token expired. Please reconnect YouTube." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse date range from query
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // Fetch channel info
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&mine=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const channelData = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) {
      return new Response(JSON.stringify({ error: "No YouTube channel found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const channel = channelData.items[0];
    const stats = channel.statistics;
    const snippet = channel.snippet;

    // Fetch analytics data over time
    const analyticsRes = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startStr}&endDate=${endStr}&metrics=views,estimatedMinutesWatched,subscribersGained,subscribersLost,likes,comments&dimensions=day&sort=day`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const analyticsData = await analyticsRes.json();

    const dailyMetrics = (analyticsData.rows || []).map((row: any[]) => ({
      date: row[0],
      views: row[1],
      watchTimeMinutes: row[2],
      subscribersGained: row[3],
      subscribersLost: row[4],
      likes: row[5],
      comments: row[6],
    }));

    // Fetch top videos
    const topVideosRes = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startStr}&endDate=${endStr}&metrics=views,estimatedMinutesWatched,likes,comments&dimensions=video&sort=-views&maxResults=10`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const topVideosData = await topVideosRes.json();

    let topVideos: any[] = [];
    if (topVideosData.rows && topVideosData.rows.length > 0) {
      const videoIds = topVideosData.rows.map((r: any[]) => r[0]).join(",");
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const videosInfo = await videosRes.json();
      const videoMap: Record<string, any> = {};
      (videosInfo.items || []).forEach((v: any) => { videoMap[v.id] = v.snippet; });

      topVideos = topVideosData.rows.map((r: any[]) => ({
        id: r[0],
        title: videoMap[r[0]]?.title || r[0],
        thumbnail: videoMap[r[0]]?.thumbnails?.default?.url || "",
        views: r[1],
        watchTimeMinutes: r[2],
        likes: r[3],
        comments: r[4],
      }));
    }

    // Aggregate totals from daily data
    const totals = dailyMetrics.reduce(
      (acc: any, d: any) => ({
        views: acc.views + d.views,
        watchTimeMinutes: acc.watchTimeMinutes + d.watchTimeMinutes,
        subscribersGained: acc.subscribersGained + d.subscribersGained,
        subscribersLost: acc.subscribersLost + d.subscribersLost,
        likes: acc.likes + d.likes,
        comments: acc.comments + d.comments,
      }),
      { views: 0, watchTimeMinutes: 0, subscribersGained: 0, subscribersLost: 0, likes: 0, comments: 0 },
    );

    // Store key metrics
    const today = new Date().toISOString().split("T")[0];
    const metricsToStore = [
      { metric_name: "subscribers", metric_value: parseInt(stats.subscriberCount) || 0 },
      { metric_name: "total_views", metric_value: parseInt(stats.viewCount) || 0 },
      { metric_name: "total_videos", metric_value: parseInt(stats.videoCount) || 0 },
    ];

    for (const m of metricsToStore) {
      await supabase.from("analytics_data").upsert(
        { user_id: user.id, platform: "youtube", date: today, metric_name: m.metric_name, metric_value: m.metric_value },
        { onConflict: "user_id,platform,date,metric_name", ignoreDuplicates: false },
      );
    }

    // Historical data
    const { data: historyData } = await supabase
      .from("analytics_data")
      .select("date, metric_name, metric_value")
      .eq("user_id", user.id)
      .eq("platform", "youtube")
      .in("metric_name", ["subscribers", "total_views"])
      .order("date", { ascending: true })
      .limit(180);

    const response = {
      channel: {
        title: snippet.title,
        description: snippet.description,
        thumbnail: snippet.thumbnails?.default?.url || "",
        subscriberCount: parseInt(stats.subscriberCount) || 0,
        viewCount: parseInt(stats.viewCount) || 0,
        videoCount: parseInt(stats.videoCount) || 0,
      },
      period_totals: totals,
      daily_metrics: dailyMetrics,
      top_videos: topVideos,
      history: historyData || [],
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Fetch YouTube data error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
