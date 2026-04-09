import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import NotificationBell from "@/components/NotificationBell";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Top Header with Notification Bell (visible on mobile) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-border flex items-center justify-end px-4">
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
