import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  TrendingUp, 
  Eye, 
  Image as ImageIcon, 
  BarChart3, 
  Instagram, 
  MessageSquare, 
  Heart,
  Calendar,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Clock
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell
} from "recharts";
import DashboardHeader from "@/components/DashboardHeader";
import MetricCard from "@/components/MetricCard";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
};

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

// --- REALISTIC MOCK DATA ---
const MOCK_PROFILE = {
  username: "ninelytics_official",
  name: "Ninelytics",
  profile_picture_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
  followers_count: 12430,
  follows_count: 452,
  media_count: 128,
  status: "Connected"
};

const PERFORMANCE_DATA = [
  { date: "Oct 19", impressions: 1240, reach: 980, engagement: 142 },
  { date: "Oct 20", impressions: 1560, reach: 1120, engagement: 168 },
  { date: "Oct 21", impressions: 1320, reach: 1040, engagement: 154 },
  { date: "Oct 22", impressions: 1890, reach: 1450, engagement: 210 },
  { date: "Oct 23", impressions: 2100, reach: 1680, engagement: 245 },
  { date: "Oct 24", impressions: 1750, reach: 1320, engagement: 198 },
  { date: "Oct 25", impressions: 2430, reach: 1980, engagement: 312 },
];

const RECENT_POSTS = [
  {
    id: "1",
    thumbnail: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=300&h=300",
    likes: 842,
    comments: 42,
    engagement_rate: "6.8%",
    timestamp: "2h ago",
    type: "Image"
  },
  {
    id: "2",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=300&h=300",
    likes: 1240,
    comments: 86,
    engagement_rate: "10.4%",
    timestamp: "1d ago",
    type: "Carousel"
  },
  {
    id: "3",
    thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=300&h=300",
    likes: 532,
    comments: 24,
    engagement_rate: "4.2%",
    timestamp: "3d ago",
    type: "Reel"
  },
  {
    id: "4",
    thumbnail: "https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&q=80&w=300&h=300",
    likes: 912,
    comments: 38,
    engagement_rate: "7.6%",
    timestamp: "5d ago",
    type: "Image"
  }
];

const AUDIENCE_LOCATIONS = [
  { name: "United States", value: 45 },
  { name: "United Kingdom", value: 15 },
  { name: "Canada", value: 12 },
  { name: "Germany", value: 10 },
  { name: "Others", value: 18 },
];

const AGE_DISTRIBUTION = [
  { age: "18-24", value: 25 },
  { age: "25-34", value: 42 },
  { age: "35-44", value: 18 },
  { age: "45-54", value: 10 },
  { age: "55+", value: 5 },
];

const ACTIVE_HOURS = [
  { hour: "12am", users: 120 },
  { hour: "4am", users: 80 },
  { hour: "8am", users: 450 },
  { hour: "12pm", users: 890 },
  { hour: "4pm", users: 1240 },
  { hour: "8pm", users: 1050 },
  { hour: "11pm", users: 600 },
];

const InstagramPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<"impressions" | "reach" | "engagement">("impressions");

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={MOCK_PROFILE.profile_picture_url} />
              <AvatarFallback><Instagram /></AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
              <div className="bg-success h-3 w-3 rounded-full border-2 border-background" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">@{MOCK_PROFILE.username}</h1>
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20 hover:bg-success/10">
                Connected
              </Badge>
            </div>
            <p className="text-muted-foreground">Track your account performance and audience engagement</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Last 7 Days
          </Button>
          <Button size="sm" className="gap-2">
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard 
          title="Total Impressions" 
          value="12,430" 
          change="+12.4% from last week" 
          icon={BarChart3} 
          trend="up"
        />
        <MetricCard 
          title="Total Reach" 
          value="9,870" 
          change="+8.2% from last week" 
          icon={Eye} 
          trend="up"
        />
        <MetricCard 
          title="Profile Views" 
          value="1,240" 
          change="-2.1% from last week" 
          icon={Users} 
          trend="down"
        />
        <MetricCard 
          title="Total Engagement" 
          value="532" 
          change="+15.8% from last week" 
          icon={TrendingUp} 
          trend="up"
        />
        <MetricCard 
          title="Follower Growth" 
          value="+124" 
          change="+5.4% from last week" 
          icon={Users} 
          trend="up"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ANALYTICS CHART SECTION */}
        <Card className="lg:col-span-2 shadow-sm border-muted/60">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-lg">Performance Overview</CardTitle>
              <CardDescription>Daily metrics for your Instagram Business account</CardDescription>
            </div>
            <div className="flex bg-muted p-1 rounded-lg">
              {(["impressions", "reach", "engagement"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeMetric === m 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={PERFORMANCE_DATA} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    itemStyle={{ fontSize: 12, fontWeight: 500 }}
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={activeMetric} 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ fill: "hsl(var(--primary))", r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AUDIENCE INSIGHTS - LOCATIONS */}
        <Card className="shadow-sm border-muted/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Top Locations
            </CardTitle>
            <CardDescription>Audience distribution by country</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={AUDIENCE_LOCATIONS}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {AUDIENCE_LOCATIONS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {AUDIENCE_LOCATIONS.map((loc, i) => (
                <div key={loc.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{loc.name}</span>
                  </div>
                  <span className="font-medium">{loc.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* RECENT CONTENT PERFORMANCE */}
        <Card className="lg:col-span-2 shadow-sm border-muted/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Content Performance</CardTitle>
              <CardDescription>Metrics for your most recent posts</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5">
              View All Posts
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              {RECENT_POSTS.map((post) => (
                <div key={post.id} className="flex gap-4 p-3 rounded-xl border border-transparent hover:border-muted hover:bg-muted/30 transition-all group">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                    <img 
                      src={post.thumbnail} 
                      alt="Post thumbnail" 
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-1 right-1">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-[10px] px-1.5 py-0 h-4">
                        {post.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between flex-grow py-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.timestamp}
                      </span>
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Likes</p>
                        <p className="text-sm font-bold flex items-center gap-1">
                          <Heart className="h-3 w-3 text-destructive fill-destructive" />
                          {post.likes}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Comments</p>
                        <p className="text-sm font-bold flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-primary fill-primary" />
                          {post.comments}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Eng. Rate</p>
                        <p className="text-sm font-bold text-success flex items-center gap-0.5">
                          {post.engagement_rate}
                          <TrendingUp className="h-3 w-3" />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ACTIVE HOURS INSIGHTS */}
        <Card className="shadow-sm border-muted/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Active Hours
            </CardTitle>
            <CardDescription>When your followers are most active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ACTIVE_HOURS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hour" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  />
                  <Bar 
                    dataKey="users" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Peak Engagement</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your followers are most active between <span className="text-foreground font-medium">4:00 PM and 8:00 PM</span>.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AGE DISTRIBUTION WIDGET */}
      <Card className="shadow-sm border-muted/60">
        <CardHeader>
          <CardTitle className="text-lg">Audience Demographics</CardTitle>
          <CardDescription>Age distribution of your followers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {AGE_DISTRIBUTION.map((item) => (
              <div key={item.age} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.age}</span>
                  <span className="text-muted-foreground">{item.value}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out" 
                    style={{ width: loading ? "0%" : `${item.value}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstagramPage;
