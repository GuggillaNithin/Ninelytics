import { getMockLinkedInPages, getMockLinkedInProfile } from "../_shared/linkedin-mock.ts";
import { corsHeaders, getAuthenticatedUser, jsonResponse } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { user, response } = await getAuthenticatedUser(req);
  if (response || !user) {
    return response!;
  }

  return jsonResponse({
    profile: getMockLinkedInProfile(),
    pages: getMockLinkedInPages(),
  });
});
