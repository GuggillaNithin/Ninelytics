import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import OverviewPage from "@/pages/dashboard/OverviewPage";
import ConnectionsPage from "@/pages/dashboard/ConnectionsPage";
import YouTubePage from "@/pages/dashboard/YouTubePage";
import GoogleAnalyticsPage from "@/pages/dashboard/GoogleAnalyticsPage";
import FacebookPage from "@/pages/dashboard/FacebookPage";
import InstagramPage from "@/pages/dashboard/InstagramPage";
import LinkedInPage from "@/pages/dashboard/LinkedInPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<OverviewPage />} />
                <Route path="connections" element={<ConnectionsPage />} />
                <Route path="youtube" element={<YouTubePage />} />
                <Route path="google-analytics" element={<GoogleAnalyticsPage />} />
                <Route path="facebook" element={<FacebookPage />} />
                <Route path="instagram" element={<InstagramPage />} />
                <Route path="linkedin" element={<LinkedInPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
