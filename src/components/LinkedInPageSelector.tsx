import { Linkedin, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LinkedInPage, LinkedInProfile } from "@/hooks/useLinkedInPages";

interface LinkedInPageSelectorProps {
  profile?: LinkedInProfile;
  pages: LinkedInPage[];
  loading: boolean;
  selectingPageId?: string | null;
  onSelect: (pageId: string) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function LinkedInPageSelector({
  profile,
  pages,
  loading,
  selectingPageId,
  onSelect,
}: LinkedInPageSelectorProps) {
  return (
    <div className="space-y-5 py-2">
      {profile && (
        <Card className="border-muted bg-muted/30">
          <CardContent className="flex items-center gap-4 p-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile.profilePicture ?? undefined} alt={profile.name} />
              <AvatarFallback>{getInitials(profile.name || "LI")}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-foreground">{profile.name}</p>
              {profile.email && <p className="truncate text-sm text-muted-foreground">{profile.email}</p>}
              <p className="text-sm text-muted-foreground">LinkedIn profile connected</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/40 p-5 text-center text-sm text-muted-foreground">
          No LinkedIn pages found. Make sure you are an admin.
        </div>
      ) : (
        <div className="grid gap-3">
          {pages.map((page) => {
            const isSelecting = selectingPageId === page.id;

            return (
              <div
                key={page.id}
                role="button"
                tabIndex={0}
                className={cn(
                  "rounded-xl border text-left transition-colors",
                  "hover:border-primary/50 hover:bg-muted/30",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30",
                  page.isSelected && "border-primary bg-primary/5 ring-1 ring-primary/20",
                  isSelecting && "opacity-70",
                )}
                onClick={() => onSelect(page.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(page.id);
                  }
                }}
                aria-disabled={Boolean(selectingPageId)}
              >
                <div className="flex items-center gap-3 p-4">
                  {page.logo ? (
                    <img
                      src={page.logo}
                      alt={page.name}
                      className="h-12 w-12 rounded-full border object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Linkedin className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{page.name}</p>
                    {page.vanity_name && (
                      <p className="truncate text-sm text-muted-foreground">@{page.vanity_name}</p>
                    )}
                  </div>

                  {page.isSelected ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      Selected
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={Boolean(selectingPageId)}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(page.id);
                      }}
                    >
                      {isSelecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Select"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
