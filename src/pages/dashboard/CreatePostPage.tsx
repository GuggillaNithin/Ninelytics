import { useState } from "react";
import { 
  Youtube, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Image as ImageIcon,
  Video,
  FileText,
  Smile,
  Hash,
  Tag,
  Link2,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  MoreVertical,
  ThumbsUp,
  MessageSquare,
  Share2,
  ChevronDown,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreatePostPage() {
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState("youtube");
  
  const platforms = [
    { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-500", bg: "bg-red-500" },
    { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600", bg: "bg-blue-600" },
    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-600" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-700", bg: "bg-blue-700" },
    { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "text-slate-900 dark:text-white", bg: "bg-slate-900" },
  ];

  const [selectedPlatforms, setSelectedPlatforms] = useState(["youtube", "facebook", "instagram"]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>
          <p className="text-muted-foreground mt-1">Publish to multiple social media platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-background">Save as Draft</Button>
          <div className="flex rounded-md overflow-hidden">
            <Button className="rounded-none rounded-l-md px-6 bg-primary hover:bg-primary/90 text-primary-foreground">
              Schedule
            </Button>
            <Button size="icon" className="rounded-none rounded-r-md border-l border-primary-foreground/20 bg-primary hover:bg-primary/90 text-primary-foreground w-10">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Composition (Col Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Add to your post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Accounts Selection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium">Accounts</h3>
                  <button className="text-sm text-primary hover:underline font-medium">Select all</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {platforms.map(platform => {
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                      <div key={platform.id} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => togglePlatform(platform.id)}>
                        <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center bg-muted/30 transition-colors ${isSelected ? 'border-primary' : 'border-transparent'}`}>
                          <platform.icon className={`h-5 w-5 ${platform.color}`} />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{platform.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Post Content */}
              <div>
                <h3 className="text-sm font-medium mb-3">Post Content</h3>
                <div className="border border-input rounded-md overflow-hidden bg-background focus-within:ring-1 focus-within:ring-primary">
                  <textarea 
                    className="w-full min-h-[150px] p-4 bg-transparent border-0 focus:ring-0 resize-none text-sm outline-none"
                    placeholder="What do you want to share?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <div className="flex items-center justify-between p-2 border-t border-border/50 bg-muted/10">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Hash className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium pr-2">
                      {content.length} / 2200
                    </span>
                  </div>
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <h3 className="text-sm font-medium mb-3">Media</h3>
                <div className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center bg-muted/5 hover:bg-muted/20 transition-colors cursor-pointer group">
                  <div className="flex justify-center gap-4 mb-4 text-muted-foreground group-hover:text-primary transition-colors">
                    <ImageIcon className="h-6 w-6" />
                    <Video className="h-6 w-6" />
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium mb-1">
                    Drag and drop files here or <span className="text-primary">click to upload</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, MP4, GIF (Max 50MB)
                  </p>
                </div>
              </div>

              {/* Options */}
              <div>
                <h3 className="text-sm font-medium mb-4">Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Add first comment</span>
                      <Circle className="h-3 w-3 text-muted-foreground/50" />
                    </div>
                    {/* Simulated Switch since we don't have the component imported yet */}
                    <div className="w-9 h-5 bg-muted rounded-full relative cursor-pointer border border-border">
                      <div className="w-4 h-4 bg-background rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Schedule this post</span>
                      <Circle className="h-3 w-3 text-muted-foreground/50" />
                    </div>
                    <div className="w-9 h-5 bg-muted rounded-full relative cursor-pointer border border-border">
                      <div className="w-4 h-4 bg-background rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Boost post</span>
                      <Circle className="h-3 w-3 text-muted-foreground/50" />
                    </div>
                    <div className="w-9 h-5 bg-muted rounded-full relative cursor-pointer border border-border">
                      <div className="w-4 h-4 bg-background rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Your Recent Posts</CardTitle>
              <Button variant="outline" size="sm" className="text-xs">View all posts</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground border-b border-border">
                    <tr>
                      <th className="font-medium py-3">Post</th>
                      <th className="font-medium py-3">Accounts</th>
                      <th className="font-medium py-3">Status</th>
                      <th className="font-medium py-3">Date</th>
                      <th className="font-medium py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50 group hover:bg-muted/20">
                      <td className="py-4">
                        <div className="flex items-center gap-3 max-w-[200px]">
                          <div className="w-10 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                            <img src="/images/img1.png" alt="post" className="w-full h-full object-cover opacity-80" />
                          </div>
                          <div className="truncate text-xs">
                            <span className="font-medium text-foreground block truncate">Check out our latest video on YouTube!</span>
                            <span className="text-muted-foreground truncate block">Excited to share some amazing updates...</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex -space-x-1">
                          <Youtube className="w-5 h-5 text-red-500 rounded-full bg-background border border-border p-0.5 relative z-30" />
                          <Facebook className="w-5 h-5 text-blue-600 rounded-full bg-background border border-border p-0.5 relative z-20" />
                          <Instagram className="w-5 h-5 text-pink-600 rounded-full bg-background border border-border p-0.5 relative z-10" />
                          <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-[8px] font-bold z-0">+3</div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-md text-[10px] font-medium flex items-center gap-1 w-max">
                          <Calendar className="w-3 h-3" /> Scheduled
                        </span>
                      </td>
                      <td className="py-4 text-muted-foreground text-xs">
                        Apr 30, 2024 10:00 AM
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Preview (Col Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm border-border sticky top-24 h-[calc(100vh-8rem)] min-h-[600px] flex flex-col">
            <CardHeader className="pb-0 border-b border-border/50">
              <CardTitle className="text-base font-semibold mb-4">Post Preview</CardTitle>
              {/* Platform Tabs */}
              <div className="flex gap-6 border-b-0">
                {platforms.map(platform => (
                  <button 
                    key={platform.id}
                    onClick={() => setActiveTab(platform.id)}
                    className={`pb-3 border-b-2 transition-colors px-1 ${activeTab === platform.id ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <platform.icon className={`h-5 w-5 ${platform.color}`} />
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex-1 bg-muted/10 p-6 flex flex-col overflow-y-auto">
              
              {/* Mockup Phone/Card */}
              <div className="bg-background rounded-xl border border-border shadow-sm w-full max-w-sm mx-auto overflow-hidden flex flex-col mt-4">
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-border">
                      <img src="/logo.png" alt="Profile" className="w-full h-full object-cover p-1" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold leading-tight">Ninelytics Official</h4>
                      <p className="text-xs text-muted-foreground">Just now</p>
                    </div>
                  </div>
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                
                {/* Post Text */}
                <div className="px-4 pb-3 text-sm whitespace-pre-wrap">
                  {content || "Your post content will appear here..."}
                </div>

                {/* Media Area */}
                <div className="w-full aspect-square bg-muted/40 border-y border-border/50 flex items-center justify-center flex-col gap-2 text-muted-foreground/50">
                  <ImageIcon className="h-16 w-16 opacity-50" />
                  <span className="text-sm font-medium">Image Preview</span>
                </div>

                {/* Post Footer/Actions */}
                <div className="p-4">
                  <div className="flex items-center gap-4 text-muted-foreground mb-4">
                    <ThumbsUp className="h-5 w-5" />
                    <MessageSquare className="h-5 w-5" />
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div className="h-2 bg-muted rounded-full w-1/4 mb-2"></div>
                  <div className="h-2 bg-muted rounded-full w-2/3"></div>
                </div>
              </div>

              <div className="mt-auto pt-6 text-center text-xs text-muted-foreground">
                Social networks regularly make updates to formatting, so your post may appear slightly different when published.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Schedule (Col Span 3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Summary Card */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Publishing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" /> Accounts
                </div>
                <div className="font-medium text-right leading-tight">
                  <span className="text-lg">{selectedPlatforms.length}</span><br/>
                  <span className="text-[10px] text-muted-foreground">Selected</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-4 w-4" /> Post Type
                </div>
                <div className="font-medium">Image</div>
              </div>
              
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" /> When
                </div>
                <div className="font-medium">Schedule</div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/20">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">April 30, 2024</div>
                  <div className="text-xs text-muted-foreground">10:00 AM</div>
                </div>
              </div>

              <Button className="w-full bg-primary text-primary-foreground mt-4 h-11 flex gap-2">
                <Calendar className="h-4 w-4" /> Schedule Post
              </Button>
            </CardContent>
          </Card>

          {/* Best Time to Post */}
          <Card className="shadow-sm border-border bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Best Time to Post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="font-bold text-lg mb-1">Wednesday</div>
                <div className="text-xs text-muted-foreground leading-tight">Engagement is highest around this time</div>
              </div>
              
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center mb-3">
                <div className="font-semibold text-primary text-sm">10:00 AM - 12:00 PM</div>
                <div className="text-[10px] text-primary/70 mt-1">Wed, Apr 30</div>
              </div>
              
              <Button variant="outline" className="w-full text-xs h-9 bg-background">See more times</Button>
            </CardContent>
          </Card>

          {/* Post Checklist */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Post Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Add media</span>
              </div>
              <div className="flex items-center gap-3">
                {content.length > 0 
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" /> 
                  : <Circle className="h-4 w-4 text-muted-foreground/30" />
                }
                <span className="text-sm">Add content</span>
              </div>
              <div className="flex items-center gap-3">
                {selectedPlatforms.length > 0
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <Circle className="h-4 w-4 text-muted-foreground/30" />
                }
                <span className="text-sm">Select accounts</span>
              </div>
              <div className="flex items-center gap-3">
                <Circle className="h-4 w-4 text-muted-foreground/30" />
                <span className="text-sm">Schedule or publish</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
