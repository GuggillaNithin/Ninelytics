import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LinkedInOrganization {
  name: string;
  vanity_name: string;
  followers_count: number;
  page_views: number;
}

export interface LinkedInPost {
  id: string;
  text: string;
  created_time: string;
}

export interface LinkedInData {
  organization: LinkedInOrganization;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  posts: LinkedInPost[];
  daily_metrics: { date: string; pageViews: number; likes: number; comments: number; shares: number }[];
}

export function useLinkedInData(days: number = 30) {
  const { session } = useAuth();

  return useQuery<LinkedInData>({
    queryKey: ["linkedin-data", session?.user?.id, days],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/fetch-linkedin-data?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch LinkedIn data");
      }
      return res.json();
    },
    enabled: !!session?.access_token,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLinkedInConnection() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["linkedin-connection", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_accounts")
        .select("platform, platform_username")
        .eq("user_id", session!.user.id)
        .eq("platform", "linkedin")
        .maybeSingle();
      return data;
    },
    enabled: !!session?.user?.id,
  });
}
