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
import { Users, MousePointerClick, Target, Eye, BarChart3, LineChart as LineChartIcon, AlertCircle, Globe } from "lucide-react";
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useGoogleAnalyticsData, useGAConnection } from "@/hooks/useGoogleAnalyticsData";
import { format } from "date-fns";

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
};

const GoogleAnalyticsPage = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const { data: connection, isLoading: connLoading } = useGAConnection();
  const { data, isLoading, error, refetch, isFetching } = useGoogleAnalyticsData(days);

  if (!connLoading && !connection) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Google Analytics" subtitle="Connect your GA4 property to see analytics" />
        <EmptyState
          icon={LineChartIcon}
          title="Google Analytics Not Connected"
          description="Connect your Google Analytics property to start tracking website traffic and user behavior."
          action={<Button onClick={() => navigate("/dashboard/connections")}>Connect Google Analytics</Button>}
        />
      </div>
    );
  }

  if (isLoading || connLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Google Analytics" subtitle="Loading your analytics data…" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Google Analytics" subtitle="There was a problem loading your data" />
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Data"
          description={error?.message || "Could not fetch Google Analytics data."}
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

  const { totals, daily_metrics, devices, countries, top_pages, property_name } = data;

  const chartData = daily_metrics.map((d) => ({
    date: format(new Date(d.date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")), "MMM d"),
    users: d.activeUsers,
    sessions: d.sessions,
    pageViews: d.pageViews,
  }));

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Google Analytics"
        subtitle={property_name}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      >
        <DateRangeFilter value={days} onChange={setDays} />
      </DashboardHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title={`Users (${days}d)`} value={totals.activeUsers.toLocaleString()} icon={Users} />
        <MetricCard title={`Sessions (${days}d)`} value={totals.sessions.toLocaleString()} icon={MousePointerClick} />
        <MetricCard title={`Page Views (${days}d)`} value={totals.pageViews.toLocaleString()} icon={Eye} />
        <MetricCard title="Bounce Rate" value={`${totals.bounceRate}%`} icon={Target} />
        <MetricCard title="Engagement Rate" value={`${totals.engagementRate}%`} icon={BarChart3} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Users & Sessions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Users" />
                <Line type="monotone" dataKey="sessions" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Sessions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Page Views</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="pageViews" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Page Views" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Device Breakdown */}
        {devices.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Device Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="users"
                    nameKey="device"
                    label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                  >
                    {devices.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Countries */}
        {countries.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Top Countries</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={countries.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis type="category" dataKey="country" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="users" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Pages */}
      {top_pages.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top Pages</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Page Views</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top_pages.map((page, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm max-w-[400px] truncate">{page.path}</TableCell>
                    <TableCell className="text-right">{page.pageViews.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{page.users.toLocaleString()}</TableCell>
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

export default GoogleAnalyticsPage;
