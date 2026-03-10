import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FacebookPage {
  name: string;
  picture_url: string;
  followers_count: number;
}

export interface FacebookPost {
  id: string;
  message: string;
  created_time: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface FacebookData {
  page: FacebookPage;
  totals: {
    impressions: number;
    engaged_users: number;
    post_engagements: number;
    new_fans: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
  };
  daily_metrics: Array<{
    date: string;
    page_impressions?: number;
    page_engaged_users?: number;
    page_post_engagements?: number;
    page_fan_adds?: number;
  }>;
  posts: FacebookPost[];
  followers_history: { date: string; metric_value: number }[];
}

export function useFacebookData(days: number = 30) {
  const { session } = useAuth();

  return useQuery<FacebookData>({
    queryKey: ["facebook-data", session?.user?.id, days],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/fetch-facebook-data?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch Facebook data");
      }
      return res.json();
    },
    enabled: !!session?.access_token,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFacebookConnection() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["facebook-connection", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_accounts")
        .select("platform, platform_username")
        .eq("user_id", session!.user.id)
        .eq("platform", "facebook")
        .maybeSingle();
      return data;
    },
    enabled: !!session?.user?.id,
  });
}
