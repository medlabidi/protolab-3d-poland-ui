import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, Loader2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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

  const API_URL = "http://localhost:5000/api";

  // Auto-detect location on component mount (optional)
  useEffect(() => {
    // Only attempt geolocation if available and user hasn't filled address yet
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
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

      // Store tokens and user info
      localStorage.setItem("accessToken", data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.tokens.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");

      toast.success("Account created successfully!");
      
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

      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connection error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Box className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t.login.welcome}</CardTitle>
          <CardDescription>{t.login.subtitle}</CardDescription>
        </CardHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-6">
            <TabsTrigger value="login">{t.login.signIn}</TabsTrigger>
            <TabsTrigger value="signup">{t.login.signUp}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.login.email}</Label>
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
                  <Label htmlFor="password">{t.login.password}</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button type="button" variant="link" className="px-0 text-sm">
                  Forgot password?
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : t.login.signIn}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button type="button" variant="outline" className="w-full">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t.login.name}</Label>
                  <Input 
                    id="signup-name" 
                    placeholder="John Doe" 
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t.login.email}</Label>
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
                  <Label htmlFor="signup-password">{t.login.password}</Label>
                  <Input 
                    id="signup-password" 
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t.login.confirmPassword}</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone (Optional)</Label>
                  <Input 
                    id="signup-phone" 
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-address">Address (Optional)</Label>
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
                    <Label className="text-sm font-semibold">Delivery Location</Label>
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
                        "Detect"
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-city" className="text-xs">City</Label>
                      <Input 
                        id="signup-city" 
                        placeholder="New York"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-zipcode" className="text-xs">Zip Code</Label>
                      <Input 
                        id="signup-zipcode" 
                        placeholder="10001"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-country" className="text-xs">Country</Label>
                    <Input 
                      id="signup-country" 
                      placeholder="United States"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>

                  {latitude && longitude && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      📍 Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : t.login.signUp}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to our Terms of Service and Privacy Policy
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
