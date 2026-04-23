import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MetricCard from "@/components/MetricCard";
import DashboardHeader from "@/components/DashboardHeader";
import DateRangeFilter from "@/components/DateRangeFilter";
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
  const [days, setDays] = useState(30);
  const { data: connection, isLoading: connLoading } = useLinkedInConnection();
  const { data, isLoading, error, refetch, isFetching } = useLinkedInData(days);

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

  const { organization, engagement, posts, daily_metrics } = data;

  if (!organization) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="LinkedIn Analytics" subtitle="Error" />
        <EmptyState
          icon={AlertCircle}
          title="Invalid Data Format"
          description="The LinkedIn API returned data in an unexpected format. Please try reconnecting your account."
          action={<Button variant="outline" onClick={() => navigate("/dashboard/connections")}>Reconnect</Button>}
        />
      </div>
    );
  }

  const chartData = (daily_metrics || []).map((d) => ({
    date: d.date ? format(new Date(d.date), "MMM d") : "—",
    views: d.pageViews || 0,
    likes: d.likes || 0,
    comments: d.comments || 0,
  }));

  const totalEngagement = (engagement?.likes || 0) + (engagement?.comments || 0) + (engagement?.shares || 0);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="LinkedIn Analytics"
        subtitle={organization.name}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      >
        <DateRangeFilter value={days} onChange={setDays} />
      </DashboardHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Followers" value={organization.followers_count.toLocaleString()} icon={Users} />
        <MetricCard title={`Page Views (${days}d)`} value={organization.page_views.toLocaleString()} icon={Eye} />
        <MetricCard title={`Engagement (${days}d)`} value={totalEngagement.toLocaleString()} icon={TrendingUp} />
        <MetricCard title={`Shares (${days}d)`} value={engagement.shares.toLocaleString()} icon={Share2} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Page Views Over Time</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                No historical view data available for this period.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Engagement Over Time</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="likes" fill="hsl(var(--chart-1))" stackId="a" name="Likes" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="comments" fill="hsl(var(--chart-3))" stackId="a" name="Comments" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                No historical engagement data available for this period.
              </div>
            )}
          </CardContent>
        </Card>
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
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post: any) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-[300px] truncate">{post.text || "—"}</TableCell>
                    <TableCell className="text-right">{post.engagement?.likes || 0}</TableCell>
                    <TableCell className="text-right">{post.engagement?.comments || 0}</TableCell>
                    <TableCell className="text-right">{post.engagement?.shares || 0}</TableCell>
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
