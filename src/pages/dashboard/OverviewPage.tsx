import MetricCard from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Eye, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const growthData = [
  { month: "Jan", youtube: 1200, facebook: 900, instagram: 1500, linkedin: 400 },
  { month: "Feb", youtube: 1350, facebook: 950, instagram: 1700, linkedin: 450 },
  { month: "Mar", youtube: 1500, facebook: 1100, instagram: 1900, linkedin: 500 },
  { month: "Apr", youtube: 1800, facebook: 1250, instagram: 2200, linkedin: 600 },
  { month: "May", youtube: 2100, facebook: 1400, instagram: 2600, linkedin: 700 },
  { month: "Jun", youtube: 2400, facebook: 1600, instagram: 3000, linkedin: 850 },
];

const platformComparison = [
  { platform: "YouTube", followers: 2400, engagement: 180 },
  { platform: "Facebook", followers: 1600, engagement: 120 },
  { platform: "Instagram", followers: 3000, engagement: 350 },
  { platform: "LinkedIn", followers: 850, engagement: 95 },
];

const OverviewPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Overview</h1>
      <p className="text-muted-foreground">Your unified analytics at a glance</p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard title="Total Followers" value="7,850" change="+12.5% from last month" icon={Users} trend="up" />
      <MetricCard title="Total Engagement" value="745" change="+8.2% from last month" icon={TrendingUp} trend="up" />
      <MetricCard title="Total Impressions" value="24.3K" change="+15.1% from last month" icon={Eye} trend="up" />
      <MetricCard title="Platforms Connected" value="4" icon={BarChart3} />
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Follower Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
              <Legend />
              <Line type="monotone" dataKey="youtube" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="instagram" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="facebook" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="linkedin" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformComparison}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="platform" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
              <Legend />
              <Bar dataKey="followers" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="engagement" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default OverviewPage;
