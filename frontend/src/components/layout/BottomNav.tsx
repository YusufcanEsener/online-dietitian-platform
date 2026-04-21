import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  TrendingUp, 
  User,
  Zap,
  Sparkles,
  Newspaper
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const memberNavItems = [
  { icon: LayoutDashboard, label: "Ana Sayfa", path: "/dashboard" },
  { icon: MessageSquare, label: "Mesajlar", path: "/messages" },
  { icon: TrendingUp, label: "İlerleme", path: "/progress" },
  { icon: User, label: "Profil", path: "/profile" },
];

const dietitianNavItems = [
  { icon: LayoutDashboard, label: "Ana Sayfa", path: "/dietitian-dashboard" },
  { icon: MessageSquare, label: "Mesajlar", path: "/messages" },
  { icon: Newspaper, label: "Haberler", path: "/dietitian/news" },
  { icon: Zap, label: "AI", path: "/dietitian/agentic-ai" },
  { icon: User, label: "Profil", path: "/profile" },
];

export const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const navItems = user?.role === "dietitian" ? dietitianNavItems : memberNavItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-inset-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive && "bg-primary/10 neon-border"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
