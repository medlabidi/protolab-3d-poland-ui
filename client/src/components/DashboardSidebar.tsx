import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Plus, Package, Settings, LogOut, Wallet, MessageSquare, Building2, Palette, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { stopTokenRefresh } from "@/utils/tokenRefresh";

export const DashboardSidebar = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { clearAllNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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

    // Stop auto token refresh
    stopTokenRefresh();

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
    { icon: Palette, label: "3D Design Assistance", path: "/design-assistance" },
    { icon: Package, label: t('dashboard.orders'), path: "/orders" },
    { icon: MessageSquare, label: t('sidebar.conversations'), path: "/conversations" },
    { icon: Wallet, label: t('sidebar.credits'), path: "/credits" },
    { icon: Building2, label: t('sidebar.business'), path: "/business" },
    { icon: Settings, label: t('dashboard.settings'), path: "/settings" },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-gray-900 text-white hover:bg-gray-800 border border-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 relative
        ${isCollapsed ? 'w-20' : 'w-64'} bg-gray-900 border-r border-gray-800 min-h-screen flex flex-col
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      
      {/* Toggle Button - Top Right */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-50 w-6 h-6 p-0 bg-gray-800 hover:bg-blue-600 border border-gray-700 rounded-full shadow-lg transition-all duration-200 hidden lg:flex items-center justify-center"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
        )}
      </Button>

      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <NavLink to="/" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          {isCollapsed ? (
            <Logo size="md" showText={false} />
          ) : (
            <Logo size="lg" showText={true} textClassName="text-white" />
          )}
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`flex items-center ${isCollapsed ? 'justify-center px-3' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 group text-gray-400 hover:text-white hover:bg-gray-800`}
            activeClassName="!bg-blue-600 !text-white shadow-lg shadow-blue-600/20"
            onClick={() => setIsOpen(false)}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5'} flex-shrink-0 group-hover:scale-110 transition-transform`} />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        {/* User info */}
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {localStorage.getItem('userName')?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {localStorage.getItem('userName') || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {localStorage.getItem('userEmail') || 'user@protolab.info'}
              </p>
            </div>
          </div>
        )}

        {/* Logout button */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} text-gray-400 hover:text-red-400 hover:bg-red-500/10`}
          title={isCollapsed ? t('dashboard.logout') : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-3">{t('dashboard.logout')}</span>}
        </Button>
      </div>
    </aside>
    </>
  );
};
