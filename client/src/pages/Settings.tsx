import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { API_URL } from "@/config/api";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { languages } from "@/i18n";
import i18n from "@/i18n";
import { 
  User, 
  Monitor, 
  Shield, 
  CreditCard, 
  Bell, 
  Building2, 
  Lock, 
  ChevronRight,
  Key,
  Smartphone,
  Eye,
  Trash2,
  Download,
  FileText,
  Plus,
  Wallet,
  Building,
  CheckCircle2,
  Laptop,
  Globe,
  MapPin,
  Clock,
  LogOut,
  Sun,
  Moon,
  MonitorSmartphone
} from "lucide-react";

interface SavedPaymentMethod {
  id: string;
  type: 'card';
  name: string;
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
}

interface Session {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

interface ActivityLogItem {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'profile_update' | 'order_created' | 'payment' | 'settings_change' | 'security';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    ip?: string;
    device?: string;
    location?: string;
    orderId?: string;
    amount?: number;
  };
}

// Helper to get valid access token (refreshes only if the current token fails)
const getValidAccessToken = async (): Promise<string | null> => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!accessToken) {
    console.log('No access token found');
    return null;
  }
  
  // Return the current token - let the caller handle 401 errors
  // This avoids unnecessary refresh calls when the token is still valid
  return accessToken;
};

// Helper to refresh token when needed
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    console.log('No refresh token available');
    return null;
  }
  
  try {
    console.log('Attempting token refresh...');
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.tokens) {
        console.log('Token refresh successful');
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        return data.tokens.accessToken;
      }
    } else {
      console.log('Token refresh failed, status:', response.status);
      // If refresh fails, clear auth state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
      return null;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
  }
  
  return null;
};

