import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Moon,
  Sun,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">Unified Analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Log in
            </Button>
            <Button onClick={() => navigate("/register")}>
              Get Started <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container py-24 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto animate-fade-in">
          All your social analytics,{" "}
          <span className="text-primary">one dashboard</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Connect YouTube, Facebook, Instagram, LinkedIn, and Google Analytics.
          Track performance across every platform in a single view.
        </p>
        <div className="mt-10 flex justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Button size="lg" onClick={() => navigate("/register")}>
            Start Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
            Log in
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: TrendingUp, title: "Growth Tracking", desc: "Monitor follower growth, engagement trends, and audience reach across all platforms." },
            { icon: Users, title: "Unified Metrics", desc: "Compare performance side-by-side with normalized metrics from every connected account." },
            { icon: Zap, title: "Auto Sync", desc: "Data syncs automatically every 6 hours so your dashboard is always up to date." },
          ].map((f, i) => (
            <div
              key={f.title}
              className="rounded-lg border border-border bg-card p-8 shadow-sm hover:shadow-md transition-shadow animate-fade-in"
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <f.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 Unified Social Media Analytics. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
