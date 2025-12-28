import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { GoogleLogin } from "@react-oauth/google";
import { Logo } from "@/components/Logo";
import { scheduleTokenRefresh } from "@/utils/tokenRefresh";

const SignIn = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Forgot password state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const API_URL = "/api";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show specific error message from server
        const errorMessage = data.error || data.message || "Login failed. Please check your credentials.";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Store tokens and user info
      localStorage.setItem("accessToken", data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.tokens.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");

      // Initialize auto token refresh
      scheduleTokenRefresh(data.tokens.accessToken);

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          googleToken: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || data.message || "Google login failed");
        setIsLoading(false);
        return;
      }

      // Store tokens and user info
      localStorage.setItem("accessToken", data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.tokens.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");

      // Initialize auto token refresh
      scheduleTokenRefresh(data.tokens.accessToken);

      toast.success("Google login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google login error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login failed");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setForgotSuccess(true);
      toast.success("Password reset email sent!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotPasswordDialog = () => {
    setForgotEmail("");
    setForgotSuccess(false);
    setForgotLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-purple-500/5 to-background relative overflow-hidden flex items-center justify-center p-6">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/10 relative z-10 animate-scale-in bg-gradient-to-br from-card to-muted/50">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <Logo size="xl" showText={false} />
          </div>
          <CardTitle className="text-3xl gradient-text">{t('login.welcome')}</CardTitle>
          <CardDescription className="text-base">{t('login.subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">{t('login.email')}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                autoComplete="email"
                className="h-12 border-2 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">{t('login.password')}</Label>
              <Input 
                id="password" 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                autoComplete="current-password"
                className="h-12 border-2 focus:border-primary transition-all"
              />
            </div>
            <Button type="button" variant="link" className="px-0 text-sm text-primary hover:text-primary/80" onClick={() => setForgotPasswordOpen(true)}>
              {t('login.forgotPassword')}
            </Button>
            
            {/* Forgot Password Dialog */}
            <Dialog open={forgotPasswordOpen} onOpenChange={(open) => {
              setForgotPasswordOpen(open);
              if (!open) resetForgotPasswordDialog();
            }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {forgotSuccess ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        {t('signIn.checkYourEmail')}
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 text-primary" />
                        {t('signIn.resetPassword')}
                      </>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    {forgotSuccess 
                      ? t('signIn.emailSentDescription')
                      : t('signIn.enterEmailDescription')
                    }
                  </DialogDescription>
                </DialogHeader>
                
                {!forgotSuccess ? (
                  <form onSubmit={handleForgotPassword}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">{t('signIn.emailAddress')}</Label>
                        <Input 
                          id="forgot-email" 
                          type="email" 
                          placeholder="your@email.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setForgotPasswordOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button type="submit" disabled={forgotLoading}>
                        {forgotLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('signIn.sending')}
                          </>
                        ) : (
                          t('signIn.sendResetLink')
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <DialogFooter>
                    <Button onClick={() => setForgotPasswordOpen(false)} className="w-full">
                      {t('signIn.gotIt')}
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 text-base hover-lift shadow-lg group relative overflow-hidden" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('login.signingIn')}
                </>
              ) : (
                <span className="relative z-10">{t('login.signIn')}</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Button>
            <div className="relative w-full my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-semibold">{t('login.orContinueWith')}</span>
              </div>
            </div>
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="400"
              />
            </div>
            <div className="text-center text-sm pt-2">
              {t('login.noAccount')}{" "}
              <Link to="/signup" className="text-primary hover:text-primary/80 font-bold underline-offset-4 hover:underline transition-all">
                {t('login.signUp')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignIn;
