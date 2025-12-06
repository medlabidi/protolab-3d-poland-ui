import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Plus, Package, Settings, LogOut, Wallet, MessageSquare, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

export const DashboardSidebar = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { clearAllNotifications } = useNotifications();
  
  const handleLogout = () => {
    // Log activity before clearing localStorage
    const logoutActivity = {
      id: `activity_${Date.now()}`,
      type: 'logout',
      title: 'Logout',
      description: 'Logged out of your account',
      timestamp: new Date().toISOString(),
      metadata: {
        device: navigator.platform || 'Unknown',
      },
    };
    const existingLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
    localStorage.setItem("activityLog", JSON.stringify([logoutActivity, ...existingLog].slice(0, 100)));

    // Clear all auth data from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    
    // Clear notifications
    clearAllNotifications();
    
    // Show success message
    toast.success(t('dashboard.logoutSuccess') || 'Logged out successfully');
    
    // Redirect to signin page
    navigate('/signin');
  };
  
  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard.overview'), path: "/dashboard" },
    { icon: Plus, label: t('dashboard.newPrint'), path: "/new-print" },
    { icon: Package, label: t('dashboard.orders'), path: "/orders" },
    { icon: MessageSquare, label: t('sidebar.conversations'), path: "/conversations" },
    { icon: Wallet, label: t('sidebar.credits'), path: "/credits" },
    { icon: Building2, label: t('sidebar.business'), path: "/business" },
    { icon: Settings, label: t('dashboard.settings'), path: "/settings" },
  ];

  return (
    <aside className="w-72 bg-gradient-to-b from-card to-muted/20 border-r border-border/50 min-h-screen p-6 flex flex-col shadow-xl">
      <div className="mb-12 animate-slide-up">
        <NavLink to="/" className="flex items-center gap-3 text-xl font-bold group">
          <Logo size="lg" textClassName="text-xl" />
        </NavLink>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-5 py-4 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 group relative overflow-hidden animate-slide-up"
            activeClassName="bg-gradient-to-r from-primary to-purple-600 text-white hover:from-primary hover:to-purple-600 shadow-lg scale-105"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform z-10" />
            <span className="font-semibold z-10">{item.label}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </NavLink>
        ))}
      </nav>

      <Separator className="my-6 bg-border/50" />

      <Button
        variant="ghost"
        className="justify-start gap-3 px-5 py-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300 group hover-lift"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-semibold">{t('dashboard.logout')}</span>
      </Button>

      {/* Decorative Element */}
      <div className="mt-6 p-4 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-xl border border-primary/20">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">{t('sidebar.needHelp')}</p>
        <p className="text-sm font-bold text-primary">{t('sidebar.contactSupport')}</p>
      </div>
    </aside>
  );
};
