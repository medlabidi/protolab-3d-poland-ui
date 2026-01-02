import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";

const SignUp = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const API_URL = "/api";

  // Auto-detect location on component mount (optional)
  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    if (!window.isSecureContext) {
      console.log('Geolocation requires a secure context (HTTPS or localhost)');
      return;
    }
    
    setIsDetectingLocation(true);
    
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

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'ProtoLab3D-Poland'
              }
            }
          );
          const data = await response.json();
          
          if (data.address) {
            setAddress(data.address.road || data.address.village || "");
            setCity(data.address.city || data.address.town || "");
            setZipCode(data.address.postcode || "");
            setCountry(data.address.country || "");
            
            toast.success(t('signup.toasts.locationDetected'));
          }
        } catch (error) {
          console.log("Reverse geocoding failed (optional):", error);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        setIsDetectingLocation(false);
        
        if (error.code === error.PERMISSION_DENIED) {
          console.log('Geolocation permission denied - manual entry required');
        } else {
          console.log('Geolocation unavailable:', error.message);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000
      }
    );
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      toast.error(t('signup.toasts.requiredFields'));
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('signup.toasts.passwordsMismatch'));
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error(t('signup.toasts.passwordTooShort'));
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('signup.toasts.invalidEmail'));
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
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          zipCode: zipCode.trim() || undefined,
          country: country.trim() || undefined,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          role: "user",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || t('signup.toasts.registrationFailed'));
        setIsLoading(false);
        return;
      }

      toast.success("✅ " + (data.message || t('signup.toasts.registrationSuccess')), {
        duration: 6000,
      });
      
      toast.info("📧 " + t('signup.toasts.checkInbox'), {
        duration: 5000,
      });
      
      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('signup.toasts.connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t('signup.toasts.geolocationNotSupported'));
      return;
    }

    setIsDetectingLocation(true);
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
            toast.success(t('signup.toasts.locationUpdated'));
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
        toast.error(t('signup.toasts.locationFailed'));
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className="text-2xl">{t('signup.title')}</CardTitle>
          <CardDescription>{t('signup.subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('signup.fields.fullName')} *</Label>
              <Input 
                id="name" 
                placeholder={t('signup.placeholders.fullName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('signup.fields.email')} *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder={t('signup.placeholders.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('signup.fields.password')} *</Label>
              <Input 
                id="password" 
                type="password"
                placeholder={t('signup.placeholders.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('signup.fields.confirmPassword')} *</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('signup.fields.phone')}</Label>
              <Input 
                id="phone" 
                type="tel"
                placeholder={t('signup.placeholders.phone')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('signup.fields.address')}</Label>
              <Input 
                id="address" 
                placeholder={t('signup.placeholders.address')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            
            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold">{t('signup.fields.deliveryLocation')}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={detectLocation}
                  disabled={isDetectingLocation}
                >
                  {isDetectingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t('signup.buttons.detect')
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs">{t('signup.fields.city')}</Label>
                  <Input 
                    id="city" 
                    placeholder={t('signup.placeholders.city')}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-xs">{t('signup.fields.zipCode')}</Label>
                  <Input 
                    id="zipCode" 
                    placeholder={t('signup.placeholders.zipCode')}
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-xs">{t('signup.fields.country')}</Label>
                <Input 
                  id="country" 
                  placeholder={t('signup.placeholders.country')}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              {latitude && longitude && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  📍 {t('signup.coordinates')}: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('signup.buttons.creating')}
                </>
              ) : (
                t('signup.buttons.createAccount')
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {t('signup.termsNotice')}
            </p>
            <div className="text-center text-sm">
              {t('signup.alreadyHaveAccount')}{" "}
              <Link to="/signin" className="text-primary hover:underline font-semibold">
                {t('signup.signIn')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignUp;
