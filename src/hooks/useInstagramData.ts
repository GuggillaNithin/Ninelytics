import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface InstagramProfile {
  username: string;
  name: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
}

export interface InstagramInsights {
  reach: number;
  impressions: number;
  profile_views: number;
  engagement_rate: number;
}

export interface InstagramPost {
  id: string;
  caption: string;
  media_type: string;
  media_url: string;
  timestamp: string;
  likes: number;
  comments: number;
}

export interface InstagramData {
  profile: InstagramProfile;
  insights: InstagramInsights;
  posts: InstagramPost[];
  followers_history: { date: string; metric_value: number }[];
}

export function useInstagramData() {
  const { session } = useAuth();

  return useQuery<InstagramData>({
    queryKey: ["instagram-data", session?.user?.id],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/fetch-instagram-data`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch Instagram data");
      }

      return res.json();
    },
    enabled: !!session?.access_token,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000,
  });
}

export function useInstagramConnection() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["instagram-connection", session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("platform, platform_username")
        .eq("user_id", session!.user.id)
        .eq("platform", "instagram")
        .maybeSingle();

      return data;
    },
    enabled: !!session?.user?.id,
  });
}
