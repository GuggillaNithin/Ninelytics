import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Youtube, LineChart, Facebook, Instagram, Linkedin, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useLinkedInPages, useSelectLinkedInPage } from "@/hooks/useLinkedInPages";

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
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-chart-5", edgeFunction: "auth-facebook" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-chart-4", edgeFunction: "auth-instagram" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-chart-1", edgeFunction: "auth-linkedin" },
];

const ConnectionsPage = () => {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  
  // LinkedIn Page Selection State
  const [showLinkedInDialog, setShowLinkedInDialog] = useState(false);
  const { data: linkedinPagesData, isLoading: loadingPages } = useLinkedInPages();
  const selectLinkedInPage = useSelectLinkedInPage();

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
      fetchConnections().then(() => {
        if (connected.toLowerCase() === "linkedin") {
          setShowLinkedInDialog(true);
        }
      });
    }
    if (error) {
      toast.error(`Connection failed: ${error}`);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Handle auto-selection if only 1 page
  useEffect(() => {
    if (showLinkedInDialog && linkedinPagesData?.pages) {
      if (linkedinPagesData.pages.length === 1) {
        const page = linkedinPagesData.pages[0];
        selectLinkedInPage.mutate({ orgId: page.id, orgName: page.name }, {
          onSuccess: () => setShowLinkedInDialog(false)
        });
      } else if (linkedinPagesData.pages.length === 0) {
        toast.error("You must be an Administrator of a LinkedIn Company Page to view analytics.");
        setShowLinkedInDialog(false);
      }
    }
  }, [showLinkedInDialog, linkedinPagesData]);

  const handleConnect = async (platform: PlatformConfig) => {
    if (!platform.edgeFunction) {
      toast.info(`${platform.name} OAuth integration coming soon.`);
      return;
    }

    setConnecting(platform.id);
    try {
      // The function returns a URL we need to call with GET and action=initiate
      // We use the Supabase URL from environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/${platform.edgeFunction}?action=initiate`,
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
                  <div className="flex gap-2">
                    {p.id === "linkedin" && (
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setShowLinkedInDialog(true)}>
                        Select Page
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleDisconnect(p)}>
                      Disconnect
                    </Button>
                  </div>
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

      {/* LinkedIn Page Selection Dialog */}
      <Dialog open={showLinkedInDialog} onOpenChange={setShowLinkedInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select LinkedIn Page</DialogTitle>
            <DialogDescription>
              Choose which LinkedIn Company Page you want to track analytics for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingPages ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : linkedinPagesData?.pages && linkedinPagesData.pages.length > 0 ? (
              <div className="grid gap-2">
                {linkedinPagesData.pages.map((page) => (
                  <Button
                    key={page.id}
                    variant="outline"
                    className="justify-start h-auto py-3"
                    onClick={() => selectLinkedInPage.mutate({ orgId: page.id, orgName: page.name }, {
                      onSuccess: () => setShowLinkedInDialog(false)
                    })}
                    disabled={selectLinkedInPage.isPending}
                  >
                    <div className="flex items-center gap-3">
                      {page.logo_url ? (
                        <img src={page.logo_url} alt={page.name} className="h-8 w-8 rounded-full" />
                      ) : (
                        <Linkedin className="h-8 w-8 p-1 text-muted-foreground bg-muted rounded-full" />
                      )}
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{page.name}</span>
                        {page.vanity_name && <span className="text-xs text-muted-foreground">@{page.vanity_name}</span>}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground border rounded-md bg-muted/50">
                <p>No Company Pages found.</p>
                <p className="text-sm mt-1">Make sure you are an Administrator for the page.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConnectionsPage;
