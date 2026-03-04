import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Youtube, LineChart, Facebook, Instagram, Linkedin, Check, X } from "lucide-react";
import { toast } from "sonner";

const platforms = [
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-destructive", connected: false },
  { id: "google_analytics", name: "Google Analytics", icon: LineChart, color: "text-chart-3", connected: false },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-chart-5", connected: false },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-chart-4", connected: false },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-chart-1", connected: false },
];

const ConnectionsPage = () => {
  const handleConnect = (platform: string) => {
    toast.info(`OAuth flow for ${platform} will be configured with your API credentials.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Connections</h1>
        <p className="text-muted-foreground">Connect your social media accounts to start tracking analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <p.icon className={`h-8 w-8 ${p.color}`} />
              <div>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <CardDescription>
                  <Badge variant={p.connected ? "default" : "secondary"} className="mt-1">
                    {p.connected ? <><Check className="mr-1 h-3 w-3" /> Connected</> : <><X className="mr-1 h-3 w-3" /> Not Connected</>}
                  </Badge>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {p.connected ? (
                <Button variant="outline" size="sm" className="w-full">Disconnect</Button>
              ) : (
                <Button size="sm" className="w-full" onClick={() => handleConnect(p.name)}>Connect</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ConnectionsPage;
