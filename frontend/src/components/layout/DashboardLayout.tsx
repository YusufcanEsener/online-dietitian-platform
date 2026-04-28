import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import NotificationBell from "@/components/NotificationBell";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backFallback?: string;
}

export const DashboardLayout = ({ children, title, showBack, backFallback }: DashboardLayoutProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    const historyIndex = typeof window !== "undefined" ? window.history.state?.idx ?? 0 : 0;

    if (historyIndex > 0) {
      navigate(-1);
      return;
    }

    if (backFallback) {
      navigate(backFallback, { replace: true });
      return;
    }

    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Top Header with Notification Bell (visible on mobile) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-border/50 bg-background/95 backdrop-blur-md flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={handleBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {title && <h1 className="text-lg font-semibold text-foreground">{title}</h1>}
        </div>
        <NotificationBell />
      </header>
      <main className="lg:ml-72 min-h-screen pb-24 lg:pb-0 pt-14 lg:pt-0">
        {/* Desktop Notification Bell */}
        <div className="hidden lg:flex justify-end p-4 pb-0">
          <NotificationBell />
        </div>
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
