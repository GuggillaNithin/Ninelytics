import { useNavigate } from "react-router-dom";
import MetricCard from "@/components/MetricCard";
import DashboardHeader from "@/components/DashboardHeader";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Eye, BarChart3, Youtube, Instagram, Facebook, Linkedin, LineChart as LineChartIcon, Check, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useYouTubeConnection } from "@/hooks/useYouTubeData";
import { useInstagramConnection } from "@/hooks/useInstagramData";
import { useGAConnection } from "@/hooks/useGoogleAnalyticsData";
import { useFacebookConnection } from "@/hooks/useFacebookData";
import { useLinkedInConnection } from "@/hooks/useLinkedInData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
};

const OverviewPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  const { data: ytConn, isLoading: ytL } = useYouTubeConnection();
  const { data: igConn, isLoading: igL } = useInstagramConnection();
  const { data: gaConn, isLoading: gaL } = useGAConnection();
  const { data: fbConn, isLoading: fbL } = useFacebookConnection();
  const { data: liConn, isLoading: liL } = useLinkedInConnection();

  const connectionsLoading = ytL || igL || gaL || fbL || liL;

  const platforms = [
    { id: "youtube", name: "YouTube", icon: Youtube, connected: !!ytConn, color: "text-destructive" },
    { id: "instagram", name: "Instagram", icon: Instagram, connected: !!igConn, color: "text-chart-4" },
    { id: "google_analytics", name: "Google Analytics", icon: LineChartIcon, connected: !!gaConn, color: "text-chart-3" },
    { id: "facebook", name: "Facebook", icon: Facebook, connected: !!fbConn, color: "text-chart-5" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, connected: !!liConn, color: "text-chart-1" },
  ];

  const connectedCount = platforms.filter((p) => p.connected).length;

  // Fetch latest aggregated metrics from analytics_data
  const { data: latestMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["overview-metrics", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("analytics_data")
        .select("platform, metric_name, metric_value, date")
        .eq("user_id", session!.user.id)
        .in("metric_name", ["followers", "subscribers", "impressions", "reach", "active_users", "page_views"])
        .order("date", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!session?.user?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Aggregate latest metrics per platform
  const getLatest = (platform: string, metricName: string) => {
    if (!latestMetrics) return 0;
    const entry = latestMetrics.find((m) => m.platform === platform && m.metric_name === metricName);
    return entry?.metric_value || 0;
  };

  const totalFollowers =
    getLatest("youtube", "subscribers") +
    getLatest("instagram", "followers") +
    getLatest("facebook", "followers") +
    getLatest("linkedin", "followers");

  const totalImpressions =
    getLatest("instagram", "impressions") +
    getLatest("facebook", "impressions") +
    getLatest("instagram", "reach");

  const totalPageViews =
    getLatest("google_analytics", "page_views") +
    getLatest("linkedin", "page_views");

  // Build comparison chart from latest data
  const comparisonData = platforms
    .filter((p) => p.connected)
    .map((p) => {
      const followers = p.id === "youtube"
        ? getLatest("youtube", "subscribers")
        : p.id === "google_analytics"
        ? getLatest("google_analytics", "active_users")
        : getLatest(p.id, "followers");
      return { platform: p.name, followers };
    })
    .filter((d) => d.followers > 0);

  if (!connectionsLoading && connectedCount === 0) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Overview" subtitle="Your unified analytics at a glance" />
        <EmptyState
          icon={BarChart3}
          title="No Platforms Connected"
          description="Connect at least one social media account or analytics platform to see your unified dashboard."
          action={<Button onClick={() => navigate("/dashboard/connections")}>Connect Platforms</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Overview" subtitle="Your unified analytics at a glance" />

      {/* Connection Status */}
      <div className="flex flex-wrap gap-2">
        {platforms.map((p) => (
          <Badge
            key={p.id}
            variant={p.connected ? "default" : "secondary"}
            className="flex items-center gap-1.5 px-3 py-1"
          >
            <p.icon className={`h-3.5 w-3.5 ${p.connected ? "" : "opacity-50"}`} />
            {p.name}
            {p.connected ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-50" />}
          </Badge>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Followers"
          value={metricsLoading ? "…" : totalFollowers.toLocaleString()}
          icon={Users}
        />
        <MetricCard
          title="Total Impressions"
          value={metricsLoading ? "…" : totalImpressions.toLocaleString()}
          icon={Eye}
        />
        <MetricCard
          title="Total Page Views"
          value={metricsLoading ? "…" : totalPageViews.toLocaleString()}
          icon={TrendingUp}
        />
        <MetricCard
          title="Platforms Connected"
          value={connectionsLoading ? "…" : connectedCount.toString()}
          icon={BarChart3}
        />
      </div>

      {/* Platform Comparison */}
      {comparisonData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Platform Comparison — Followers / Users</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="platform" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="followers" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Followers / Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.filter((p) => p.connected).map((p) => (
          <Card
            key={p.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/dashboard/${p.id === "google_analytics" ? "google-analytics" : p.id}`)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <p.icon className={`h-6 w-6 ${p.color}`} />
              <div>
                <p className="font-medium text-foreground">{p.name}</p>
                <p className="text-sm text-muted-foreground">View detailed analytics →</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OverviewPage;
