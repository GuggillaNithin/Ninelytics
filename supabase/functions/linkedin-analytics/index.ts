import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 🔐 Get user from token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) throw new Error("Invalid user");

    // 📦 Get LinkedIn account
    const { data: account, error: accError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "linkedin")
      .single();

    if (accError || !account) throw new Error("LinkedIn not connected");

    const accessToken = account.access_token;
    const orgId = account.platform_user_id;

    if (!orgId) throw new Error("No organization ID");

    const orgUrn = `urn:li:organization:${orgId}`;

    // 👥 Followers
    const followersRes = await fetch(
      `https://api.linkedin.com/v2/networkSizes/${orgUrn}?edgeType=CompanyFollowedByMember`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const followersJson = await followersRes.json();
    const followers = followersJson.firstDegreeSize || 0;

    // 📊 Share stats (impressions)
    const statsRes = await fetch(
      `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${orgUrn}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const statsJson = await statsRes.json();
    const impressions = statsJson.elements?.[0]?.totalShareStatistics?.impressionCount || 0;

    // 📝 Posts
    const postsRes = await fetch(
      `https://api.linkedin.com/v2/shares?q=owners&owners=${orgUrn}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const postsJson = await postsRes.json();
    const posts = postsJson.elements || [];

    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    const formattedPosts = [];

    // ❤️ Fetch engagement per post
    for (const post of posts.slice(0, 10)) {
      const urn = post.id;
      const socialRes = await fetch(
        `https://api.linkedin.com/v2/socialActions/${urn}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const socialJson = await socialRes.json();

      const likes = socialJson.likesSummary?.totalLikes || 0;
      const comments = socialJson.commentsSummary?.totalComments || 0;
      const shares = socialJson.sharesSummary?.totalShares || 0;

      totalLikes += likes;
      totalComments += comments;
      totalShares += shares;

      formattedPosts.push({
        id: urn,
        text: post.text?.text || post.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text || "",
        created_time: post.created?.time ? new Date(post.created.time).toISOString() : null,
        engagement: { likes, comments, shares }
      });
    }

    return new Response(
      JSON.stringify({
        organization: {
          name: account.platform_username || "LinkedIn",
          vanity_name: "",
          followers_count: followers,
          page_views: impressions,
        },
        engagement: {
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
        },
        posts: formattedPosts,
        daily_metrics: [], // optional for now
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
