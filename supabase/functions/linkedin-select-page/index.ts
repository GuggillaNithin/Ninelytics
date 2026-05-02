import { getMockLinkedInPages } from "../_shared/linkedin-mock.ts";
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

    const body = await req.json();
    const pageId = body?.pageId;

    if (!pageId) {
      return jsonResponse({ error: "Missing pageId in request body" }, 400);
    }

    const supabase = createServiceClient();
    const { data: account, error } = await supabase
      .from("social_accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("platform", "linkedin")
      .maybeSingle();

    if (error || !account) {
      return jsonResponse({ error: "LinkedIn account is not connected" }, 404);
    }

    const mockPages = getMockLinkedInPages();
    const selectedPage = mockPages.find((page) => page.id === pageId);

    if (!selectedPage) {
      return jsonResponse({ error: "Selected page is not managed by this user" }, 403);
    }

    const { error: updateError } = await supabase
      .from("social_accounts")
      .update({
        selected_org_id: selectedPage.id,
        selected_org_name: selectedPage.name,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("platform", "linkedin");

    if (updateError) {
      console.error("Failed to persist selected LinkedIn page:", updateError);
      return jsonResponse({ error: "Failed to save selected page" }, 500);
    }

    return jsonResponse({
      success: true,
      page: {
        id: selectedPage.id,
        name: selectedPage.name,
      },
    });
  } catch (error: any) {
    console.error("LinkedIn select page error:", error);

    return jsonResponse({ error: error.message || "Unexpected error" }, 500);
  }
});
