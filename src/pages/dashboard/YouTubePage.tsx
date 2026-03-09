import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MetricCard from "@/components/MetricCard";
import DashboardHeader from "@/components/DashboardHeader";
import DateRangeFilter from "@/components/DateRangeFilter";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Eye, Clock, ThumbsUp, MessageSquare, TrendingUp, Youtube, AlertCircle } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useYouTubeData, useYouTubeConnection } from "@/hooks/useYouTubeData";
import { format } from "date-fns";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
};

const YouTubePage = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const { data: connection, isLoading: connLoading } = useYouTubeConnection();
  const { data, isLoading, error, refetch, isFetching } = useYouTubeData(days);

  if (!connLoading && !connection) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="YouTube Analytics" subtitle="Connect your YouTube channel to see analytics" />
        <EmptyState
          icon={Youtube}
          title="YouTube Not Connected"
          description="Connect your YouTube channel to start tracking subscribers, views, and video performance."
          action={<Button onClick={() => navigate("/dashboard/connections")}>Connect YouTube</Button>}
        />
      </div>
    );
  }

  if (isLoading || connLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="YouTube Analytics" subtitle="Loading your YouTube data…" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="YouTube Analytics" subtitle="There was a problem loading your data" />
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Data"
          description={error?.message || "Could not fetch YouTube analytics."}
          action={
            <div className="flex gap-2">
              <Button onClick={() => refetch()}>Retry</Button>
              <Button variant="outline" onClick={() => navigate("/dashboard/connections")}>Reconnect</Button>
            </div>
          }
        />
      </div>
    );
  }

  const { channel, period_totals, daily_metrics, top_videos } = data;

  const chartData = daily_metrics.map((d) => ({
    date: format(new Date(d.date.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1-$2-$3")), "MMM d"),
    views: d.views,
    watchTimeHrs: Math.round(d.watchTimeMinutes / 60),
    netSubs: d.subscribersGained - d.subscribersLost,
    likes: d.likes,
  }));

  const watchTimeHours = Math.round(period_totals.watchTimeMinutes / 60);
  const netSubs = period_totals.subscribersGained - period_totals.subscribersLost;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="YouTube Analytics"
        subtitle={connection?.platform_username || channel.title}
        icon={
          <Avatar className="h-10 w-10">
            <AvatarImage src={channel.thumbnail} alt={channel.title} />
            <AvatarFallback><Youtube className="h-5 w-5" /></AvatarFallback>
          </Avatar>
        }
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      >
        <DateRangeFilter value={days} onChange={setDays} />
      </DashboardHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Subscribers" value={channel.subscriberCount.toLocaleString()} icon={Users}
          change={`${netSubs >= 0 ? "+" : ""}${netSubs.toLocaleString()} in ${days}d`} trend={netSubs >= 0 ? "up" : "down"} />
        <MetricCard title={`Views (${days}d)`} value={period_totals.views.toLocaleString()} icon={Eye} />
        <MetricCard title={`Watch Time (${days}d)`} value={`${watchTimeHours.toLocaleString()} hrs`} icon={Clock} />
        <MetricCard title={`Engagement (${days}d)`} value={(period_totals.likes + period_totals.comments).toLocaleString()}
          icon={ThumbsUp} change={`${period_totals.likes.toLocaleString()} likes · ${period_totals.comments.toLocaleString()} comments`} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Views Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="views" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Watch Time (hrs)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="watchTimeHrs" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subscriber Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="netSubs" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Engagement (Likes)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="likes" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Videos */}
      {top_videos.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top Performing Videos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Watch Time</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top_videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell className="max-w-[300px]">
                      <div className="flex items-center gap-3">
                        {video.thumbnail && (
                          <img src={video.thumbnail} alt="" className="h-9 w-16 rounded object-cover" />
                        )}
                        <span className="truncate">{video.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{video.views.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{Math.round(video.watchTimeMinutes / 60).toLocaleString()} hrs</TableCell>
                    <TableCell className="text-right">{video.likes.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{video.comments.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default YouTubePage;
