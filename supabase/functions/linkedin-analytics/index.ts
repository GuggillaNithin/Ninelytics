import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) throw new Error("Invalid token");

    // 1. Get stored LinkedIn account
    const { data: account, error: accError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "linkedin")
      .maybeSingle();

    // Use maybeSingle or just check data
    if (accError || !account) {
      return new Response(JSON.stringify({ error: "LinkedIn account not connected" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Prepare variables
    const accessToken = account.access_token;
    const orgId = account.platform_user_id;
    const orgUrn = `urn:li:organization:${orgId}`;
    const days = parseInt(new URL(req.url).searchParams.get("days") || "30");

    const endDate = Date.now();
    const startDate = endDate - (days * 24 * 60 * 60 * 1000);

    // 📡 LINKEDIN API CALLS

    // 👥 Followers Count
    const followersRes = await fetch(
      `https://api.linkedin.com/v2/networkSizes/${orgUrn}?edgeType=CompanyFollowedByMember`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const followersData = await followersRes.json();
    const followerCount = followersData.firstDegreeSize || 0;

    // 📊 Organization Share Statistics (Daily Aggregation)
    // Using organizationalEntityShareStatistics for daily time series
    const statsRes = await fetch(
      `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${startDate}&timeIntervals.timeRange.end=${endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const statsData = await statsRes.json();

    // 📊 Organization Page Statistics (Page Views)
    const pageStatsRes = await fetch(
      `https://api.linkedin.com/v2/organizationPageStatistics?q=organization&organization=${orgUrn}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${startDate}&timeIntervals.timeRange.end=${endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const pageStatsData = await pageStatsRes.json();

    // Aggregating daily metrics
    const dailyMap = new Map();
    
    // Process stats (likes, comments, shares)
    (statsData.elements || []).forEach((el: any) => {
      const date = new Date(el.timeRange.start).toISOString().split("T")[0];
      const metrics = el.totalShareStatistics;
      dailyMap.set(date, {
        date,
        likes: metrics.likeCount || 0,
        comments: metrics.commentCount || 0,
        shares: metrics.shareCount || 0,
        pageViews: 0,
      });
    });

    // Process page stats (views)
    (pageStatsData.elements || []).forEach((el: any) => {
      const date = new Date(el.timeRange.start).toISOString().split("T")[0];
      const current = dailyMap.get(date) || { date, likes: 0, comments: 0, shares: 0, pageViews: 0 };
      current.pageViews = (el.totalPageStatistics?.views?.allPageViews || 0);
      dailyMap.set(date, current);
    });

    const finalDailyMetrics = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 📝 Fetch Posts
    const sharesRes = await fetch(
      `https://api.linkedin.com/v2/shares?q=owners&owners=${orgUrn}&count=10`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const sharesData = await sharesRes.json();

    const posts = await Promise.all((sharesData.elements || []).map(async (s: any) => {
      // ❤️ Engagement per Post
      const actionRes = await fetch(
        `https://api.linkedin.com/v2/socialActions/${s.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const actionData = actionRes.ok ? await actionRes.json() : {};

      return {
        id: s.id,
        text: s.text?.text || s.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text || "",
        created_time: new Date(s.created.time).toISOString(),
        engagement: {
          likes: actionData.likesSummary?.totalLikes || 0,
          comments: actionData.commentsSummary?.totalComments || 0,
          shares: actionData.sharesSummary?.totalShares || 0,
        }
      };
    }));

    // Calculate totals for KPI cards
    const totals = finalDailyMetrics.reduce((acc, d) => ({
      likes: acc.likes + d.likes,
      comments: acc.comments + d.comments,
      shares: acc.shares + d.shares,
      pageViews: acc.pageViews + d.pageViews,
    }), { likes: 0, comments: 0, shares: 0, pageViews: 0 });

    const response = {
      organization: {
        name: account.platform_user_name || "LinkedIn Page",
        followers_count: followerCount,
        page_views: totals.pageViews
      },
      engagement: {
        likes: totals.likes,
        comments: totals.comments,
        shares: totals.shares
      },
      posts,
      daily_metrics: finalDailyMetrics
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("LinkedIn Analytics Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
