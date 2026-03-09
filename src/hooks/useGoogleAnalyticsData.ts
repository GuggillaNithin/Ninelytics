import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GADailyMetric {
  date: string;
  activeUsers: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  engagementRate: number;
}

export interface GADevice {
  device: string;
  users: number;
  sessions: number;
}

export interface GACountry {
  country: string;
  users: number;
}

export interface GATopPage {
  path: string;
  pageViews: number;
  users: number;
}

export interface GoogleAnalyticsData {
  property_name: string;
  totals: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: string;
    engagementRate: string;
  };
  daily_metrics: GADailyMetric[];
  devices: GADevice[];
  countries: GACountry[];
  top_pages: GATopPage[];
}

export function useGoogleAnalyticsData(days: number = 30) {
  const { session } = useAuth();

  return useQuery<GoogleAnalyticsData>({
    queryKey: ["ga-data", session?.user?.id, days],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/fetch-google-analytics-data?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch Google Analytics data");
      }
      return res.json();
    },
    enabled: !!session?.access_token,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGAConnection() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["ga-connection", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_accounts")
        .select("platform, platform_username")
        .eq("user_id", session!.user.id)
        .eq("platform", "google_analytics")
        .maybeSingle();
      return data;
    },
    enabled: !!session?.user?.id,
  });
}
