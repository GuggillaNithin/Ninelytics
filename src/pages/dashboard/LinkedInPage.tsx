import MetricCard from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const engagementData = [
  { month: "Jan", followers: 400, engagement: 45 },
  { month: "Feb", followers: 450, engagement: 52 },
  { month: "Mar", followers: 500, engagement: 58 },
  { month: "Apr", followers: 600, engagement: 70 },
  { month: "May", followers: 700, engagement: 82 },
  { month: "Jun", followers: 850, engagement: 95 },
];

const LinkedInPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">LinkedIn Analytics</h1>
      <p className="text-muted-foreground">Company page performance</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <MetricCard title="Page Followers" value="850" change="+21.4%" icon={Users} trend="up" />
      <MetricCard title="Engagement" value="95" change="+15.9%" icon={TrendingUp} trend="up" />
    </div>
    <Card><CardHeader><CardTitle>Followers & Engagement</CardTitle></CardHeader><CardContent>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={engagementData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} /><Bar dataKey="followers" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} /><Bar dataKey="engagement" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} /></BarChart>
      </ResponsiveContainer>
    </CardContent></Card>
  </div>
);

export default LinkedInPage;
