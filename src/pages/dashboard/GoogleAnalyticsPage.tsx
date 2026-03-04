import MetricCard from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MousePointerClick, Target } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const sessionsData = [
  { month: "Jan", users: 3200, sessions: 4500 }, { month: "Feb", users: 3500, sessions: 4800 },
  { month: "Mar", users: 3800, sessions: 5200 }, { month: "Apr", users: 4200, sessions: 5900 },
  { month: "May", users: 4600, sessions: 6400 }, { month: "Jun", users: 5100, sessions: 7200 },
];

const trafficSources = [
  { name: "Organic", value: 45 }, { name: "Direct", value: 25 },
  { name: "Referral", value: 15 }, { name: "Social", value: 15 },
];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const GoogleAnalyticsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Google Analytics</h1>
      <p className="text-muted-foreground">Website traffic and user behavior</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <MetricCard title="Users" value="5,100" change="+10.9%" icon={Users} trend="up" />
      <MetricCard title="Sessions" value="7,200" change="+12.5%" icon={MousePointerClick} trend="up" />
      <MetricCard title="Conversions" value="342" change="+6.2%" icon={Target} trend="up" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Users & Sessions</CardTitle></CardHeader><CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={sessionsData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} /><Legend /><Line type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" strokeWidth={2} /><Line type="monotone" dataKey="sessions" stroke="hsl(var(--chart-2))" strokeWidth={2} /></LineChart>
        </ResponsiveContainer>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Traffic Sources</CardTitle></CardHeader><CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart><Pie data={trafficSources} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{trafficSources.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /></PieChart>
        </ResponsiveContainer>
      </CardContent></Card>
    </div>
  </div>
);

export default GoogleAnalyticsPage;
