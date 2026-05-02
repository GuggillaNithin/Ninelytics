import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Building2, CheckCircle2, Linkedin } from "lucide-react";
import { useLinkedInConnection, useLinkedInMockData } from "@/hooks/useLinkedInData";
import { useSelectLinkedInPage } from "@/hooks/useLinkedInPages";
import { cn } from "@/lib/utils";
import { LinkedInPostScheduler } from "@/components/LinkedInPostScheduler";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const LinkedInPage = () => {
  const navigate = useNavigate();
  const { data: connection, isLoading: connLoading } = useLinkedInConnection();
  const { data, isLoading, error, refetch, isFetching } = useLinkedInMockData();
  const selectLinkedInPage = useSelectLinkedInPage();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPageId && data?.pages?.length) {
      setSelectedPageId(data.pages[0].id);
    }
  }, [data?.pages, selectedPageId]);

  if (!connLoading && !connection) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="LinkedIn Connection"
          subtitle="Connect your LinkedIn profile to preview mocked page data"
        />
        <EmptyState
          icon={Linkedin}
          title="LinkedIn Not Connected"
          description="Connect LinkedIn first, then we will show the mocked profile and page selection experience."
          action={<Button onClick={() => navigate("/dashboard/connections")}>Connect LinkedIn</Button>}
        />
      </div>
    );
  }

  if (isLoading || connLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="LinkedIn Connection"
          subtitle="Loading your mocked LinkedIn workspace..."
        />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="LinkedIn Connection"
          subtitle="There was a problem loading your mocked LinkedIn data"
        />
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Mock Data"
          description={error?.message || "Could not fetch mocked LinkedIn data."}
          action={
            <div className="flex gap-2">
              <Button onClick={() => refetch()}>Retry</Button>
              <Button variant="outline" onClick={() => navigate("/dashboard/connections")}>
                Manage Connection
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const { profile, pages } = data;
  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? null;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="LinkedIn Connection"
        subtitle="Mocked LinkedIn profile and page data for the connected account"
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Connected Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 border">
                <AvatarImage src={profile.picture} alt={profile.name} />
                <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <div>
                  <p className="text-xl font-semibold text-foreground">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  LinkedIn connected successfully
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selected Page</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPage ? (
              <div className="flex items-center gap-4">
                <img
                  src={selectedPage.logo}
                  alt={selectedPage.name}
                  className="h-16 w-16 rounded-2xl border object-cover"
                />
                <div>
                  <p className="font-semibold text-foreground">{selectedPage.name}</p>
                  <p className="text-sm text-muted-foreground">Selected for analytics preview</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Select a page to continue.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>LinkedIn Pages</CardTitle>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No mocked LinkedIn pages available.
            </div>
          ) : (
            <div className="grid gap-3">
              {pages.map((page) => {
                const isSelected = selectedPageId === page.id;

                return (
                  <div
                    key={page.id}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors",
                      isSelected && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={page.logo}
                        alt={page.name}
                        className="h-12 w-12 rounded-xl border object-cover"
                      />
                      <div>
                        <p className="font-medium text-foreground">{page.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                           LinkedIn organization
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={isSelected ? "default" : "outline"}
                      disabled={selectLinkedInPage.isPending}
                      onClick={() => {
                        setSelectedPageId(page.id);
                        selectLinkedInPage.mutate({ pageId: page.id });
                      }}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <LinkedInPostScheduler
        selectedPage={
          selectedPage
            ? {
                id: selectedPage.id,
                name: selectedPage.name,
                logo: selectedPage.logo,
              }
            : null
        }
      />
    </div>
  );
};

export default LinkedInPage;
