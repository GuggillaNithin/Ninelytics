import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Layers,
  LayoutDashboard,
  MessageSquare,
  MousePointer2,
  PlayCircle,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  Users,
  Wand2,
  Workflow,
  Zap,
  Lock,
  Triangle,
  Hexagon,
  Slack,
  Mail,
  Database,
  Calendar,
  Globe,
  GitMerge,
  BrainCircuit,
  LifeBuoy,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const [isFeatureVisible, setIsFeatureVisible] = useState(false);
  const featureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsFeatureVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    if (featureRef.current) {
      observer.observe(featureRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const [activeFeature, setActiveFeature] = useState(0);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const featuresList = [
    {
      title: "Manual Data Entry",
      description: "Auto-fill forms, sync data between tools instantly. Our AI parses incoming data and maps it to your existing fields automatically.",
      icon: LayoutDashboard,
      image: "/images/img1.png"
    },
    {
      title: "Missed Opportunities",
      description: "Stop losing leads, automate follow-ups and instantly close deals faster. Never let a prospect fall through the cracks again.",
      icon: Workflow,
      image: "/images/img2.png"
    },
    {
      title: "Slow Response Times",
      description: "Connect to CRM, send instant notifications and alerts. Respond to customer inquiries in seconds, not hours.",
      icon: Timer,
      image: "/images/img3.png"
    },
    {
      title: "Human Error",
      description: "No more copy-paste mistakes. 100% data accuracy guaranteed through automated validation and verification workflows.",
      icon: ShieldCheck,
      image: "/images/feature4.png"
    }
  ];

  useEffect(() => {
    const observers = cardsRef.current.map((card, index) => {
      if (!card) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveFeature(index);
          }
        },
        { 
          threshold: 0.6,
          rootMargin: "-10% 0px -10% 0px"
        }
      );
      observer.observe(card);
      return observer;
    });

    return () => {
      observers.forEach(o => o?.disconnect());
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/logo.png" alt="Ninelytics logo" className="w-9 h-9 object-contain" />
            <span className="text-xl font-bold tracking-tight">Ninelytics</span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#solutions" className="hover:text-primary transition-colors">Solutions</a>
            <a href="#resources" className="hover:text-primary transition-colors">Resources</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/login")} className="hidden md:inline-flex hover:bg-transparent hover:text-primary">
              Log in
            </Button>
            <Button onClick={() => navigate("/register")} className="shadow-lg shadow-primary/25 rounded-none">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Soft Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />
        
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto mb-6 leading-tight">
            Your ultimate solution for business <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Automation</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            FlowSync helps you to automate and integrate all of your apps in one place.
            Streamline your process and grow your business today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-base shadow-xl shadow-primary/20 rounded-none w-full sm:w-auto" onClick={() => navigate("/register")}>
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-none w-full sm:w-auto border-2 hover:bg-muted" onClick={() => navigate("/#features")}>
              Learn More
            </Button>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/10 rounded-xl blur-2xl opacity-50" />
            <div className="relative rounded-t-xl overflow-hidden border border-border bg-card shadow-2xl">
              {/* Mockup Header */}
              <div className="h-12 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto bg-background border border-border rounded-md text-xs text-muted-foreground px-12 py-1.5 flex items-center gap-2">
                  <Lock className="h-3 w-3" /> ninelytics.in/dashboard
                </div>
              </div>
              {/* Mockup Body */}
              <div className="relative bg-background">
                <img 
                  src="/images/dashboard1.png" 
                  alt="Ninelytics Dashboard" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Brands */}
      <section className="py-10 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">Trusted by innovative teams worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale">
            {/* Logos represented by text for simplicity, in a real app use SVGs */}
            <span className="text-xl font-bold flex items-center gap-1"><Triangle className="h-6 w-6"/> Notion</span>
            <span className="text-xl font-bold flex items-center gap-1"><MessageSquare className="h-6 w-6"/> Intercom</span>
            <span className="text-xl font-bold flex items-center gap-1"><Layers className="h-6 w-6"/> Segment</span>
            <span className="text-xl font-bold flex items-center gap-1"><Triangle className="h-6 w-6"/> Atlassian</span>
            <span className="text-xl font-bold flex items-center gap-1"><Hexagon className="h-6 w-6"/> Zendesk</span>
          </div>
        </div>
      </section>

      {/* Feature 1: AI-Driven Platform */}
      <section className="py-24 overflow-hidden" id="features">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                AI-Driven Platform<br/>Designed to<br/>Automate Workflows
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                At Ninelytics, we build tools that empower businesses to work smarter, scale faster, and deliver better experiences using AI automation. Our platform learns your habits to optimize your daily routines intuitively.
              </p>
              <Button size="lg" className="rounded-none shadow-lg shadow-primary/20">
                Get Started
              </Button>
            </div>
            {/* Animated Dashboard Image */}
            <div ref={featureRef} className="relative h-[500px] w-full flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl opacity-50" />
              <div className={`relative z-10 w-full max-w-2xl transition-all duration-1000 ease-out ${
                isFeatureVisible 
                  ? "opacity-100 translate-y-0 scale-100" 
                  : "opacity-0 translate-y-20 scale-95"
              }`}>
                <img 
                  src="/images/dashboard2.png" 
                  alt="Ninelytics Dashboard Features" 
                  className="w-full h-auto shadow-2xl rounded-lg border border-border/50"
                />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl -z-10 animate-pulse" />
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Sticky Scroll Solution */}
      <section className="py-24 bg-muted/30 relative">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-20">
            <p className="text-primary font-semibold tracking-wider uppercase mb-2">The Solution</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ninelytics is Built to Fix That</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Experience a new era of business efficiency with our automated ecosystem.
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-16 items-start relative">
            {/* Left Side: Sticky Image */}
            <div className="w-full lg:w-1/2 lg:sticky lg:top-32 order-2 lg:order-1">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-none shadow-2xl border border-border bg-card">
                {featuresList.map((f, i) => (
                  <img 
                    key={i}
                    src={f.image}
                    alt={f.title}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                      activeFeature === i ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-110 rotate-1 pointer-events-none'
                    }`}
                  />
                ))}
                <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />
                <div className="absolute bottom-4 left-4 right-4 h-1 bg-muted/20 overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${((activeFeature + 1) / featuresList.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right Side: Scrolling Content */}
            <div className="w-full lg:w-1/2 space-y-40 py-12 order-1 lg:order-2">
              {featuresList.map((f, i) => (
                <div 
                  key={i} 
                  ref={el => cardsRef.current[i] = el}
                  className="min-h-[400px] flex flex-col justify-center"
                >
                  <Card className={`rounded-none border-border shadow-2xl transition-all duration-700 bg-card p-10 group ${
                    activeFeature === i 
                      ? 'ring-1 ring-primary border-transparent translate-x-2' 
                      : 'opacity-30 scale-95 grayscale'
                  }`}>
                    <div className={`w-14 h-14 bg-primary/10 flex items-center justify-center mb-8 transition-colors duration-500 ${
                      activeFeature === i ? 'bg-primary text-primary-foreground' : ''
                    }`}>
                      <f.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-3xl font-bold mb-6">{f.title}</h3>
                    <p className="text-muted-foreground text-xl leading-relaxed">
                      {f.description}
                    </p>
                    <div className={`mt-8 h-1 w-0 bg-primary transition-all duration-1000 ${
                      activeFeature === i ? 'w-24' : ''
                    }`} />
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section className="py-24 relative">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="bg-gradient-to-br from-card to-card/50 border border-border shadow-2xl p-8 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="grid lg:grid-cols-5 gap-12 items-center relative z-10">
              <div className="lg:col-span-2">
                <p className="text-primary font-semibold tracking-wider uppercase mb-2">How It Works</p>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Automate In<br/>3 Steps!</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Ninelytics handles the heavy lifting, connecting your favorite apps so you can focus on what matters most to your business.
                </p>
                <div className="flex gap-4">
                  <Button size="lg" className="rounded-none px-8">Log In</Button>
                  <Button size="lg" variant="outline" className="rounded-none px-8 border-2">Get Started</Button>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                {[
                  { step: "Step 1", title: "Connect your go-to apps", desc: "Select from over 1,000+ integrations or simply build your own using our comprehensive open API endpoints." },
                  { step: "Step 2", title: "Customize your workflows", desc: "Use FlowSync's visual builder to map out your automation in seconds. No coding required." },
                  { step: "Step 3", title: "Sit back & watch it run", desc: "Automation takes care of the rest, giving you back hours of your day and eliminating manual errors entirely." }
                ].map((s, i) => (
                  <div key={i} className="bg-background/80 backdrop-blur border border-border/50 p-6 flex gap-6 hover:border-primary/50 transition-colors cursor-default shadow-sm group">
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-none inline-block mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{s.step}</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{s.title}</h4>
                      <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/20">
        <div className="container px-4 md:px-6 mx-auto text-center mb-16">
          <p className="text-primary font-semibold tracking-wider uppercase mb-2">Capabilities</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Features That Set us Apart</h2>
          <div className="flex justify-center gap-4">
            <Button className="rounded-none">Get Started</Button>
            <Button variant="outline" className="rounded-none">View Features</Button>
          </div>
        </div>

        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Layers, title: "Seamless Integrations", desc: "Connect your favorite tools with zero friction and robust API support." },
              { icon: BarChart3, title: "Real-Time Analytics", desc: "Monitor your workflow performance with comprehensive real-time dashboards." },
              { icon: Workflow, title: "Intelligent Workflows", desc: "Create conditional logic that adapts dynamically to your business data." },
              { icon: GitMerge, title: "Multi-Step Workflows", desc: "Chain unlimited actions together to automate entire departmental processes." },
              { icon: BrainCircuit, title: "Build-In AI capabilities", desc: "Leverage native AI to parse emails, analyze sentiment, and draft responses." },
              { icon: LifeBuoy, title: "Reliable Tech Support", desc: "24/7 expert assistance ensuring your critical workflows never go down." },
            ].map((f, i) => (
              <Card key={i} className="rounded-none border-border shadow-sm hover:shadow-lg transition-shadow bg-card h-full flex flex-col">
                <CardHeader>
                  <f.icon className="h-8 w-8 text-primary mb-4" />
                  <CardTitle>{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="text-base text-muted-foreground">{f.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Arch */}
      <section className="py-32 overflow-hidden text-center">
        <div className="container px-4 mx-auto max-w-4xl relative">
          <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full" />
          <p className="text-primary font-semibold tracking-wider uppercase mb-2">Ecosystem</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Connect, Automate, and Scale</h2>
          <p className="text-muted-foreground text-lg mb-16">
            You can direct the relevant data to different apps sending a single API request to Ninelytics.
          </p>

          <div className="relative h-64 md:h-80 flex items-center justify-center">
             {/* Simple visual representation of an arch of connections */}
             <div className="absolute w-[120%] h-[300px] border-t-2 border-dashed border-primary/30 rounded-[100%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80%]" />
             
             {/* Center Logo */}
             <div className="relative z-20 w-24 h-24 bg-primary rounded-none shadow-xl shadow-primary/30 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-primary-foreground" />
             </div>

             {/* Orbiting Icons */}
             <div className="absolute top-0 left-[20%] w-16 h-16 bg-card border border-border shadow-lg flex items-center justify-center hover:-translate-y-2 transition-transform cursor-pointer">
               <Slack className="h-8 w-8 text-foreground" />
             </div>
             <div className="absolute top-[-20px] left-[40%] w-12 h-12 bg-card border border-border shadow-lg flex items-center justify-center hover:-translate-y-2 transition-transform cursor-pointer">
               <Mail className="h-6 w-6 text-foreground" />
             </div>
             <div className="absolute top-[-20px] right-[40%] w-12 h-12 bg-card border border-border shadow-lg flex items-center justify-center hover:-translate-y-2 transition-transform cursor-pointer">
               <Database className="h-6 w-6 text-foreground" />
             </div>
             <div className="absolute top-0 right-[20%] w-16 h-16 bg-card border border-border shadow-lg flex items-center justify-center hover:-translate-y-2 transition-transform cursor-pointer">
               <Calendar className="h-8 w-8 text-foreground" />
             </div>
             <div className="absolute top-[40%] left-[10%] w-14 h-14 bg-card border border-border shadow-lg flex items-center justify-center hover:-translate-y-2 transition-transform cursor-pointer">
               <MessageSquare className="h-7 w-7 text-foreground" />
             </div>
             <div className="absolute top-[40%] right-[10%] w-14 h-14 bg-card border border-border shadow-lg flex items-center justify-center hover:-translate-y-2 transition-transform cursor-pointer">
               <Globe className="h-7 w-7 text-foreground" />
             </div>
          </div>
          <div className="mt-8">
            <Button variant="link" className="text-primary hover:text-primary/80 font-semibold" onClick={() => navigate("/integrations")}>
              View All 1,000+ Integrations <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-muted/20" id="pricing">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold tracking-wider uppercase mb-2">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Flexible Plans for Every Business</h2>
            <p className="text-muted-foreground text-lg">Start for free, upgrade when you need more power.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            {/* Free Plan */}
            <Card className="rounded-none border-border shadow-sm p-6 bg-card h-[450px] flex flex-col pt-8">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">$0</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> 100 Actions / month</li>
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> 5 Active Workflows</li>
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Multi-step Zaps</li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-muted-foreground/30" /> Premium Apps</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full rounded-none border-2">Get Started</Button>
            </Card>

            {/* Pro Plan */}
            <Card className="rounded-none border-primary shadow-xl shadow-primary/10 p-8 pt-10 bg-card h-[500px] flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />
              <div className="absolute top-0 right-0 max-w-fit px-3 py-1 bg-primary text-primary-foreground text-xs font-bold shrink-0 mb-4 inline-block transform -translate-y-1/2">MOST POPULAR</div>
              <div className="flex-1 mt-4">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-extrabold">$49</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-8">Billed annually</p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> 5,000 Actions / month</li>
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Unlimited Workflows</li>
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Multi-step Zaps</li>
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Premium Apps</li>
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> 24/7 Priority Support</li>
                </ul>
              </div>
              <Button className="w-full rounded-none h-12 text-base shadow-md shadow-primary/20">Go Pro</Button>
            </Card>

            {/* Enterprise Plan */}
            <Card className="rounded-none border-border shadow-sm p-6 bg-card h-[450px] flex flex-col pt-8">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">Custom</span>
                </div>
                <p className="text-sm text-muted-foreground mb-8">For large teams and orgs.</p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Unlimited Everything</li>
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Dedicated Success Manager</li>
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> SAML SSO</li>
                  <li className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Custom Integrations</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full rounded-none border-2">Contact Sales</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background -z-10" />
        <div className="container px-4 md:px-6 mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 max-w-2xl mx-auto">
            Supercharge Your Workflow – Try FlowSync Now
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Join thousands of businesses saving hours every week. Setup takes less than 5 minutes.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-base shadow-xl shadow-primary/20 rounded-none w-full sm:w-auto" onClick={() => navigate("/register")}>
              Get Started for Free
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-none w-full sm:w-auto border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:bg-muted">
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card pt-16 pb-8">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <img src="/logo.png" alt="Ninelytics logo" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold tracking-tight">Ninelytics</span>
              </div>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                Automate your work and get more done. With FlowSync, you can connect your favorite apps and automate multi-step workflows in minutes.
              </p>
              <div className="flex gap-4">
                {/* Social icons */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"><MessageSquare className="h-4 w-4" /></div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"><Globe className="h-4 w-4" /></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Docs</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Partners</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Ninelytics. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Terms of Service</a>
              <a href="#" className="hover:text-foreground">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
