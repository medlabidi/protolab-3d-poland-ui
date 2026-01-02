import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { t } = useLanguage();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "/api";

  useEffect(() => {
    if (!token) {
      setError(t('resetPassword.invalidToken'));
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t('resetPassword.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordsMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('resetPassword.failed'));
      }

      setIsSuccess(true);
      toast.success(t('resetPassword.success'));
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/signin");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resetPassword.failed'));
      toast.error(err instanceof Error ? err.message : t('resetPassword.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-purple-500/5 to-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-2 border-primary/10">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">{t('resetPassword.successTitle')}</CardTitle>
            <CardDescription>
              {t('resetPassword.successDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/signin">
              <Button className="w-full">{t('resetPassword.goToLogin')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-purple-500/5 to-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-2 border-red-200">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="w-9 h-9 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-red-600">{t('resetPassword.invalidLinkTitle')}</CardTitle>
            <CardDescription>
              {t('resetPassword.invalidLinkDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/signin">
              <Button className="w-full">{t('resetPassword.backToLogin')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-purple-500/5 to-background relative overflow-hidden flex items-center justify-center p-6">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/10 relative z-10 bg-gradient-to-br from-card to-muted/50">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <Logo size="xl" showText={false} />
          </div>
          <CardTitle className="text-3xl gradient-text">{t('resetPassword.title')}</CardTitle>
          <CardDescription className="text-base">
            {t('resetPassword.subtitle')}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">{t('resetPassword.newPassword')}</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                  className="h-12 border-2 focus:border-primary transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">{t('resetPassword.passwordHint')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">{t('resetPassword.confirmPassword')}</Label>
              <Input 
                id="confirmPassword" 
                type={showPassword ? "text" : "password"}
                placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                className="h-12 border-2 focus:border-primary transition-all"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base hover-lift shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('resetPassword.resetting')}
                </>
              ) : (
                t('resetPassword.resetButton')
              )}
            </Button>

            <div className="text-center text-sm pt-2">
              <Link to="/signin" className="text-primary hover:text-primary/80 font-medium">
                ← {t('resetPassword.backToLogin')}
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
