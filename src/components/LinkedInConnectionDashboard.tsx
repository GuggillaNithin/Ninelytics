import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LinkedInPageSelector } from "@/components/LinkedInPageSelector";
import type { LinkedInPage, LinkedInProfile } from "@/hooks/useLinkedInPages";

interface LinkedInConnectionDashboardProps {
  profile?: LinkedInProfile;
  pages: LinkedInPage[];
  loading: boolean;
  selectingPageId?: string | null;
  onSelectPage: (pageId: string) => void;
}

export function LinkedInConnectionDashboard({
  profile,
  pages,
  loading,
  selectingPageId,
  onSelectPage,
}: LinkedInConnectionDashboardProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">LinkedIn Connection</CardTitle>
        <CardDescription>
          Review the connected profile and choose the LinkedIn Page to power your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && !profile ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <LinkedInPageSelector
            profile={profile}
            pages={pages}
            loading={loading}
            selectingPageId={selectingPageId}
            onSelect={onSelectPage}
          />
        )}
      </CardContent>
    </Card>
  );
}
