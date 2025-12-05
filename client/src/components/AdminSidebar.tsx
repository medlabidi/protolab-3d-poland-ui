import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Printer,
  BarChart3,
  Bell,
  FileText,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin",
  },
  {
    title: "Orders",
    icon: Package,
    path: "/admin/orders",
  },
  {
    title: "Users",
    icon: Users,
    path: "/admin/users",
  },
  {
    title: "Printers",
    icon: Printer,
    path: "/admin/printers",
  },
  {
    title: "Materials",
    icon: Palette,
    path: "/admin/materials",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    path: "/admin/analytics",
  },
  {
    title: "Reports",
    icon: FileText,
    path: "/admin/reports",
  },
  {
    title: "Notifications",
    icon: Bell,
    path: "/admin/notifications",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/admin/settings",
  },
];

export const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Log activity before clearing localStorage
    const logoutActivity = {
      id: `activity_${Date.now()}`,
      type: 'logout',
      title: 'Admin Logout',
      description: 'Logged out of admin panel',
      timestamp: new Date().toISOString(),
      metadata: {
        device: navigator.platform || 'Unknown',
      },
    };
    const existingLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
    localStorage.setItem("activityLog", JSON.stringify([logoutActivity, ...existingLog].slice(0, 100)));

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  return (
    <aside
      className={cn(
        "bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 min-h-screen sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Logo size={collapsed ? "md" : "lg"} showText={!collapsed} textClassName="text-white" />
          {!collapsed && (
            <p className="text-xs text-gray-500">Admin Panel</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/admin' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive ? "text-white" : "text-gray-500 group-hover:text-white"
              )} />
              {!collapsed && (
                <span className="font-medium">{item.title}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        {/* User info */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {localStorage.getItem('userName')?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {localStorage.getItem('userName') || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {localStorage.getItem('userEmail') || 'admin@protolab.info'}
              </p>
            </div>
          </div>
        )}

        {/* Logout button */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-500/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full justify-center text-gray-500 hover:text-white hover:bg-gray-800",
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>
    </aside>
  );
};
