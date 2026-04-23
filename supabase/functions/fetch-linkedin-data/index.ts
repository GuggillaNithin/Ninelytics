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
      .eq("platform", "linkedin")
      .single();

    if (accError || !account) {
      return new Response(JSON.stringify({ error: "LinkedIn not connected" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = account.access_token;
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Token missing. Please reconnect LinkedIn." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const now = Date.now();
    const start = now - (days * 24 * 60 * 60 * 1000);

    const orgId = account.platform_user_id;
    const orgName = account.platform_username || "LinkedIn";

    // Fetch organization info
    let orgData: any = null;
    let followerCount = 0;
    if (orgId) {
      try {
        const orgRes = await fetch(
          `https://api.linkedin.com/v2/organizations/${orgId}?projection=(localizedName,vanityName,logoV2)`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (orgRes.ok) orgData = await orgRes.json();
      } catch (e) { console.warn("Could not fetch org info:", e); }

      // Fetch current follower count
      try {
        const followerRes = await fetch(
          `https://api.linkedin.com/v2/networkSizes/urn:li:organization:${orgId}?edgeType=CompanyFollowedByMember`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (followerRes.ok) {
          const fData = await followerRes.json();
          followerCount = fData.firstDegreeSize || 0;
        }
      } catch (e) { console.warn("Could not fetch follower count:", e); }
    }

    // Fetch historical daily statistics
    let dailyMetrics: any[] = [];
    if (orgId) {
      try {
        const statsRes = await fetch(
          `https://api.linkedin.com/v2/organizationPageStatistics?q=organization&organization=urn:li:organization:${orgId}&timeIntervals=(timeGranularityType:DAY)&timeRange=(start:${start},end:${now})`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          dailyMetrics = (statsData.elements || []).map((el: any) => ({
            date: new Date(el.timeRange.start).toISOString().split("T")[0],
            pageViews: el.totalPageStatistics?.views?.allPageViews?.pageViews || 0,
            clicks: el.totalPageStatistics?.clicks?.allPageViews?.clicks || 0,
          }));
        }
      } catch (e) { console.warn("Could not fetch historical stats:", e); }
    }

    // Fetch daily engagement statistics
    let engagementMetrics: any[] = [];
    if (orgId) {
      try {
        const engRes = await fetch(
          `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}&timeIntervals=(timeGranularityType:DAY)&timeRange=(start:${start},end:${now})`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (engRes.ok) {
          const engData = await engRes.json();
          engagementMetrics = (engData.elements || []).map((el: any) => ({
            date: new Date(el.timeRange.start).toISOString().split("T")[0],
            likes: el.totalShareStatistics?.likeCount || 0,
            comments: el.totalShareStatistics?.commentCount || 0,
            shares: el.totalShareStatistics?.shareCount || 0,
          }));
        }
      } catch (e) { console.warn("Could not fetch historical engagement:", e); }
    }

    // Merge daily metrics
    const dailyData: Record<string, any> = {};
    dailyMetrics.forEach(m => {
      dailyData[m.date] = { ...m, likes: 0, comments: 0, shares: 0 };
    });
    engagementMetrics.forEach(m => {
      if (dailyData[m.date]) {
        dailyData[m.date] = { ...dailyData[m.date], ...m };
      } else {
        dailyData[m.date] = { date: m.date, pageViews: 0, clicks: 0, ...m };
      }
    });

    const finalDailyMetrics = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate totals for the period
    const totals = finalDailyMetrics.reduce((acc, d) => ({
      likes: acc.likes + d.likes,
      comments: acc.comments + d.comments,
      shares: acc.shares + d.shares,
      pageViews: acc.pageViews + d.pageViews,
    }), { likes: 0, comments: 0, shares: 0, pageViews: 0 });

    // Fetch recent posts
    let posts: any[] = [];
    if (orgId) {
      try {
        const sharesRes = await fetch(
          `https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:organization:${orgId}&count=10&sortBy=LAST_MODIFIED`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (sharesRes.ok) {
          const sharesData = await sharesRes.json();
          posts = (sharesData.elements || []).map((s: any) => ({
            id: s.id,
            text: s.text?.text || s.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text || "",
            created_time: s.created?.time ? new Date(s.created.time).toISOString() : "",
          }));
        }
      } catch (e) { console.warn("Could not fetch shares:", e); }
    }

    // Store key metrics for today
    const today = new Date().toISOString().split("T")[0];
    const metricsToStore = [
      { metric_name: "followers", metric_value: followerCount },
      { metric_name: "page_views", metric_value: totals.pageViews },
      { metric_name: "likes", metric_value: totals.likes },
      { metric_name: "comments", metric_value: totals.comments },
    ];

    for (const m of metricsToStore) {
      await supabase.from("analytics_data").upsert(
        { user_id: user.id, platform: "linkedin", date: today, metric_name: m.metric_name, metric_value: m.metric_value },
        { onConflict: "user_id,platform,date,metric_name" },
      );
    }

    const response = {
      organization: {
        name: orgData?.localizedName || orgName,
        vanity_name: orgData?.vanityName || "",
        followers_count: followerCount,
        page_views: totals.pageViews,
      },
      engagement: totals,
      posts,
      daily_metrics: finalDailyMetrics,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Fetch LinkedIn data error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
