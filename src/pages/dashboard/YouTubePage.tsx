import MetricCard from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const subsData = [
  { month: "Jan", subscribers: 1200 }, { month: "Feb", subscribers: 1350 },
  { month: "Mar", subscribers: 1500 }, { month: "Apr", subscribers: 1800 },
  { month: "May", subscribers: 2100 }, { month: "Jun", subscribers: 2400 },
];

const viewsData = [
  { month: "Jan", views: 5400 }, { month: "Feb", views: 6200 },
  { month: "Mar", views: 7100 }, { month: "Apr", views: 8500 },
  { month: "May", views: 9200 }, { month: "Jun", views: 11000 },
];

const YouTubePage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">YouTube Analytics</h1>
      <p className="text-muted-foreground">Track your YouTube channel performance</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <MetricCard title="Subscribers" value="2,400" change="+200 this month" icon={Users} trend="up" />
      <MetricCard title="Total Views" value="11K" change="+19.6%" icon={Eye} trend="up" />
      <MetricCard title="Watch Time (hrs)" value="842" change="+12.3%" icon={Clock} trend="up" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Subscribers Growth</CardTitle></CardHeader><CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={subsData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} /><Line type="monotone" dataKey="subscribers" stroke="hsl(var(--chart-1))" strokeWidth={2} /></LineChart>
        </ResponsiveContainer>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Views</CardTitle></CardHeader><CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={viewsData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} /><Line type="monotone" dataKey="views" stroke="hsl(var(--chart-2))" strokeWidth={2} /></LineChart>
        </ResponsiveContainer>
      </CardContent></Card>
    </div>
  </div>
);

export default YouTubePage;
