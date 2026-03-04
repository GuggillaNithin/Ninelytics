import MetricCard from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const engagementData = [
  { month: "Jan", reach: 4500, impressions: 8200, engagement: 320 },
  { month: "Feb", reach: 5100, impressions: 9400, engagement: 380 },
  { month: "Mar", reach: 5800, impressions: 10200, engagement: 420 },
  { month: "Apr", reach: 6200, impressions: 11500, engagement: 490 },
  { month: "May", reach: 7000, impressions: 13000, engagement: 560 },
  { month: "Jun", reach: 7800, impressions: 14500, engagement: 640 },
];

const FacebookPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Facebook Analytics</h1>
      <p className="text-muted-foreground">Page reach, impressions, and engagement</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <MetricCard title="Page Reach" value="7,800" change="+11.4%" icon={Users} trend="up" />
      <MetricCard title="Impressions" value="14.5K" change="+11.5%" icon={Eye} trend="up" />
      <MetricCard title="Engagement Rate" value="4.4%" change="+0.3%" icon={TrendingUp} trend="up" />
    </div>
    <Card><CardHeader><CardTitle>Engagement Overview</CardTitle></CardHeader><CardContent>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={engagementData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} /><Bar dataKey="reach" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} /><Bar dataKey="impressions" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} /><Bar dataKey="engagement" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} /></BarChart>
      </ResponsiveContainer>
    </CardContent></Card>
  </div>
);

export default FacebookPage;
