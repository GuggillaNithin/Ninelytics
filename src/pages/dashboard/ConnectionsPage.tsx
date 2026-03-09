import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Youtube, LineChart, Facebook, Instagram, Linkedin, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

interface PlatformConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  edgeFunction: string | null; // null = not yet implemented
}

const platforms: PlatformConfig[] = [
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-destructive", edgeFunction: "auth-youtube" },
  { id: "google_analytics", name: "Google Analytics", icon: LineChart, color: "text-chart-3", edgeFunction: "auth-google-analytics" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-chart-5", edgeFunction: "auth-facebook"h-facebook" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-chart-4", edgeFunction: "auth-instagram" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-chart-1", edg"auth-linkedin"ction: null },
];

const ConnectionsPage = () => {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  // Fetch connected accounts from DB
  const fetchConnections = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from("social_accounts")
      .select("platform")
      .eq("user_id", session.user.id);

    if (!error && data) {
      const map: Record<string, boolean> = {};
      data.forEach((row) => (map[row.platform] = true));
      setConnectedPlatforms(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConnections();
  }, [session]);

  // Handle redirect params from OAuth callback
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      toast.success(`${connected} connected successfully!`);
      setSearchParams({}, { replace: true });
      fetchConnections();
    }
    if (error) {
      toast.error(`Connection failed: ${error}`);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const handleConnect = async (platform: PlatformConfig) => {
    if (!platform.edgeFunction) {
      toast.info(`${platform.name} OAuth integration coming soon.`);
      return;
    }

    setConnecting(platform.id);
    try {
      const { data, error } = await supabase.functions.invoke(platform.edgeFunction, {
        body: null,
        headers: {},
      });

      // The function returns a URL we need to call with GET and action=initiate
      // But supabase.functions.invoke uses POST. Let's use fetch directly.
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${platform.edgeFunction}?action=initiate`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await res.json();

      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Failed to initiate OAuth");
      }
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: PlatformConfig) => {
    if (!platform.edgeFunction) {
      toast.info(`${platform.name} disconnect not available yet.`);
      return;
    }

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${platform.edgeFunction}?action=disconnect`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await res.json();

      if (result.success) {
        toast.success(`${platform.name} disconnected.`);
        setConnectedPlatforms((prev) => ({ ...prev, [platform.id]: false }));
      } else {
        toast.error(result.error || "Failed to disconnect");
      }
    } catch (err: any) {
      toast.error(err.message || "Disconnect failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Connections</h1>
        <p className="text-muted-foreground">Connect your social media accounts to start tracking analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((p) => {
          const isConnected = !!connectedPlatforms[p.id];
          const isConnecting = connecting === p.id;

          return (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center gap-4">
                <p.icon className={`h-8 w-8 ${p.color}`} />
                <div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <CardDescription>
                    {loading ? (
                      <Badge variant="secondary" className="mt-1">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Checking…
                      </Badge>
                    ) : (
                      <Badge variant={isConnected ? "default" : "secondary"} className="mt-1">
                        {isConnected ? (
                          <><Check className="mr-1 h-3 w-3" /> Connected</>
                        ) : (
                          <><X className="mr-1 h-3 w-3" /> Not Connected</>
                        )}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleDisconnect(p)}>
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnect(p)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting…</> : "Connect"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectionsPage;