const Settings = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>("general");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    country: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [newCardData, setNewCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cardholderName: '',
  });

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionToTerminate, setSessionToTerminate] = useState<string | null>(null);
  const [showTerminateAllDialog, setShowTerminateAllDialog] = useState(false);

  // Activity log state
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [showActivityLogDialog, setShowActivityLogDialog] = useState(false);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    // Billing & Payment notifications
    paymentConfirmation: true,
    paymentFailed: true,
    refundProcessed: true,
    invoiceReady: true,
    // Order & Shipping notifications
    orderConfirmation: true,
    orderStatusChange: true,
    printStarted: true,
    printCompleted: true,
    shippingUpdate: true,
    deliveryConfirmation: true,
    // Marketing
    marketingEmails: true,
    promotions: true,
  });

  // Settings menu items
  const menuItems = [
    { id: "general", labelKey: "menu.general", descKey: "menu.generalDesc", icon: User },
    { id: "display", labelKey: "menu.display", descKey: "menu.displayDesc", icon: Monitor },
    { id: "security", labelKey: "menu.security", descKey: "menu.securityDesc", icon: Shield },
    { id: "payment", labelKey: "menu.payment", descKey: "menu.paymentDesc", icon: CreditCard },
    { id: "notifications", labelKey: "menu.notifications", descKey: "menu.notificationsDesc", icon: Bell },
    { id: "privacy", labelKey: "menu.privacy", descKey: "menu.privacyDesc", icon: Lock },
  ];

  useEffect(() => {
    // Load user data from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setFormData({
          firstName: userData.first_name || userData.firstName || "",
          lastName: userData.last_name || userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          city: userData.city || "",
          zipCode: userData.zip_code || "",
          country: userData.country || "",
        });
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }

    // Load payment methods from localStorage
    const savedMethods = localStorage.getItem("paymentMethods");
    if (savedMethods) {
      try {
        setPaymentMethods(JSON.parse(savedMethods));
      } catch (error) {
        console.error("Failed to parse payment methods:", error);
      }
    }

    // Load notification settings from localStorage
    const savedNotificationSettings = localStorage.getItem("notificationSettings");
    if (savedNotificationSettings) {
      try {
        const saved = JSON.parse(savedNotificationSettings);
        // Check if saved settings have the new keys, otherwise use defaults
        if ('paymentConfirmation' in saved) {
          setNotificationSettings(prev => ({ ...prev, ...saved }));
        } else {
          // Old format detected, clear and use defaults
          localStorage.removeItem("notificationSettings");
        }
      } catch (error) {
        console.error("Failed to parse notification settings:", error);
      }
    }

    // Initialize sessions - detect current session and load saved sessions
    initializeSessions();

    // Load activity log from localStorage
    loadActivityLog();
  }, []);

  // Check URL for section navigation (e.g., from password change button)
  useEffect(() => {
    // Check if there's a hash to scroll to password section
    if (window.location.hash === '#password-section') {
      setActiveSection('security');
      // Small delay to ensure section is rendered
      setTimeout(() => {
        document.getElementById('password-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  // Activity log functions
  const loadActivityLog = () => {
    const savedLog = localStorage.getItem("activityLog");
    if (savedLog) {
      try {
        const log = JSON.parse(savedLog);
        setActivityLog(log);
      } catch (error) {
        console.error("Failed to parse activity log:", error);
      }
    }
  };

  const addActivityLogEntry = (entry: Omit<ActivityLogItem, 'id' | 'timestamp'>) => {
    const newEntry: ActivityLogItem = {
      ...entry,
      id: `activity_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    
    setActivityLog(prev => {
      const updated = [newEntry, ...prev].slice(0, 100); // Keep last 100 entries
      localStorage.setItem("activityLog", JSON.stringify(updated));
      return updated;
    });
  };

  const clearActivityLog = () => {
    setActivityLog([]);
    localStorage.removeItem("activityLog");
    toast.success("Activity log cleared");
  };

  const getActivityIcon = (type: ActivityLogItem['type']) => {
    switch (type) {
      case 'login': return '🔓';
      case 'logout': return '🔒';
      case 'password_change': return '🔑';
      case 'profile_update': return '👤';
      case 'order_created': return '📦';
      case 'payment': return '💳';
      case 'settings_change': return '⚙️';
      case 'security': return '🛡️';
      default: return '📝';
    }
  };

  // Session management
  const initializeSessions = () => {
    const savedSessions = localStorage.getItem("userSessions");
    let existingSessions: Session[] = [];
    
    if (savedSessions) {
      try {
        existingSessions = JSON.parse(savedSessions);
      } catch (error) {
        console.error("Failed to parse sessions:", error);
      }
    }

    // Detect current session info
    const currentSessionId = localStorage.getItem("currentSessionId") || `session_${Date.now()}`;
    localStorage.setItem("currentSessionId", currentSessionId);

    const userAgent = navigator.userAgent;
    const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) 
      ? (/iPad|Tablet/.test(userAgent) ? 'tablet' : 'mobile') 
      : 'desktop';
    
    const browser = detectBrowser(userAgent);
    const device = detectDevice(userAgent);

    // Check if current session exists
    const currentSessionExists = existingSessions.some(s => s.id === currentSessionId);
    
    if (!currentSessionExists) {
      // Add current session
      const currentSession: Session = {
        id: currentSessionId,
        device,
        deviceType,
        browser,
        location: "Current Location",
        ipAddress: "Your IP",
        lastActive: new Date().toISOString(),
        isCurrent: true,
      };

      // If this is the first time (no saved sessions), add some demo sessions
      if (existingSessions.length === 0) {
        const demoSessions: Session[] = [
          {
            id: `session_demo_1`,
            device: "iPhone",
            deviceType: 'mobile',
            browser: "Safari",
            location: "Warsaw, Poland",
            ipAddress: "192.168.1.x",
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            isCurrent: false,
          },
          {
            id: `session_demo_2`,
            device: "Windows PC",
            deviceType: 'desktop',
            browser: "Firefox",
            location: "Krakow, Poland",
            ipAddress: "192.168.2.x",
            lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            isCurrent: false,
          },
        ];
        existingSessions = [currentSession, ...demoSessions];
      } else {
        existingSessions = [currentSession, ...existingSessions.map(s => ({ ...s, isCurrent: false }))];
      }
    } else {
      // Update current session's last active time
      existingSessions = existingSessions.map(s => 
        s.id === currentSessionId 
          ? { ...s, lastActive: new Date().toISOString(), isCurrent: true }
          : { ...s, isCurrent: false }
      );
    }

    setSessions(existingSessions);
    localStorage.setItem("userSessions", JSON.stringify(existingSessions));
  };

  const detectBrowser = (userAgent: string): string => {
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Edg")) return "Microsoft Edge";
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Opera") || userAgent.includes("OPR")) return "Opera";
    return "Unknown Browser";
  };

  const detectDevice = (userAgent: string): string => {
    if (/iPhone/.test(userAgent)) return "iPhone";
    if (/iPad/.test(userAgent)) return "iPad";
    if (/Android/.test(userAgent)) return "Android Device";
    if (/Windows/.test(userAgent)) return "Windows PC";
    if (/Mac/.test(userAgent)) return "Mac";
    if (/Linux/.test(userAgent)) return "Linux PC";
    return "Unknown Device";
  };

  const openTerminateSessionDialog = (sessionId: string) => {
    setSessionToTerminate(sessionId);
  };

  const confirmTerminateSession = () => {
    if (!sessionToTerminate) return;
    
    const session = sessions.find(s => s.id === sessionToTerminate);
    if (session?.isCurrent) {
      toast.error("Cannot terminate current session. Use logout instead.");
      setSessionToTerminate(null);
      return;
    }

    const updatedSessions = sessions.filter(s => s.id !== sessionToTerminate);
    setSessions(updatedSessions);
    localStorage.setItem("userSessions", JSON.stringify(updatedSessions));
    toast.success("Session terminated successfully");
    setSessionToTerminate(null);
  };

  const openTerminateAllDialog = () => {
    setShowTerminateAllDialog(true);
  };

  const confirmTerminateAllOtherSessions = () => {
    const currentSession = sessions.find(s => s.isCurrent);
    if (currentSession) {
      const updatedSessions = [currentSession];
      setSessions(updatedSessions);
      localStorage.setItem("userSessions", JSON.stringify(updatedSessions));
      toast.success("All other sessions have been terminated");
    }
    setShowTerminateAllDialog(false);
  };

  const formatLastActive = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getSessionIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Monitor className="w-5 h-5" />;
      default: return <Laptop className="w-5 h-5" />;
    }
  };

  // Notification settings handlers
  const handleNotificationChange = (setting: keyof typeof notificationSettings, value: boolean) => {
    const updatedSettings = { ...notificationSettings, [setting]: value };
    setNotificationSettings(updatedSettings);
    localStorage.setItem("notificationSettings", JSON.stringify(updatedSettings));
    
    const settingLabels: Record<string, string> = {
      // Billing & Payment
      paymentConfirmation: "Payment confirmation emails",
      paymentFailed: "Payment failed alerts",
      refundProcessed: "Refund notifications",
      invoiceReady: "Invoice ready notifications",
      // Order & Shipping
      orderConfirmation: "Order confirmation emails",
      orderStatusChange: "Order status updates",
      printStarted: "Print started notifications",
      printCompleted: "Print completed notifications",
      shippingUpdate: "Shipping updates",
      deliveryConfirmation: "Delivery confirmations",
      // Marketing
      marketingEmails: "Marketing emails",
      promotions: "Promotional offers",
    };
    
    toast.success(`${settingLabels[setting]} ${value ? 'enabled' : 'disabled'}`);
  };

  // Payment methods handlers
  const savePaymentMethodsToStorage = (methods: SavedPaymentMethod[]) => {
    localStorage.setItem("paymentMethods", JSON.stringify(methods));
  };

  const handleAddPaymentMethod = () => {
    const id = `pm_${Date.now()}`;

    if (!newCardData.cardNumber || !newCardData.expiryDate || !newCardData.cardholderName) {
      toast.error("Please fill in all card details");
      return;
    }
    
    const last4 = newCardData.cardNumber.replace(/\s/g, '').slice(-4);
    const newMethod: SavedPaymentMethod = {
      id,
      type: 'card',
      name: newCardData.cardholderName,
      last4,
      expiryDate: newCardData.expiryDate,
      isDefault: paymentMethods.length === 0,
    };

    const updatedMethods = [...paymentMethods, newMethod];
    setPaymentMethods(updatedMethods);
    savePaymentMethodsToStorage(updatedMethods);
    
    setShowAddPaymentDialog(false);
    setNewCardData({ cardNumber: '', expiryDate: '', cardholderName: '' });
    addActivityLogEntry({ type: 'payment', title: 'Payment Method Added', description: `Added card ending in ${last4}` });
    toast.success("Card added successfully");
  };

  const handleRemovePaymentMethod = (id: string) => {
    const methodToRemove = paymentMethods.find(m => m.id === id);
    const updatedMethods = paymentMethods.filter(m => m.id !== id);
    
    // If we removed the default, set the first remaining as default
    if (methodToRemove?.isDefault && updatedMethods.length > 0) {
      updatedMethods[0].isDefault = true;
    }
    
    setPaymentMethods(updatedMethods);
    savePaymentMethodsToStorage(updatedMethods);
    addActivityLogEntry({ type: 'payment', title: 'Payment Method Removed', description: `Removed card ending in ${methodToRemove?.last4 || 'unknown'}` });
    toast.success("Payment method removed");
  };

  const handleSetDefaultPaymentMethod = (id: string) => {
    const method = paymentMethods.find(m => m.id === id);
    const updatedMethods = paymentMethods.map(m => ({
      ...m,
      isDefault: m.id === id,
    }));
    setPaymentMethods(updatedMethods);
    savePaymentMethodsToStorage(updatedMethods);
    addActivityLogEntry({ type: 'payment', title: 'Default Payment Updated', description: `Set card ending in ${method?.last4 || 'unknown'} as default` });
    toast.success("Default payment method updated");
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      // Update localStorage
      const updatedUser = {
        ...user,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        zip_code: formData.zipCode,
        country: formData.country,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Call API to persist changes
      let token = await getValidAccessToken();
      if (!token) {
        toast.error("Please log in again");
        return;
      }

      const makeRequest = async (authToken: string) => {
        return fetch(`${API_URL}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            country: formData.country,
          }),
        });
      };

      let response = await makeRequest(token);

      // If we get a 401, try refreshing the token and retry once
      if (response.status === 401) {
        console.log('Got 401, attempting token refresh...');
        const newToken = await refreshAccessToken();
        if (newToken) {
          response = await makeRequest(newToken);
        } else {
          toast.error("Session expired. Please log in again.");
          window.location.href = '/login';
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile update error:', errorData);
        throw new Error(errorData.error || 'Failed to update profile on server');
      }
      
      addActivityLogEntry({ type: 'profile_update', title: 'Profile Updated', description: 'You updated your profile information' });
      toast.success(t('settings.toasts.profileUpdated'));
    } catch (error) {
      toast.error(t('settings.toasts.profileUpdateFailed'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        toast.error(t('settings.toasts.fillAllFields'));
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        toast.error(t('settings.toasts.passwordsMismatch'));
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        toast.error(t('settings.toasts.passwordTooShort'));
        return;
      }

      // Call API to change password
      const token = await getValidAccessToken();
      if (!token) {
        toast.error(t('settings.toasts.loginRequired'));
        return;
      }

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('settings.toasts.passwordChangeFailed'));
      }
      
      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      
      addActivityLogEntry({ type: 'password_change', title: 'Password Changed', description: 'You changed your account password' });
      toast.success(t('settings.toasts.passwordChanged'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.toasts.passwordChangeFailed'));
      console.error(error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      addActivityLogEntry({ type: 'security', title: 'Account Deleted', description: 'You deleted your account' });
      // Clear localStorage and redirect to login
      localStorage.clear();
      window.location.href = '/login';
      toast.success(t('settings.toasts.accountDeleted'));
    } catch (error) {
      toast.error(t('settings.toasts.deleteAccountFailed'));
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('settings.title')}</h1>
            <p className="text-muted-foreground">{t('settings.profile.description')}</p>
          </div>

          <div className="flex gap-8">
            {/* Settings Navigation */}
            <div className="w-72 shrink-0">
              <Card>
                <CardContent className="p-2">
                  <nav className="space-y-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          activeSection === item.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{t(`settings.${item.labelKey}`)}</p>
                          <p className={`text-xs truncate ${
                            activeSection === item.id 
                              ? "text-primary-foreground/70" 
                              : "text-muted-foreground"
                          }`}>
                            {t(`settings.${item.descKey}`)}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${
                          activeSection === item.id ? "opacity-100" : "opacity-0"
                        }`} />
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Settings Content */}
            <div className="flex-1 space-y-6">
              {/* General Settings */}
              {activeSection === "general" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {t('settings.general.title')}
                    </CardTitle>
                    <CardDescription>{t('settings.general.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{t('settings.general.firstName')}</Label>
                        <Input 
                          id="firstName" 
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">{t('settings.general.lastName')}</Label>
                        <Input 
                          id="lastName" 
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('settings.general.emailAddress')}</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">{t('settings.general.emailCannotChange')}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('settings.general.phoneNumber')}</Label>
                      <Input 
                        id="phone" 
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+48 123 456 789"
                      />
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">{t('settings.general.shippingAddress')}</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">{t('settings.general.streetAddress')}</Label>
                          <Input 
                            id="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="ul. Example 123"
                          />
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">{t('settings.general.city')}</Label>
                            <Input 
                              id="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              placeholder="Kraków"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zipCode">{t('settings.general.postalCode')}</Label>
                            <Input 
                              id="zipCode"
                              value={formData.zipCode}
                              onChange={handleInputChange}
                              placeholder="30-000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">{t('settings.general.country')}</Label>
                            <Input 
                              id="country"
                              value={formData.country}
                              onChange={handleInputChange}
                              placeholder="Poland"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={isLoading}>
                        {isLoading ? t('settings.general.saving') : t('settings.general.saveChanges')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Display Settings */}
              {activeSection === "display" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      {t('settings.display.title')}
                    </CardTitle>
                    <CardDescription>{t('settings.display.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Theme Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <Monitor className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{t('settings.display.theme')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.display.themeDescription')}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => {
                            setTheme("light");
                            addActivityLogEntry({ type: 'settings_change', title: 'Theme Changed', description: 'Changed theme to Light mode' });
                          }}
                          className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all hover:border-primary ${
                            theme === "light" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
                          }`}
                        >
                          <div className={`p-3 rounded-full ${theme === "light" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            <Sun className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium">{t('settings.display.light')}</span>
                          {theme === "light" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </button>

                        <button
                          onClick={() => {
                            setTheme("dark");
                            addActivityLogEntry({ type: 'settings_change', title: 'Theme Changed', description: 'Changed theme to Dark mode' });
                          }}
                          className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all hover:border-primary ${
                            theme === "dark" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
                          }`}
                        >
                          <div className={`p-3 rounded-full ${theme === "dark" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            <Moon className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium">{t('settings.display.dark')}</span>
                          {theme === "dark" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </button>

                        <button
                          onClick={() => {
                            setTheme("system");
                            addActivityLogEntry({ type: 'settings_change', title: 'Theme Changed', description: 'Changed theme to System default' });
                          }}
                          className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all hover:border-primary ${
                            theme === "system" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
                          }`}
                        >
                          <div className={`p-3 rounded-full ${theme === "system" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            <MonitorSmartphone className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium">{t('settings.display.system')}</span>
                          {theme === "system" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </button>
                      </div>

                      {theme === "system" && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          {t('settings.display.currentlyUsing')} {resolvedTheme === 'dark' ? t('settings.display.dark').toLowerCase() : t('settings.display.light').toLowerCase()} {t('settings.display.modeBasedOnSystem')}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Language Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{t('settings.display.language')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.display.languageDescription')}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code as 'pl' | 'en' | 'ru');
                              addActivityLogEntry({ type: 'settings_change', title: 'Language Changed', description: `Changed language to ${lang.name}` });
                              toast.success(t('settings.toasts.languageChanged'));
                            }}
                            className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all hover:border-primary ${
                              language === lang.code ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
                            }`}
                          >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="text-sm font-medium">{lang.name}</span>
                            {language === lang.code && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security Settings */}
              {activeSection === "security" && (
                <>
                  <Card id="password-section">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        {t('settings.security.changePassword')}
                      </CardTitle>
                      <CardDescription>{t('settings.security.changePasswordDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">{t('settings.security.currentPassword')}</Label>
                        <Input 
                          id="currentPassword" 
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">{t('settings.security.newPassword')}</Label>
                          <Input 
                            id="newPassword" 
                            type="password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmNewPassword">{t('settings.security.confirmNewPassword')}</Label>
                          <Input 
                            id="confirmNewPassword" 
                            type="password"
                            value={passwordData.confirmNewPassword}
                            onChange={handlePasswordChange}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={handleChangePassword}>
                          {t('settings.security.updatePassword')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        {t('settings.security.activeSessions')}
                      </CardTitle>
                      <CardDescription>{t('settings.security.activeSessionsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sessions.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Globe className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">{t('settings.security.noActiveSessions')}</p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {sessions.map((session) => (
                              <div 
                                key={session.id} 
                                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                                  session.isCurrent ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`p-2.5 rounded-lg ${session.isCurrent ? 'bg-primary/10' : 'bg-muted'}`}>
                                    {getSessionIcon(session.deviceType)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{session.device}</p>
                                      {session.isCurrent && (
                                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                          {t('settings.security.current')}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {session.browser}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatLastActive(session.lastActive)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {!session.isCurrent && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => openTerminateSessionDialog(session.id)}
                                  >
                                    <LogOut className="w-4 h-4 mr-1" />
                                    {t('settings.security.terminate')}
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {sessions.length > 1 && (
                            <div className="pt-2 border-t">
                              <Button 
                                variant="outline" 
                                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={openTerminateAllDialog}
                              >
                                <LogOut className="w-4 h-4 mr-2" />
                                {t('settings.security.terminateAllOther')}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Payment Settings */}
              {activeSection === "payment" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        {t('settings.payment.title')}
                      </CardTitle>
                      <CardDescription>{t('settings.payment.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {paymentMethods.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">{t('settings.payment.noMethods')}</p>
                          <p className="text-sm">{t('settings.payment.addMethodHint')}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {paymentMethods.map((method) => (
                            <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${method.isDefault ? 'bg-primary/10' : 'bg-muted'}`}>
                                  <CreditCard className={`w-5 h-5 ${method.isDefault ? 'text-primary' : ''}`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">
                                      •••• •••• •••• {method.last4}
                                    </p>
                                    {method.isDefault && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t('settings.payment.default')}</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {method.name} • {t('settings.payment.expires')} {method.expiryDate}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!method.isDefault && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                  >
                                    {t('settings.payment.setDefault')}
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleRemovePaymentMethod(method.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => setShowAddPaymentDialog(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('settings.payment.addCard')}
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Notification Settings */}
              {activeSection === "notifications" && (
                <>
                  {/* Billing & Payment Notifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        {t('settings.notifications.billingTitle')}
                      </CardTitle>
                      <CardDescription>{t('settings.notifications.billingDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.paymentConfirmation')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.paymentConfirmationDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.paymentConfirmation} 
                          onCheckedChange={(checked) => handleNotificationChange('paymentConfirmation', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.paymentFailed')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.paymentFailedDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.paymentFailed} 
                          onCheckedChange={(checked) => handleNotificationChange('paymentFailed', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.refundProcessed')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.refundProcessedDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.refundProcessed} 
                          onCheckedChange={(checked) => handleNotificationChange('refundProcessed', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.invoiceReady')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.invoiceReadyDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.invoiceReady} 
                          onCheckedChange={(checked) => handleNotificationChange('invoiceReady', checked)} 
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order & Shipping Notifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        {t('settings.notifications.orderTitle')}
                      </CardTitle>
                      <CardDescription>{t('settings.notifications.orderDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.orderConfirmation')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.orderConfirmationDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.orderConfirmation} 
                          onCheckedChange={(checked) => handleNotificationChange('orderConfirmation', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.orderStatusChange')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.orderStatusChangeDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.orderStatusChange} 
                          onCheckedChange={(checked) => handleNotificationChange('orderStatusChange', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.printStarted')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.printStartedDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.printStarted} 
                          onCheckedChange={(checked) => handleNotificationChange('printStarted', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.printCompleted')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.printCompletedDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.printCompleted} 
                          onCheckedChange={(checked) => handleNotificationChange('printCompleted', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.shippingUpdates')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.shippingUpdatesDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.shippingUpdate} 
                          onCheckedChange={(checked) => handleNotificationChange('shippingUpdate', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.deliveryConfirmation')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.deliveryConfirmationDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.deliveryConfirmation} 
                          onCheckedChange={(checked) => handleNotificationChange('deliveryConfirmation', checked)} 
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Marketing Notifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {t('settings.notifications.marketingTitle')}
                      </CardTitle>
                      <CardDescription>{t('settings.notifications.marketingDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.marketingEmails')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.marketingEmailsDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.marketingEmails} 
                          onCheckedChange={(checked) => handleNotificationChange('marketingEmails', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{t('settings.notifications.promotionalOffers')}</p>
                          <p className="text-sm text-muted-foreground">{t('settings.notifications.promotionalOffersDesc')}</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.promotions} 
                          onCheckedChange={(checked) => handleNotificationChange('promotions', checked)} 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Privacy & Data Settings */}
              {activeSection === "privacy" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        {t('settings.privacy.title')}
                      </CardTitle>
                      <CardDescription>{t('settings.privacy.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <Download className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{t('settings.privacy.downloadData')}</p>
                            <p className="text-sm text-muted-foreground">{t('settings.privacy.downloadDataDesc')}</p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => toast.info(t('settings.toasts.dataExportComingSoon'))}>
                          {t('settings.privacy.request')}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <Eye className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{t('settings.privacy.activityLog')}</p>
                            <p className="text-sm text-muted-foreground">{t('settings.privacy.activityLogDesc')} ({activityLog.length} {t('settings.privacy.events')})</p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => setShowActivityLogDialog(true)}>
                          {t('settings.privacy.view')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Danger Zone */}
                  <Card className="border-destructive">
                    <CardHeader>
                      <CardTitle className="text-destructive flex items-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        {t('settings.privacy.dangerZone')}
                      </CardTitle>
                      <CardDescription>{t('settings.privacy.dangerZoneDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">{t('settings.privacy.deleteAccount')}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('settings.privacy.deleteConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('settings.privacy.deleteConfirmDesc')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('settings.privacy.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t('settings.privacy.deleteAccount')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Add Payment Method Dialog */}
        <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('settings.payment.addCardTitle')}</DialogTitle>
              <DialogDescription>
                {t('settings.payment.addCardDesc')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">{t('settings.payment.cardNumber')}</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={newCardData.cardNumber}
                      onChange={(e) => setNewCardData(prev => ({
                        ...prev,
                        cardNumber: formatCardNumber(e.target.value)
                      }))}
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">{t('settings.payment.expiryDate')}</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={newCardData.expiryDate}
                        onChange={(e) => setNewCardData(prev => ({
                          ...prev,
                          expiryDate: formatExpiryDate(e.target.value)
                        }))}
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardholderName">{t('settings.payment.cardholderName')}</Label>
                      <Input
                        id="cardholderName"
                        placeholder="John Doe"
                        value={newCardData.cardholderName}
                        onChange={(e) => setNewCardData(prev => ({
                          ...prev,
                          cardholderName: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {t('settings.payment.cardSecure')}
                  </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPaymentDialog(false)}>
                {t('settings.privacy.cancel')}
              </Button>
              <Button onClick={handleAddPaymentMethod}>
                <Plus className="w-4 h-4 mr-2" />
                {t('settings.payment.addCard')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Terminate Session Confirmation Dialog */}
        <AlertDialog open={!!sessionToTerminate} onOpenChange={(open) => !open && setSessionToTerminate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('settings.security.terminateSessionTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('settings.security.terminateSessionDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSessionToTerminate(null)}>{t('settings.privacy.cancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmTerminateSession}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('settings.security.terminateSession')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Terminate All Sessions Confirmation Dialog */}
        <AlertDialog open={showTerminateAllDialog} onOpenChange={setShowTerminateAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('settings.security.terminateAllTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('settings.security.terminateAllDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowTerminateAllDialog(false)}>{t('settings.privacy.cancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmTerminateAllOtherSessions}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('settings.security.terminateAll')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Activity Log Dialog */}
        <Dialog open={showActivityLogDialog} onOpenChange={setShowActivityLogDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {t('settings.privacy.activityLog')}
              </DialogTitle>
              <DialogDescription>
                {t('settings.privacy.activityLogDialogDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[50vh] space-y-3 pr-2">
              {activityLog.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">{t('settings.privacy.noActivity')}</p>
                  <p className="text-sm">{t('settings.privacy.noActivityDesc')}</p>
                </div>
              ) : (
                activityLog.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(activity.timestamp).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      {activity.metadata && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {activity.metadata.device && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {activity.metadata.device}
                            </span>
                          )}
                          {activity.metadata.location && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              📍 {activity.metadata.location}
                            </span>
                          )}
                          {activity.metadata.ip && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              IP: {activity.metadata.ip}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <DialogFooter className="flex-row justify-between sm:justify-between">
              {activityLog.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearActivityLog}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.privacy.clearLog')}
                </Button>
              )}
              <Button onClick={() => setShowActivityLogDialog(false)}>
                {t('settings.privacy.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Settings;
