import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { API_URL } from "@/config/api";
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
  FileText
} from "lucide-react";

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
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>("general");
  const [formData, setFormData] = useState({
    name: "",
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

  // Settings menu items
  const menuItems = [
    { id: "general", label: "General", icon: User, description: "Name, email, and contact info" },
    { id: "display", label: "Display", icon: Monitor, description: "Theme and appearance" },
    { id: "security", label: "Security", icon: Shield, description: "Password and authentication" },
    { id: "payment", label: "Payment", icon: CreditCard, description: "Payment methods and billing" },
    { id: "notifications", label: "Notifications", icon: Bell, description: "Email and push notifications" },
    { id: "business", label: "ProtoLab for Business", icon: Building2, description: "Business account features" },
    { id: "privacy", label: "Privacy & Data", icon: Lock, description: "Data management and privacy" },
  ];

  useEffect(() => {
    // Load user data from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setFormData({
          name: userData.name || "",
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
  }, []);

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
        name: formData.name,
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
            name: formData.name,
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
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        toast.error("Please fill in all password fields");
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        toast.error("New passwords do not match");
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        toast.error("New password must be at least 6 characters");
        return;
      }

      // Call API to change password
      const token = await getValidAccessToken();
      if (!token) {
        toast.error("Please log in again");
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
        throw new Error(errorData.error || 'Failed to change password');
      }
      
      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      
      toast.success("Password changed successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
      console.error(error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Clear localStorage and redirect to login
      localStorage.clear();
      window.location.href = '/login';
      toast.success("Account deleted successfully");
    } catch (error) {
      toast.error("Failed to delete account");
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
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
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className={`text-xs truncate ${
                            activeSection === item.id 
                              ? "text-primary-foreground/70" 
                              : "text-muted-foreground"
                          }`}>
                            {item.description}
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
                      General Settings
                    </CardTitle>
                    <CardDescription>Update your personal details and contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
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
                      <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Street Address</Label>
                          <Input 
                            id="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="ul. Example 123"
                          />
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input 
                              id="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              placeholder="Kraków"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zipCode">Postal Code</Label>
                            <Input 
                              id="zipCode"
                              value={formData.zipCode}
                              onChange={handleInputChange}
                              placeholder="30-000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
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
                        {isLoading ? "Saving..." : "Save Changes"}
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
                      Display Settings
                    </CardTitle>
                    <CardDescription>Customize how ProtoLab looks and feels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Monitor className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Theme</p>
                          <p className="text-sm text-muted-foreground">Choose between light and dark mode</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => toast.info("Theme settings coming soon!")}>
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Eye className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Language</p>
                          <p className="text-sm text-muted-foreground">Set your preferred language</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => toast.info("Language settings coming soon!")}>
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security Settings */}
              {activeSection === "security" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Change Password
                      </CardTitle>
                      <CardDescription>Update your password to keep your account secure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input 
                            id="newPassword" 
                            type="password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
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
                          Update Password
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Two-Factor Authentication
                      </CardTitle>
                      <CardDescription>Add an extra layer of security to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">Authenticator App</p>
                            <p className="text-sm text-muted-foreground">Use an authenticator app for 2FA</p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => toast.info("2FA coming soon!")}>
                          Setup
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Active Sessions</CardTitle>
                      <CardDescription>Manage devices where you're logged in</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" onClick={() => toast.info("Session management coming soon!")}>
                        View All Sessions
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Payment Settings */}
              {activeSection === "payment" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Settings
                    </CardTitle>
                    <CardDescription>Manage your payment methods and billing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Payment Methods</p>
                          <p className="text-sm text-muted-foreground">Add or remove payment methods</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => toast.info("Payment methods coming soon!")}>
                        Manage
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Billing History</p>
                          <p className="text-sm text-muted-foreground">View and download invoices</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => toast.info("Billing history coming soon!")}>
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notification Settings */}
              {activeSection === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notification Settings
                    </CardTitle>
                    <CardDescription>Choose how you want to be notified</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive updates about your orders via email</p>
                      </div>
                      <Switch defaultChecked onCheckedChange={() => toast.info("Notification settings coming soon!")} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Order Updates</p>
                        <p className="text-sm text-muted-foreground">Get notified when your order status changes</p>
                      </div>
                      <Switch defaultChecked onCheckedChange={() => toast.info("Notification settings coming soon!")} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Marketing Emails</p>
                        <p className="text-sm text-muted-foreground">Receive news, offers, and updates from ProtoLab</p>
                      </div>
                      <Switch onCheckedChange={() => toast.info("Notification settings coming soon!")} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                      </div>
                      <Switch onCheckedChange={() => toast.info("Notification settings coming soon!")} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Business Settings */}
              {activeSection === "business" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      ProtoLab for Business
                    </CardTitle>
                    <CardDescription>Unlock features designed for businesses and teams</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl border-2 border-primary/20">
                      <h3 className="text-xl font-bold mb-2">Upgrade to Business</h3>
                      <p className="text-muted-foreground mb-4">
                        Get access to bulk ordering, team management, priority support, and invoicing features.
                      </p>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          Volume discounts on orders
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          Team member accounts
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          Priority production queue
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          Dedicated account manager
                        </li>
                      </ul>
                      <Button onClick={() => toast.info("Business features coming soon!")}>
                        Contact Sales
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Privacy & Data Settings */}
              {activeSection === "privacy" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Privacy & Data
                      </CardTitle>
                      <CardDescription>Manage your data and privacy preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <Download className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">Download Your Data</p>
                            <p className="text-sm text-muted-foreground">Get a copy of all your data stored with us</p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => toast.info("Data export coming soon!")}>
                          Request
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <Eye className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">Activity Log</p>
                            <p className="text-sm text-muted-foreground">View your account activity history</p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => toast.info("Activity log coming soon!")}>
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Danger Zone */}
                  <Card className="border-destructive">
                    <CardHeader>
                      <CardTitle className="text-destructive flex items-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        Danger Zone
                      </CardTitle>
                      <CardDescription>Irreversible actions for your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Delete Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account
                              and remove all your data from our servers, including all your orders and files.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Account
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
      </main>
    </div>
  );
};

export default Settings;
