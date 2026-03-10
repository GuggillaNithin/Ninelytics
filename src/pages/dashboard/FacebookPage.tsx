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
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Eye, TrendingUp, Heart, MessageSquare, Share2, Facebook, AlertCircle, UserPlus } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useFacebookData, useFacebookConnection } from "@/hooks/useFacebookData";
import { format } from "date-fns";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
};

const FacebookPage = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const { data: connection, isLoading: connLoading } = useFacebookConnection();
  const { data, isLoading, error, refetch, isFetching } = useFacebookData(days);

  if (!connLoading && !connection) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Facebook Analytics" subtitle="Connect your Facebook Page to see analytics" />
        <EmptyState
          icon={Facebook}
          title="Facebook Not Connected"
          description="Connect your Facebook Page to start tracking reach, impressions, and engagement."
          action={<Button onClick={() => navigate("/dashboard/connections")}>Connect Facebook</Button>}
        />
      </div>
    );
  }

  if (isLoading || connLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Facebook Analytics" subtitle="Loading your Facebook data…" />
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
        <DashboardHeader title="Facebook Analytics" subtitle="There was a problem loading your data" />
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Data"
          description={error?.message || "Could not fetch Facebook analytics."}
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

  const { page, totals, daily_metrics, posts, followers_history } = data;

  const impressionsChart = daily_metrics.map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    impressions: d.page_impressions || 0,
    engaged: d.page_engaged_users || 0,
  }));

  const engagementChart = daily_metrics.map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    engagements: d.page_post_engagements || 0,
    newFans: d.page_fan_adds || 0,
  }));

  const followersChart = followers_history.map((h) => ({
    date: format(new Date(h.date), "MMM d"),
    followers: h.metric_value,
  }));

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Facebook Analytics"
        subtitle={page.name}
        icon={
          <Avatar className="h-10 w-10">
            <AvatarImage src={page.picture_url} alt={page.name} />
            <AvatarFallback><Facebook className="h-5 w-5" /></AvatarFallback>
          </Avatar>
        }
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      >
        <DateRangeFilter value={days} onChange={setDays} />
      </DashboardHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Page Followers" value={page.followers_count.toLocaleString()} icon={Users} />
        <MetricCard title={`Impressions (${days}d)`} value={totals.impressions.toLocaleString()} icon={Eye} />
        <MetricCard title={`Engaged Users (${days}d)`} value={totals.engaged_users.toLocaleString()} icon={TrendingUp} />
        <MetricCard title={`New Fans (${days}d)`} value={totals.new_fans.toLocaleString()} icon={UserPlus} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {impressionsChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Impressions & Engaged Users</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={impressionsChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="impressions" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} name="Impressions" />
                  <Line type="monotone" dataKey="engaged" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Engaged Users" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {engagementChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Engagements & New Fans</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={engagementChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="engagements" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Engagements" />
                  <Bar dataKey="newFans" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="New Fans" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {followersChart.length > 1 && (
          <Card>
            <CardHeader><CardTitle>Followers Growth</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={followersChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="followers" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Engagement Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Total Likes (recent)" value={totals.total_likes.toLocaleString()} icon={Heart} />
        <MetricCard title="Total Comments (recent)" value={totals.total_comments.toLocaleString()} icon={MessageSquare} />
        <MetricCard title="Total Shares (recent)" value={totals.total_shares.toLocaleString()} icon={Share2} />
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader><CardTitle>Recent Posts</CardTitle></CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No posts found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-[250px] truncate">{post.message || "—"}</TableCell>
                    <TableCell className="text-right">{post.likes.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{post.comments.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{post.shares.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{format(new Date(post.created_time), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookPage;
