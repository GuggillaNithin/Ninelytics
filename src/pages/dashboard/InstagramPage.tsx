import MetricCard from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, TrendingUp, Play } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const followersData = [
  { month: "Jan", followers: 1500 }, { month: "Feb", followers: 1700 },
  { month: "Mar", followers: 1900 }, { month: "Apr", followers: 2200 },
  { month: "May", followers: 2600 }, { month: "Jun", followers: 3000 },
];

const topPosts = [
  { id: 1, caption: "Behind the scenes of our latest shoot 📸", likes: 342, comments: 28, reach: 4500 },
  { id: 2, caption: "New product launch! Check it out 🚀", likes: 289, comments: 45, reach: 3800 },
  { id: 3, caption: "Team building day ☀️", likes: 256, comments: 19, reach: 3200 },
  { id: 4, caption: "Thank you for 3K followers! 🎉", likes: 412, comments: 67, reach: 5200 },
];

const InstagramPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Instagram Analytics</h1>
      <p className="text-muted-foreground">Followers, reels, and top posts</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <MetricCard title="Followers" value="3,000" change="+15.4%" icon={Users} trend="up" />
      <MetricCard title="Reel Engagement" value="8.2%" change="+1.1%" icon={Play} trend="up" />
      <MetricCard title="Engagement Rate" value="5.6%" change="+0.4%" icon={TrendingUp} trend="up" />
    </div>
    <Card><CardHeader><CardTitle>Followers Growth</CardTitle></CardHeader><CardContent>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={followersData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} /><Line type="monotone" dataKey="followers" stroke="hsl(var(--chart-4))" strokeWidth={2} /></LineChart>
      </ResponsiveContainer>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Top Posts</CardTitle></CardHeader><CardContent>
      <Table>
        <TableHeader><TableRow><TableHead>Post</TableHead><TableHead className="text-right">Likes</TableHead><TableHead className="text-right">Comments</TableHead><TableHead className="text-right">Reach</TableHead></TableRow></TableHeader>
        <TableBody>
          {topPosts.map((post) => (
            <TableRow key={post.id}><TableCell className="max-w-[200px] truncate">{post.caption}</TableCell><TableCell className="text-right">{post.likes}</TableCell><TableCell className="text-right">{post.comments}</TableCell><TableCell className="text-right">{post.reach.toLocaleString()}</TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  </div>
);

export default InstagramPage;
