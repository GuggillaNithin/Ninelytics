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

    // 🏢 Fetch organizations
    const pagesRes = await fetch(
      `https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(localizedName,vanityName,logoV2)))`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (!pagesRes.ok) {
      const errorText = await pagesRes.text();
      console.error("LinkedIn API error:", errorText);
      throw new Error(`Failed to fetch pages: ${pagesRes.statusText}`);
    }

    const pagesJson = await pagesRes.json();
    const elements = pagesJson.elements || [];

    const formattedPages = elements.map((element: any) => {
      const orgTarget = element["organizationalTarget~"];
      const orgUrn = element.organizationalTarget;
      const orgId = orgUrn.split(":").pop();
      
      let logoUrl = null;
      if (orgTarget?.logoV2?.["original~"]?.elements?.[0]?.identifiers?.[0]?.identifier) {
        logoUrl = orgTarget.logoV2["original~"].elements[0].identifiers[0].identifier;
      }

      return {
        id: orgId,
        name: orgTarget?.localizedName || "Unknown Company",
        vanity_name: orgTarget?.vanityName || "",
        logo_url: logoUrl
      };
    });

    return new Response(
      JSON.stringify({ pages: formattedPages }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("LinkedIn Pages Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
