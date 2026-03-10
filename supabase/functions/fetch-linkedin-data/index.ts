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

    const orgId = account.platform_user_id;
    const orgName = account.platform_username || "LinkedIn";
    const isOrg = !!orgId && orgId !== account.platform_user_id?.startsWith?.("urn") ? true : true;

    // Try to fetch organization data
    let orgData: any = null;
    let followerCount = 0;
    let pageViews = 0;

    if (orgId) {
      // Fetch organization info
      try {
        const orgRes = await fetch(
          `https://api.linkedin.com/v2/organizations/${orgId}?projection=(localizedName,vanityName,logoV2)`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (orgRes.ok) {
          orgData = await orgRes.json();
        }
      } catch (e) {
        console.warn("Could not fetch org info:", e);
      }

      // Fetch follower count
      try {
        const followerRes = await fetch(
          `https://api.linkedin.com/v2/networkSizes/urn:li:organization:${orgId}?edgeType=CompanyFollowedByMember`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (followerRes.ok) {
          const fData = await followerRes.json();
          followerCount = fData.firstDegreeSize || 0;
        }
      } catch (e) {
        console.warn("Could not fetch follower count:", e);
      }

      // Fetch page statistics
      try {
        const statsRes = await fetch(
          `https://api.linkedin.com/v2/organizationPageStatistics?q=organization&organization=urn:li:organization:${orgId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.elements && statsData.elements.length > 0) {
            const stats = statsData.elements[0];
            pageViews = stats.totalPageStatistics?.views?.allPageViews?.pageViews || 0;
          }
        }
      } catch (e) {
        console.warn("Could not fetch page stats:", e);
      }
    }

    // Fetch recent shares/posts from the organization
    let posts: any[] = [];
    if (orgId) {
      try {
        const sharesRes = await fetch(
          `https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:organization:${orgId}&count=25&sortBy=LAST_MODIFIED`,
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
      } catch (e) {
        console.warn("Could not fetch shares:", e);
      }
    }

    // Fetch share statistics for engagement data
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    if (orgId) {
      try {
        const shareStatsRes = await fetch(
          `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (shareStatsRes.ok) {
          const shareStatsData = await shareStatsRes.json();
          if (shareStatsData.elements && shareStatsData.elements.length > 0) {
            const totals = shareStatsData.elements[0].totalShareStatistics;
            if (totals) {
              totalLikes = totals.likeCount || 0;
              totalComments = totals.commentCount || 0;
              totalShares = totals.shareCount || 0;
            }
          }
        }
      } catch (e) {
        console.warn("Could not fetch share stats:", e);
      }
    }

    // Store key metrics
    const today = new Date().toISOString().split("T")[0];
    const metricsToStore = [
      { metric_name: "followers", metric_value: followerCount },
      { metric_name: "page_views", metric_value: pageViews },
      { metric_name: "likes", metric_value: totalLikes },
      { metric_name: "comments", metric_value: totalComments },
    ];

    for (const m of metricsToStore) {
      await supabase.from("analytics_data").upsert(
        { user_id: user.id, platform: "linkedin", date: today, metric_name: m.metric_name, metric_value: m.metric_value },
        { onConflict: "user_id,platform,date,metric_name", ignoreDuplicates: false },
      );
    }

    // Fetch historical data
    const { data: historyData } = await supabase
      .from("analytics_data")
      .select("date, metric_name, metric_value")
      .eq("user_id", user.id)
      .eq("platform", "linkedin")
      .order("date", { ascending: true })
      .limit(180);

    const response = {
      organization: {
        name: orgData?.localizedName || orgName,
        vanity_name: orgData?.vanityName || "",
        followers_count: followerCount,
        page_views: pageViews,
      },
      engagement: {
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
      },
      posts,
      history: historyData || [],
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
