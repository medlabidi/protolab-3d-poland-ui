import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Plus, Package, Settings, LogOut, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";

export const DashboardSidebar = () => {
  const { t } = useLanguage();
  
  const menuItems = [
    { icon: LayoutDashboard, label: t.dashboard.overview, path: "/dashboard" },
    { icon: Plus, label: t.dashboard.newPrint, path: "/new-print" },
    { icon: Package, label: t.dashboard.orders, path: "/orders" },
    { icon: Settings, label: t.dashboard.settings, path: "/settings" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:text-primary/90 transition-colors">
          <Box className="w-6 h-6" />
          {t.common.protolab}
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm"
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <Separator className="my-4" />

      <Button
        variant="ghost"
        className="justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => console.log("Logout")}
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">{t.dashboard.logout}</span>
      </Button>
    </aside>
  );
};
