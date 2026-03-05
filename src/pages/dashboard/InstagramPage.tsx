import { useNavigate } from "react-router-dom";
import MetricCard from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Play, Eye, Image, BarChart3, Instagram, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useInstagramData, useInstagramConnection } from "@/hooks/useInstagramData";
import EmptyState from "@/components/EmptyState";
import { format } from "date-fns";

const InstagramPage = () => {
  const navigate = useNavigate();
  const { data: connection, isLoading: connLoading } = useInstagramConnection();
  const { data, isLoading, error, refetch } = useInstagramData();

  // Not connected state
  if (!connLoading && !connection) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Instagram Analytics</h1>
          <p className="text-muted-foreground">Connect your Instagram Business account to see analytics</p>
        </div>
        <EmptyState
          icon={Instagram}
          title="Instagram Not Connected"
          description="Connect your Instagram Business account to start tracking followers, engagement, and post performance."
          action={
            <Button onClick={() => navigate("/dashboard/connections")}>
              Connect Instagram
            </Button>
          }
        />
      </div>
    );
  }

  // Loading state
  if (isLoading || connLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Instagram Analytics</h1>
          <p className="text-muted-foreground">Loading your Instagram data…</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Instagram Analytics</h1>
          <p className="text-muted-foreground">There was a problem loading your data</p>
        </div>
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Data"
          description={error?.message || "Could not fetch Instagram analytics. Please try again."}
          action={
            <div className="flex gap-2">
              <Button onClick={() => refetch()}>Retry</Button>
              <Button variant="outline" onClick={() => navigate("/dashboard/connections")}>
                Reconnect
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const { profile, insights, posts, followers_history } = data;

  const chartData = followers_history.map((h) => ({
    date: format(new Date(h.date), "MMM d"),
    followers: h.metric_value,
  }));

  return (
    <div className="space-y-6">
      {/* Header with profile info */}
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile.profile_picture_url} alt={profile.username} />
          <AvatarFallback><Instagram className="h-6 w-6" /></AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Instagram Analytics</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">@{profile.username}</p>
            <Badge variant="secondary">{profile.name}</Badge>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Followers" value={profile.followers_count.toLocaleString()} icon={Users} />
        <MetricCard title="Following" value={profile.follows_count.toLocaleString()} icon={Users} />
        <MetricCard title="Posts" value={profile.media_count.toLocaleString()} icon={Image} />
        <MetricCard title="Reach (30d)" value={insights.reach.toLocaleString()} icon={Eye} />
        <MetricCard title="Impressions (30d)" value={insights.impressions.toLocaleString()} icon={BarChart3} />
        <MetricCard title="Engagement Rate" value={`${insights.engagement_rate}%`} icon={TrendingUp} />
      </div>

      {/* Followers growth chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Followers Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                <Line type="monotone" dataKey="followers" stroke="hsl(var(--chart-4))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent posts table */}
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
                    <TableCell>
                      <Badge variant="outline">{post.media_type}</Badge>
                    </TableCell>
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
