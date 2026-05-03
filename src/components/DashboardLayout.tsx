import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  LineChart,
  Calendar,
  FileText,
  Files,
  FolderOpen,
  MessageSquare,
  AtSign,
  Star,
  Users,
  Settings,
  Link2,
  Youtube,
  Facebook,
  Instagram,
  Linkedin,
  LogOut,
  Moon,
  Sun,
  User,
  Menu,
  Plus,
  ChevronDown,
  Crown
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    title: null,
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
      { to: "/dashboard/analytics", icon: LineChart, label: "Analytics" },
      { to: "/dashboard/calendar", icon: Calendar, label: "Calendar" },
      { to: "/dashboard/posts", icon: FileText, label: "Posts" },
      { to: "/dashboard/drafts", icon: Files, label: "Drafts" },
      { to: "/dashboard/library", icon: FolderOpen, label: "Content Library" },
    ]
  },
  {
    title: "ENGAGEMENT",
    items: [
      { to: "/dashboard/comments", icon: MessageSquare, label: "Comments" },
      { to: "/dashboard/mentions", icon: AtSign, label: "Mentions" },
      { to: "/dashboard/reviews", icon: Star, label: "Reviews" },
    ]
  },
  {
    title: "TEAM / MANAGEMENT",
    items: [
      { to: "/dashboard/connections", icon: Link2, label: "Social Accounts" },
      { to: "/dashboard/team", icon: Users, label: "Team" },
      { to: "/dashboard/settings", icon: Settings, label: "Settings" },
    ]
  },
  {
    title: "PLATFORMS CONNECTED",
    items: [
      { to: "/dashboard/youtube", icon: Youtube, label: "YouTube" },
      { to: "/dashboard/facebook", icon: Facebook, label: "Facebook" },
      { to: "/dashboard/instagram", icon: Instagram, label: "Instagram" },
      { to: "/dashboard/linkedin", icon: Linkedin, label: "LinkedIn" },
      { to: "/dashboard/google-analytics", icon: LineChart, label: "Google Analytics" },
    ]
  }
];

const DashboardLayout = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const UserProfile = () => (
    <div className="p-4 border-t border-border mt-auto shrink-0 bg-[#F8F9FB] dark:bg-card">
      <div className="flex items-center gap-3 bg-white dark:bg-muted/50 p-2.5 rounded-[12px] border border-border shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-muted transition-colors">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">Workspace</h4>
          <div className="flex items-center gap-1 mt-0.5">
            <Crown className="h-3 w-3 text-amber-500" />
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wide">Pro Plan</span>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mr-1" />
      </div>
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#F8F9FB] dark:bg-card overflow-hidden text-foreground font-sans">
      <div className="flex items-center gap-2 px-5 pt-6 pb-5 shrink-0 justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Ninelytics logo" className="h-8 w-8 object-contain" />
          <span className="text-xl font-bold tracking-tight">Ninelytics</span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
      </div>

      <div className="px-4 mb-6 shrink-0">
        <Button 
          className="w-full h-[44px] bg-[#8DDC73] hover:bg-[#7bc862] text-slate-900 rounded-[14px] font-bold shadow-sm transition-all text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md"
          onClick={() => {
             navigate("/dashboard/create-post");
             setSidebarOpen(false);
          }}
        >
          <Plus className="h-5 w-5" /> New Post
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-6 scrollbar-hide pb-4">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <h4 className="px-3 mb-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                {section.title}
              </h4>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-all duration-200 group mx-1",
                    isActive
                      ? "bg-white dark:bg-muted text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none font-semibold"
                      : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn(
                      "absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-0 bg-[#7C3AED] rounded-r-full transition-all duration-300 opacity-0", 
                      isActive && "h-6 opacity-100"
                    )} />
                    <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-[#7C3AED]" : "group-hover:text-foreground transition-colors")} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      
      <UserProfile />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col border-r border-border shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] flex flex-col bg-card shadow-2xl transition-transform duration-300 ease-in-out">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md h-16 flex items-center px-4 md:px-8 gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-full">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full overflow-hidden border border-border shadow-sm">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="text-xs text-muted-foreground flex items-center gap-2 p-2" disabled>
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <div className="truncate">{user?.email || "user@example.com"}</div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
