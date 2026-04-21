import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Messages from "./pages/Messages";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

import DietitianDashboard from "./pages/DietitianDashboard";
import CreateNutritionPlan from "./pages/CreateNutritionPlan";
import EditNutritionPlan from "./pages/EditNutritionPlan";
import MemberDetail from "./pages/MemberDetail";

// AI Sayfaları
import CalorieCalculator from "./pages/CalorieCalculator";
import DailyReport from "./pages/DailyReport";
import AgenticDashboard from "./pages/AgenticDashboard";
import DetailedCalorieCalculator from "./pages/DetailedCalorieCalculator";

// Yasal Sayfalar
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import About from "./pages/About";
import Contact from "./pages/Contact";

// Rehber Sayfaları
import MemberGuide from "./pages/MemberGuide";
import DietitianGuide from "./pages/DietitianGuide";

// Haberler (sadece diyetisyen)
import DietitianNews from "./pages/DietitianNews";

const queryClient = new QueryClient();
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const App = () => (
  <GoogleOAuthProvider clientId={googleClientId}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/messages" element={<Messages />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/dietitian-dashboard" element={<DietitianDashboard />} />
                <Route path="/dietitian/create-plan/:memberId" element={<CreateNutritionPlan />} />
                <Route path="/dietitian/edit-plan/:planId" element={<EditNutritionPlan />} />
                <Route path="/dietitian/member/:memberId" element={<MemberDetail />} />
                {/* AI Sayfaları */}
                <Route path="/calorie-calculator" element={<CalorieCalculator />} />
                <Route path="/dietitian/calorie-calculator/:memberId" element={<CalorieCalculator />} />
                <Route path="/dietitian/daily-report" element={<DailyReport />} />
                <Route path="/dietitian/agentic-ai" element={<AgenticDashboard />} />
                <Route path="/dietitian/detailed-calorie-calculator" element={<DetailedCalorieCalculator />} />
                {/* Yasal Sayfalar */}
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                {/* Rehber Sayfaları */}
                <Route path="/guide/member" element={<MemberGuide />} />
                <Route path="/guide/dietitian" element={<DietitianGuide />} />
                {/* Haberler - sadece diyetisyen */}
                <Route path="/dietitian/news" element={<DietitianNews />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;

