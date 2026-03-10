import { useNavigate } from "react-router-dom";
import MetricCard from "@/components/MetricCard";
import DashboardHeader from "@/components/DashboardHeader";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Eye, Heart, MessageSquare, Share2, Linkedin, AlertCircle, TrendingUp } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useLinkedInData, useLinkedInConnection } from "@/hooks/useLinkedInData";
import { format } from "date-fns";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
};

const LinkedInPage = () => {
  const navigate = useNavigate();
  const { data: connection, isLoading: connLoading } = useLinkedInConnection();
  const { data, isLoading, error, refetch, isFetching } = useLinkedInData();

  if (!connLoading && !connection) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="LinkedIn Analytics" subtitle="Connect your LinkedIn Company Page to see analytics" />
        <EmptyState
          icon={Linkedin}
          title="LinkedIn Not Connected"
          description="Connect your LinkedIn Company Page to start tracking followers, engagement, and post performance."
          action={<Button onClick={() => navigate("/dashboard/connections")}>Connect LinkedIn</Button>}
        />
      </div>
    );
  }

  if (isLoading || connLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="LinkedIn Analytics" subtitle="Loading your LinkedIn data…" />
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
        <DashboardHeader title="LinkedIn Analytics" subtitle="There was a problem loading your data" />
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Data"
          description={error?.message || "Could not fetch LinkedIn analytics."}
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

  const { organization, engagement, posts, history } = data;

  // Build followers history chart
  const followersChart = history
    .filter((h) => h.metric_name === "followers")
    .map((h) => ({
      date: format(new Date(h.date), "MMM d"),
      followers: h.metric_value,
    }));

  // Build engagement history
  const engagementChart = history
    .filter((h) => h.metric_name === "likes")
    .map((h) => {
      const commentEntry = history.find((c) => c.metric_name === "comments" && c.date === h.date);
      return {
        date: format(new Date(h.date), "MMM d"),
        likes: h.metric_value,
        comments: commentEntry?.metric_value || 0,
      };
    });

  const totalEngagement = engagement.likes + engagement.comments + engagement.shares;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="LinkedIn Analytics"
        subtitle={organization.name}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Followers" value={organization.followers_count.toLocaleString()} icon={Users} />
        <MetricCard title="Page Views" value={organization.page_views.toLocaleString()} icon={Eye} />
        <MetricCard title="Total Engagement" value={totalEngagement.toLocaleString()} icon={TrendingUp} />
        <MetricCard title="Shares" value={engagement.shares.toLocaleString()} icon={Share2} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
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
                  <Line type="monotone" dataKey="followers" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {engagementChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Engagement Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={engagementChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="likes" fill="hsl(var(--chart-1))" stackId="a" name="Likes" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="comments" fill="hsl(var(--chart-3))" stackId="a" name="Comments" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Engagement Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Total Likes" value={engagement.likes.toLocaleString()} icon={Heart} />
        <MetricCard title="Total Comments" value={engagement.comments.toLocaleString()} icon={MessageSquare} />
        <MetricCard title="Total Shares" value={engagement.shares.toLocaleString()} icon={Share2} />
      </div>

      {/* Recent Posts */}
      {posts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Posts</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-[400px] truncate">{post.text || "—"}</TableCell>
                    <TableCell className="text-right">
                      {post.created_time ? format(new Date(post.created_time), "MMM d, yyyy") : "—"}
                    </TableCell>
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

export default LinkedInPage;
