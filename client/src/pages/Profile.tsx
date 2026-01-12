import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Calendar, Building2, Shield, Edit } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { API_URL } from "@/config/api";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  company_name?: string;
  phone?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        toast.error(t('profile.fetchError'));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error(t('profile.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
        <DashboardSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 gradient-text">{t('profile.title')}</h1>
              <p className="text-muted-foreground text-lg">{t('profile.description')}</p>
            </div>
            <Button onClick={() => navigate('/settings')} size="lg">
              <Edit className="mr-2 h-4 w-4" />
              {t('profile.editProfile')}
            </Button>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.personalInfo')}
              </CardTitle>
              <CardDescription>{t('profile.personalInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.name')}</p>
                  <p className="text-lg font-semibold">{profile?.name}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.email')}</p>
                  <p className="text-lg font-semibold">{profile?.email}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <Shield className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.role')}</p>
                  <p className="text-lg font-semibold capitalize">{profile?.role}</p>
                </div>
              </div>

              {/* Company (if exists) */}
              {profile?.company_name && (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('profile.company')}</p>
                    <p className="text-lg font-semibold">{profile.company_name}</p>
                  </div>
                </div>
              )}

              {/* Phone (if exists) */}
              {profile?.phone && (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('profile.phone')}</p>
                    <p className="text-lg font-semibold">{profile.phone}</p>
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.memberSince')}</p>
                  <p className="text-lg font-semibold">
                    {profile?.created_at && new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.quickActions')}</CardTitle>
              <CardDescription>{t('profile.quickActionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => navigate('/settings')}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('profile.editProfile')}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => navigate('/settings#password-section')}
              >
                <Shield className="mr-2 h-4 w-4" />
                {t('profile.changePassword')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
