import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { GoogleLogin } from "@react-oauth/google";
import { Logo } from "@/components/Logo";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { t } = useLanguage();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupAddress, setSignupAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Use proxy configured in vite.config.ts to avoid CORS issues
  const API_URL = "/api";

  // Auto-detect location on component mount (optional)
  useEffect(() => {
    // Only attempt geolocation if available and user hasn't filled address yet
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      console.log('Geolocation requires a secure context (HTTPS or localhost)');
      return;
    }
    
    setIsDetectingLocation(true);
    
    // Set timeout for geolocation request
    const timeoutId = setTimeout(() => {
      setIsDetectingLocation(false);
      console.log('Geolocation timeout');
    }, 5000);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);

        // Reverse geocoding using Open Street Map Nominatim
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'ProtoLab3D-Poland' // Required by Nominatim
              }
            }
          );
          const data = await response.json();
          
          if (data.address) {
            setSignupAddress(data.address.road || data.address.village || "");
            setCity(data.address.city || data.address.town || "");
            setZipCode(data.address.postcode || "");
            setCountry(data.address.country || "");
            
            toast.success("Location detected! You can edit if needed.");
          }
        } catch (error) {
          console.log("Reverse geocoding failed (optional):", error);
          // Silent fail - geolocation is optional
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        setIsDetectingLocation(false);
        
        // Only show toast for permission denied, not for other errors
        if (error.code === error.PERMISSION_DENIED) {
          console.log('Geolocation permission denied - manual entry required');
        } else {
          console.log('Geolocation unavailable:', error.message);
        }
        // Geolocation is optional, so don't show error toast
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  }, []);

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
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Store tokens and user info
      localStorage.setItem("accessToken", data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.tokens.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");

      // Log activity
      const loginActivity = {
        id: `activity_${Date.now()}`,
        type: 'login',
        title: 'Login',
        description: 'Successfully logged in to your account',
        timestamp: new Date().toISOString(),
        metadata: {
          device: navigator.platform || 'Unknown',
        },
      };
      const existingLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
      localStorage.setItem("activityLog", JSON.stringify([loginActivity, ...existingLog].slice(0, 100)));

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connection error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!signupName || !signupEmail || !signupPassword || !confirmPassword) {
      toast.error("All fields are required");
      setIsLoading(false);
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.toLowerCase().trim(),
          password: signupPassword,
          phone: signupPhone.trim() || undefined,
          address: signupAddress.trim() || undefined,
          city: city.trim() || undefined,
          zipCode: zipCode.trim() || undefined,
          country: country.trim() || undefined,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          role: "user", // Default role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      // Show success message - user needs to verify email
      toast.success("✅ " + (data.message || "Registration successful! Please check your email to verify your account."), {
        duration: 6000,
      });
      
      toast.info("📧 Check your inbox for the verification link", {
        duration: 5000,
      });
      
      // Clear signup form
      setSignupName("");
      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");
      setSignupPhone("");
      setSignupAddress("");
      setCity("");
      setZipCode("");
      setCountry("");
      setLatitude(null);
      setLongitude(null);

      // Switch to login tab after 2 seconds
      setTimeout(() => {
        setActiveTab("login");
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connection error");
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

      // Log activity
      const loginActivity = {
        id: `activity_${Date.now()}`,
        type: 'login',
        title: 'Google Login',
        description: 'Successfully logged in with Google',
        timestamp: new Date().toISOString(),
        metadata: {
          device: navigator.platform || 'Unknown',
        },
      };
      const existingLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
      localStorage.setItem("activityLog", JSON.stringify([loginActivity, ...existingLog].slice(0, 100)));

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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className="text-2xl">{t('login.welcome')}</CardTitle>
          <CardDescription>{t('login.subtitle')}</CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-6">
            <TabsTrigger value="login">{t('login.signIn')}</TabsTrigger>
            <TabsTrigger value="signup">{t('login.signUp')}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('login.email')}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('login.password')}</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button type="button" variant="link" className="px-0 text-sm">
                  {t('login.forgotPassword')}
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('login.signingIn') : t('login.signIn')}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t('login.orContinueWith')}</span>
                  </div>
                </div>
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    width="260"
                  />
                </div>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('login.name')}</Label>
                  <Input 
                    id="signup-name" 
                    placeholder="John Doe" 
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('login.email')}</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('login.password')}</Label>
                  <Input 
                    id="signup-password" 
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('login.confirmPassword')}</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">{t('login.phoneOptional')}</Label>
                  <Input 
                    id="signup-phone" 
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-address">{t('login.addressOptional')}</Label>
                  <Input 
                    id="signup-address" 
                    placeholder="123 Main St, City, State 12345"
                    value={signupAddress}
                    onChange={(e) => setSignupAddress(e.target.value)}
                  />
                </div>
                
                {/* Delivery Location Section */}
                <div className="pt-2 border-t space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-semibold">{t('login.deliveryLocation')}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsDetectingLocation(true);
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            async (position) => {
                              const { latitude, longitude } = position.coords;
                              setLatitude(latitude);
                              setLongitude(longitude);

                              try {
                                const response = await fetch(
                                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                                );
                                const data = await response.json();
                                
                                if (data.address) {
                                  setCity(data.address.city || data.address.town || "");
                                  setZipCode(data.address.postcode || "");
                                  setCountry(data.address.country || "");
                                  toast.success("Location updated!");
                                }
                              } catch (error) {
                                console.error("Reverse geocoding failed:", error);
                              } finally {
                                setIsDetectingLocation(false);
                              }
                            },
                            () => {
                              setIsDetectingLocation(false);
                              toast.error("Could not get your location");
                            }
                          );
                        }
                      }}
                      disabled={isDetectingLocation}
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t('login.detect')
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-city" className="text-xs">{t('login.city')}</Label>
                      <Input 
                        id="signup-city" 
                        placeholder="New York"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-zipcode" className="text-xs">{t('login.zipCode')}</Label>
                      <Input 
                        id="signup-zipcode" 
                        placeholder="10001"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-country" className="text-xs">{t('login.country')}</Label>
                    <Input 
                      id="signup-country" 
                      placeholder="United States"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>

                  {latitude && longitude && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      📍 {t('login.coordinates')}: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('login.creatingAccount') : t('login.signUp')}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {t('login.termsAgreement')}
                </p>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login;
