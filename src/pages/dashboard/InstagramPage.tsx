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
import { Users, TrendingUp, Eye, Image, BarChart3, Instagram, AlertCircle, MessageSquare, Heart } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useInstagramData, useInstagramConnection } from "@/hooks/useInstagramData";
import { format } from "date-fns";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
};

const InstagramPage = () => {
  const navigate = useNavigate();
  const { data: connection, isLoading: connLoading } = useInstagramConnection();
  const { data, isLoading, error, refetch, isFetching } = useInstagramData();

  if (!connLoading && !connection) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Instagram Analytics" subtitle="Connect your Instagram Business account to see analytics" />
        <EmptyState
          icon={Instagram}
          title="Instagram Not Connected"
          description="Connect your Instagram Business account to start tracking followers, engagement, and post performance."
          action={<Button onClick={() => navigate("/dashboard/connections")}>Connect Instagram</Button>}
        />
      </div>
    );
  }

  if (isLoading || connLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Instagram Analytics" subtitle="Loading your Instagram data…" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Instagram Analytics" subtitle="There was a problem loading your data" />
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Data"
          description={error?.message || "Could not fetch Instagram analytics. Please try again."}
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

  const { profile, insights, posts, followers_history } = data;

  const followersChart = followers_history.map((h) => ({
    date: format(new Date(h.date), "MMM d"),
    followers: h.metric_value,
  }));

  // Build engagement chart from posts
  const engagementChart = posts.slice(0, 15).reverse().map((p) => ({
    post: (p.caption || "Post").substring(0, 15),
    likes: p.likes,
    comments: p.comments,
  }));

  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments, 0);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Instagram Analytics"
        subtitle={`@${profile.username}`}
        icon={
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.profile_picture_url} alt={profile.username} />
            <AvatarFallback><Instagram className="h-5 w-5" /></AvatarFallback>
          </Avatar>
        }
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Followers" value={profile.followers_count.toLocaleString()} icon={Users} />
        <MetricCard title="Following" value={profile.follows_count.toLocaleString()} icon={Users} />
        <MetricCard title="Posts" value={profile.media_count.toLocaleString()} icon={Image} />
        <MetricCard title="Reach (30d)" value={insights.reach.toLocaleString()} icon={Eye} />
        <MetricCard title="Impressions (30d)" value={insights.impressions.toLocaleString()} icon={BarChart3} />
        <MetricCard title="Engagement Rate" value={`${insights.engagement_rate}%`} icon={TrendingUp} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Followers Growth */}
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

        {/* Engagement Chart */}
        {engagementChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Post Engagement</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={engagementChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="post" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="likes" fill="hsl(var(--chart-1))" stackId="a" name="Likes" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="comments" fill="hsl(var(--chart-2))" stackId="a" name="Comments" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Engagement Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Total Likes (recent)" value={totalLikes.toLocaleString()} icon={Heart} />
        <MetricCard title="Total Comments (recent)" value={totalComments.toLocaleString()} icon={MessageSquare} />
        <MetricCard title="Profile Views (30d)" value={insights.profile_views.toLocaleString()} icon={Eye} />
      </div>

      {/* Recent Posts Table */}
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
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-[250px] truncate">{post.caption || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{post.media_type}</Badge></TableCell>
                    <TableCell className="text-right">{post.likes.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{post.comments.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{format(new Date(post.timestamp), "MMM d, yyyy")}</TableCell>
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

export default InstagramPage;
