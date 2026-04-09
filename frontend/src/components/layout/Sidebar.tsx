import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  TrendingUp,
  User,
  Settings,
  LogOut,
  Leaf,
  Users,
  FileText,
  Sparkles,
  Calculator,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// Üye menüsü
const memberMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MessageSquare, label: "Mesajlar", path: "/messages" },
  { icon: Calculator, label: "Kalori Hesapla", path: "/calorie-calculator" },
  { icon: TrendingUp, label: "İlerleme", path: "/progress" },
  { icon: User, label: "Profil", path: "/profile" },
  { icon: Settings, label: "Ayarlar", path: "/settings" },
];

// Diyetisyen menüsü
const dietitianMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dietitian-dashboard" },
  { icon: Users, label: "Danışanlarım", path: "/dietitian-dashboard" },
  { icon: FileText, label: "Programlar", path: "/dietitian-dashboard" },
  { icon: MessageSquare, label: "Mesajlar", path: "/messages" },
  { icon: Zap, label: "Agentic AI", path: "/dietitian/agentic-ai" },
  { icon: Sparkles, label: "Günlük Rapor", path: "/dietitian/daily-report" },
  { icon: User, label: "Profil", path: "/profile" },
  { icon: Settings, label: "Ayarlar", path: "/settings" },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";

  // Role'e göre menü seç
  const menuItems = user?.role === "dietitian" ? dietitianMenuItems : memberMenuItems;

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-40">
      {/* Logo - links to home */}
      <Link to="/" className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors">
        <div className="w-10 h-10 rounded-xl bg-neon-gradient flex items-center justify-center neon-glow">
          <Leaf className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold gradient-text">DietPlatform</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path ||
            (item.path === "/dietitian-dashboard" && location.pathname.startsWith("/dietitian"));
          return (
            <Link
              key={`${item.path}-${index}`}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                isActive
                  ? "bg-primary/10 text-primary neon-border"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>


      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.full_name || "Kullanıcı"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-sidebar-border transition-colors"
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
};
