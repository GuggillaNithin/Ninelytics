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

    // 📩 Parse request body
    const body = await req.json();
    const { orgId, orgName } = body;

    if (!orgId || !orgName) {
      throw new Error("Missing orgId or orgName in request body");
    }

    // 📝 Update social_accounts table
    const { error: updateError } = await supabase
      .from("social_accounts")
      .update({
        selected_org_id: orgId,
        selected_org_name: orgName,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id)
      .eq("platform", "linkedin");

    if (updateError) {
      console.error("Supabase update error:", updateError);
      throw new Error("Failed to save selected page");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Page selected successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("LinkedIn Select Page Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
