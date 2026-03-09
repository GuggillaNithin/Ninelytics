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
        .eq("platform", "google_analytics");
      return refreshed.access_token;
    }
  }
  return token;
}

async function runReport(accessToken: string, propertyId: string, body: any): Promise<any> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  return res.json();
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
      .eq("platform", "google_analytics")
      .single();

    if (accError || !account) {
      return new Response(JSON.stringify({ error: "Google Analytics not connected" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getValidToken(supabase, user.id, account);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Token expired. Please reconnect Google Analytics." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propertyId = account.platform_user_id;
    if (!propertyId) {
      return new Response(JSON.stringify({ error: "No GA4 property linked. Please reconnect." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reqUrl = new URL(req.url);
    const days = parseInt(reqUrl.searchParams.get("days") || "30");
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];

    // Run reports in parallel
    const [dailyReport, deviceReport, countryReport, pagesReport] = await Promise.all([
      // Daily users/sessions/pageviews
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "engagementRate" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      // Device breakdown
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      }),
      // Country breakdown
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 10,
      }),
      // Top pages
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
    ]);

    // Parse daily report
    const dailyMetrics = (dailyReport.rows || []).map((row: any) => ({
      date: row.dimensionValues[0].value,
      activeUsers: parseInt(row.metricValues[0].value) || 0,
      sessions: parseInt(row.metricValues[1].value) || 0,
      pageViews: parseInt(row.metricValues[2].value) || 0,
      bounceRate: parseFloat(row.metricValues[3].value) || 0,
      engagementRate: parseFloat(row.metricValues[4].value) || 0,
    }));

    // Totals
    const totals = dailyMetrics.reduce(
      (acc: any, d: any) => ({
        activeUsers: acc.activeUsers + d.activeUsers,
        sessions: acc.sessions + d.sessions,
        pageViews: acc.pageViews + d.pageViews,
      }),
      { activeUsers: 0, sessions: 0, pageViews: 0 },
    );
    const avgBounceRate = dailyMetrics.length > 0
      ? (dailyMetrics.reduce((s: number, d: any) => s + d.bounceRate, 0) / dailyMetrics.length * 100).toFixed(1)
      : "0";
    const avgEngagementRate = dailyMetrics.length > 0
      ? (dailyMetrics.reduce((s: number, d: any) => s + d.engagementRate, 0) / dailyMetrics.length * 100).toFixed(1)
      : "0";

    // Parse device data
    const devices = (deviceReport.rows || []).map((row: any) => ({
      device: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value) || 0,
      sessions: parseInt(row.metricValues[1].value) || 0,
    }));

    // Parse country data
    const countries = (countryReport.rows || []).map((row: any) => ({
      country: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value) || 0,
    }));

    // Parse top pages
    const topPages = (pagesReport.rows || []).map((row: any) => ({
      path: row.dimensionValues[0].value,
      pageViews: parseInt(row.metricValues[0].value) || 0,
      users: parseInt(row.metricValues[1].value) || 0,
    }));

    // Store key metrics
    const today = new Date().toISOString().split("T")[0];
    const metricsToStore = [
      { metric_name: "active_users", metric_value: totals.activeUsers },
      { metric_name: "sessions", metric_value: totals.sessions },
      { metric_name: "page_views", metric_value: totals.pageViews },
    ];

    for (const m of metricsToStore) {
      await supabase.from("analytics_data").upsert(
        { user_id: user.id, platform: "google_analytics", date: today, metric_name: m.metric_name, metric_value: m.metric_value },
        { onConflict: "user_id,platform,date,metric_name", ignoreDuplicates: false },
      );
    }

    const response = {
      property_name: account.platform_username || `Property ${propertyId}`,
      totals: { ...totals, bounceRate: avgBounceRate, engagementRate: avgEngagementRate },
      daily_metrics: dailyMetrics,
      devices,
      countries,
      top_pages: topPages,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Fetch GA data error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
