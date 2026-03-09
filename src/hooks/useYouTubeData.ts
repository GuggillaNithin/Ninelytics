import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface YouTubeChannel {
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
}

export interface YouTubeDailyMetric {
  date: string;
  views: number;
  watchTimeMinutes: number;
  subscribersGained: number;
  subscribersLost: number;
  likes: number;
  comments: number;
}

export interface YouTubeTopVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  watchTimeMinutes: number;
  likes: number;
  comments: number;
}

export interface YouTubeData {
  channel: YouTubeChannel;
  period_totals: {
    views: number;
    watchTimeMinutes: number;
    subscribersGained: number;
    subscribersLost: number;
    likes: number;
    comments: number;
  };
  daily_metrics: YouTubeDailyMetric[];
  top_videos: YouTubeTopVideo[];
  history: { date: string; metric_name: string; metric_value: number }[];
}

export function useYouTubeData(days: number = 30) {
  const { session } = useAuth();

  return useQuery<YouTubeData>({
    queryKey: ["youtube-data", session?.user?.id, days],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/fetch-youtube-data?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch YouTube data");
      }
      return res.json();
    },
    enabled: !!session?.access_token,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}

export function useYouTubeConnection() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["youtube-connection", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_accounts")
        .select("platform, platform_username")
        .eq("user_id", session!.user.id)
        .eq("platform", "youtube")
        .maybeSingle();
      return data;
    },
    enabled: !!session?.user?.id,
  });
}
