import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LinkedInPageSummary {
  id: string;
  name: string;
  logo: string;
}

type PostStatus = "published" | "scheduled";

interface MockLinkedInPost {
  id: string;
  content: string;
  status: PostStatus;
  createdAt: string;
  scheduledAt: string | null;
  pageId: string;
  pageName: string;
}

interface LinkedInPostSchedulerProps {
  selectedPage: LinkedInPageSummary | null;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDefaultScheduleDate() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return now.toISOString().slice(0, 10);
}

function getDefaultScheduleTime() {
  return "09:00";
}

export function LinkedInPostScheduler({ selectedPage }: LinkedInPostSchedulerProps) {
  const [postContent, setPostContent] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(getDefaultScheduleDate);
  const [scheduledTime, setScheduledTime] = useState(getDefaultScheduleTime);
  const [posts, setPosts] = useState<MockLinkedInPost[]>([]);

  const scheduledDateTime = useMemo(() => {
    if (!isScheduled || !scheduledDate || !scheduledTime) {
      return null;
    }

    const candidate = new Date(`${scheduledDate}T${scheduledTime}`);
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  }, [isScheduled, scheduledDate, scheduledTime]);

  const trimmedContent = postContent.trim();
  const isComposerDisabled = !selectedPage;
  const canPublish = Boolean(trimmedContent) && !isComposerDisabled;
  const canSchedule = canPublish && Boolean(scheduledDateTime);
  const characterCount = postContent.length;

  const resetComposer = () => {
    setPostContent("");
    setIsScheduled(false);
    setScheduledDate(getDefaultScheduleDate());
    setScheduledTime(getDefaultScheduleTime());
  };

  const handleCreatePost = async (mode: PostStatus) => {
    if (!selectedPage || !trimmedContent) {
      return;
    }

    const nextPost: MockLinkedInPost = {
      id: crypto.randomUUID(),
      content: trimmedContent,
      status: mode,
      createdAt: new Date().toISOString(),
      scheduledAt: mode === "scheduled" && scheduledDateTime ? scheduledDateTime.toISOString() : null,
      pageId: selectedPage.id,
      pageName: selectedPage.name,
    };

    setPosts((currentPosts) => [nextPost, ...currentPosts]);
    resetComposer();

    if (mode === "published") {
      toast.success("Post published successfully");
    } else {
      toast.success("Post scheduled successfully");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Create LinkedIn Post</CardTitle>
          <CardDescription>
            Draft a realistic mock post flow for LinkedIn publishing approval demos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {selectedPage ? (
                  <>
                    <img
                      src={selectedPage.logo}
                      alt={selectedPage.name}
                      className="h-12 w-12 rounded-2xl border object-cover"
                    />
                    <div>
                      <p className="font-medium text-foreground">{selectedPage.name}</p>
                      <p className="text-sm text-muted-foreground">Selected LinkedIn page</p>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="font-medium text-foreground">No page selected</p>
                    <p className="text-sm text-muted-foreground">
                      Choose a LinkedIn page above to start composing posts.
                    </p>
                  </div>
                )}
              </div>

              <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Connected to LinkedIn
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="linkedin-post-content" className="text-sm font-medium text-foreground">
                Post content
              </label>
              <span className="text-xs text-muted-foreground">{characterCount}/3000</span>
            </div>
            <Textarea
              id="linkedin-post-content"
              value={postContent}
              onChange={(event) => setPostContent(event.target.value)}
              placeholder="What do you want to share?"
              className="min-h-[180px] resize-none rounded-2xl border-border/70 bg-background/80 px-4 py-3 text-sm shadow-sm"
              disabled={isComposerDisabled}
            />
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Publishing mode</p>
                <p className="text-sm text-muted-foreground">
                  Post immediately or schedule the content for later.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-sm", !isScheduled ? "font-medium text-foreground" : "text-muted-foreground")}>
                  Post now
                </span>
                <Switch checked={isScheduled} onCheckedChange={setIsScheduled} disabled={isComposerDisabled} />
                <span className={cn("text-sm", isScheduled ? "font-medium text-foreground" : "text-muted-foreground")}>
                  Schedule for later
                </span>
              </div>
            </div>

            <div className={cn("mt-4 grid gap-4 md:grid-cols-2", !isScheduled && "opacity-60")}>
              <div className="space-y-2">
                <label htmlFor="linkedin-schedule-date" className="text-sm font-medium text-foreground">
                  Date
                </label>
                <Input
                  id="linkedin-schedule-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                  disabled={!isScheduled || isComposerDisabled}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="linkedin-schedule-time" className="text-sm font-medium text-foreground">
                  Time
                </label>
                <Input
                  id="linkedin-schedule-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(event) => setScheduledTime(event.target.value)}
                  disabled={!isScheduled || isComposerDisabled}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => void handleCreatePost("published")}
              disabled={!canPublish}
              className="rounded-xl px-5"
            >
              <Send className="mr-2 h-4 w-4" />
              Post Now
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleCreatePost("scheduled")}
              disabled={!canSchedule}
              className="rounded-xl px-5"
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              Schedule Post
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Your Posts</CardTitle>
          <CardDescription>
            Locally stored mock posts for this connected LinkedIn publishing demo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
              <p className="font-medium text-foreground">No posts yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Publish or schedule a post to populate this mock LinkedIn queue.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{post.pageName}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {post.content}
                      </p>
                    </div>
                    <Badge
                      variant={post.status === "published" ? "default" : "secondary"}
                      className="rounded-full px-3 py-1 capitalize"
                    >
                      {post.status}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>Created {formatDateTime(post.createdAt)}</span>
                    {post.scheduledAt && (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        Scheduled for {formatDateTime(post.scheduledAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
