import { getMockLinkedInProfile } from "../_shared/linkedin-mock.ts";
import {
  corsHeaders,
  createServiceClient,
  getAuthenticatedUser,
  jsonResponse,
} from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, response } = await getAuthenticatedUser(req);
    if (response || !user) {
      return response!;
    }

    const supabase = createServiceClient();
    const { data: account, error } = await supabase
      .from("social_accounts")
      .select("access_token, expires_at, selected_org_id, selected_org_name")
      .eq("user_id", user.id)
      .eq("platform", "linkedin")
      .maybeSingle();

    if (error || !account?.access_token) {
      return jsonResponse({ error: "LinkedIn account is not connected" }, 404);
    }

    const profile = getMockLinkedInProfile();
    const [firstName = "", lastName = ""] = profile.name.split(" ");

    return jsonResponse({
      id: profile.id,
      localizedFirstName: firstName,
      localizedLastName: lastName,
      name: profile.name,
      email: profile.email,
      profilePicture: profile.picture,
      expiresAt: account.expires_at,
      selectedPageId: account.selected_org_id,
      selectedPageName: account.selected_org_name,
    });
  } catch (error: any) {
    console.error("LinkedIn profile error:", error);

    return jsonResponse({ error: error.message || "Unexpected error" }, 500);
  }
});
