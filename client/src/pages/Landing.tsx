import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Upload, Settings, Truck, Package, Palette, Zap, Mail, Phone, MapPin, Clock, Send, LayoutDashboard, FileText, Calendar, Users, Award, Globe, Download, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Logo } from "@/components/Logo";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Material {
  id: string;
  name: string;
  type: string;
  color: string;
  price_per_kg: number;
  density?: number;
  stock_quantity?: number;
  print_temp?: number;
  bed_temp?: number;
  supplier?: string;
  is_active: boolean;
  description?: string;
}

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('accessToken');

  // Materials state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Fetch materials from API
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/materials`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter only active materials
        const activeMaterials = data.materials.filter((m: Material) => m.is_active);
        setMaterials(activeMaterials);
      } else {
        // Fallback to empty array if fetch fails
        console.error('Failed to fetch materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const stats = [
    {
      icon: Package,
      value: "1,000+",
      label: t('aboutUs.stat1'),
    },
    {
      icon: Users,
      value: "350+",
      label: t('aboutUs.stat2'),
    },
    {
      icon: Globe,
      value: "25+",
      label: t('aboutUs.stat3'),
    },
    {
      icon: Award,
      value: "95%",
      label: t('aboutUs.stat4'),
    },
  ];

  // Counter animation hook
  const useCountUp = (end: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const countRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            let startTime: number;
            const animate = (currentTime: number) => {
              if (!startTime) startTime = currentTime;
              const progress = Math.min((currentTime - startTime) / duration, 1);
              setCount(Math.floor(progress * end));
              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            requestAnimationFrame(animate);
          }
        },
        { threshold: 0.5 }
      );

      if (countRef.current) {
        observer.observe(countRef.current);
      }

      return () => observer.disconnect();
    }, [end, duration, hasAnimated]);

    return { count, countRef };
  };

  // Stats component with counter
  const StatCard = ({ stat, index }: { stat: typeof stats[0], index: number }) => {
    const numericValue = parseInt(stat.value.replace(/[^0-9]/g, ''));
    const suffix = stat.value.replace(/[0-9]/g, '');
    const { count, countRef } = useCountUp(numericValue, 2000 + index * 200);

    return (
      <Card 
        className="text-center border-2 border-transparent bg-gradient-to-br from-card to-muted/30 shadow-lg animate-scale-in"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <CardContent className="pt-8 pb-8">
          <div ref={countRef} className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
            {count}{suffix}
          </div>
          <p className="text-muted-foreground text-sm">{stat.label}</p>
        </CardContent>
      </Card>
    );
  };

  const services = [
    {
      icon: Upload,
      title: t('landing.service1Title'),
      description: t('landing.service1Desc'),
      color: "from-blue-500 to-cyan-500",
      route: "/new-print"
    },
    {
      icon: Palette,
      title: "3D Design Assistance",
      description: "Get expert help with your 3D design projects and modeling needs",
      color: "from-purple-500 to-pink-500",
      route: "/design-assistance"
    },
  ];

  const features = [
    {
      icon: Zap,
      title: t('landing.feature1Title'),
      description: t('landing.feature1Desc'),
    },
    {
      icon: Package,
      title: t('landing.feature2Title'),
      description: t('landing.feature2Desc'),
    },
    {
      icon: Truck,
      title: t('landing.feature3Title'),
      description: t('landing.feature3Desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 animate-slide-up">
        <div className="backdrop-blur-md bg-background/30 border-b border-white/10">
          <div className="container mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl font-bold text-primary group cursor-pointer">
              <Logo size="sm" textClassName="text-xl" />
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/about")} 
                className="text-white hover:text-primary hover:bg-white/10 transition-all"
              >
                {t('nav.aboutUs')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/services")} 
                className="text-white hover:text-primary hover:bg-white/10 transition-all"
              >
                {t('nav.services')}
              </Button>
            </nav>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {isLoggedIn ? (
                <Button 
                  onClick={() => navigate("/dashboard")} 
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  {t('dashboard.overview')}
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate("/login")} 
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm hover:scale-105 transition-all"
                >
                  {t('landing.login')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative animate-slide-up overflow-hidden">
        {/* Image Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            src="/heo-sec01.jpg"
            alt="Hero Background"
            className="absolute top-0 left-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/50 to-background"></div>
        </div>
        
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-gradient bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent leading-tight">
            {t('landing.title')}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('landing.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button 
              size="lg" 
              className="text-lg px-10 py-7 hover-lift shadow-xl group relative overflow-hidden"
              onClick={() => navigate("/new-print")}
            >
              <span className="relative z-10 flex items-center">
                <Upload className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Upload Your 3D File
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-10 py-7 hover-lift"
              onClick={() => navigate("/design-assistance")}
            >
              <Download className="mr-2 h-5 w-5" />
              Get Your 3D File
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 relative bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <StatCard key={index} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background relative">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Our Services</h2>
            <p className="text-muted-foreground text-lg">Choose the service that fits your needs</p>
          </div>

          <Tabs defaultValue="printing" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="printing" className="text-lg">3D Printing</TabsTrigger>
              <TabsTrigger value="assistance" className="text-lg">3D Design Assistance</TabsTrigger>
            </TabsList>

            <TabsContent value="printing" className="space-y-8">
              <div className="max-w-4xl mx-auto">
                <Card className="border-none shadow-xl bg-gradient-to-br from-card to-muted/50">
                  <CardContent className="pt-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Left: Service Description */}
                      <div className="space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                          <Package className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold">3D Printing Service</h3>
                        <p className="text-muted-foreground">
                          Upload your 3D model and get professional prints delivered to your doorstep. 
                          Fast, reliable, and high-quality printing with a variety of materials.
                        </p>
                        <Button onClick={() => navigate("/new-print")} className="w-full mt-4">
                          <Upload className="w-4 h-4 mr-2" />
                          Start Printing
                        </Button>
                      </div>

                      {/* Right: Steps */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg mb-4">How it works:</h4>
                        {[
                          { step: 1, title: "Upload Your File", desc: "Upload your 3D model (.STL, .OBJ)" },
                          { step: 2, title: "Configure Options", desc: "Choose material, color, and quality" },
                          { step: 3, title: "Get Instant Quote", desc: "See the price and delivery time" },
                          { step: 4, title: "Place Order", desc: "Pay securely and track your order" },
                          { step: 5, title: "Receive Prints", desc: "Get your prints delivered" }
                        ].map((item) => (
                          <div key={item.step} className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-primary">{item.step}</span>
                            </div>
                            <div>
                              <h5 className="font-semibold">{item.title}</h5>
                              <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="assistance" className="space-y-8">
              <div className="max-w-4xl mx-auto">
                <Card className="border-none shadow-xl bg-gradient-to-br from-card to-muted/50">
                  <CardContent className="pt-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Left: Service Description */}
                      <div className="space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                          <Palette className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold">3D Design Assistance</h3>
                        <p className="text-muted-foreground">
                          Don't have a 3D model? No problem! Describe your idea and our designers 
                          will create a custom 3D model for you.
                        </p>
                        <Button onClick={() => navigate("/design-assistance")} className="w-full mt-4">
                          <Download className="w-4 h-4 mr-2" />
                          Get Design Help
                        </Button>
                      </div>

                      {/* Right: Steps */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg mb-4">How it works:</h4>
                        {[
                          { step: 1, title: "Describe Your Idea", desc: "Tell us what you need designed" },
                          { step: 2, title: "Designer Creates Model", desc: "Our team creates your 3D model" },
                          { step: 3, title: "Review & Approve", desc: "Check the design and request changes" },
                          { step: 4, title: "Download File", desc: "Get your ready-to-print 3D file" },
                          { step: 5, title: "Optional: Print It", desc: "Order prints directly from us" }
                        ].map((item) => (
                          <div key={item.step} className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-purple-500">{item.step}</span>
                            </div>
                            <div>
                              <h5 className="font-semibold">{item.title}</h5>
                              <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Supported Materials */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Background Image - Fixed */}
        <div 
          className="absolute inset-0 bg-fixed bg-center bg-cover opacity-40"
          style={{
            backgroundImage: `url('/bgMAter.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{t('landing.supportedMaterials')}</h2>
            <p className="text-muted-foreground text-lg">{t('landing.materialsSubtitle')}</p>
          </div>

          {loadingMaterials ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Aucun matériau disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material, index) => (
                <Card 
                  key={material.id} 
                  className="bg-gradient-to-br from-background/95 via-background/90 to-primary/5 border-primary/20 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 group overflow-hidden"
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <CardContent className="p-6 relative">
                    {/* Color Indicator */}
                    <div className="absolute top-0 left-0 right-0 h-2 opacity-70 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: material.color }}></div>
                    
                    {/* Material Info */}
                    <div className="space-y-4 mt-2">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-white/50 shadow-lg group-hover:scale-125 transition-transform"
                              style={{ backgroundColor: material.color }}
                            ></div>
                            <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">
                              {material.name}
                            </h3>
                          </div>
                          <span className="text-sm text-primary/80 font-medium px-2 py-1 bg-primary/10 rounded-md inline-block">
                            {material.type}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {material.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {material.description}
                        </p>
                      )}

                      {/* Properties Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                        {/* Price */}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Prix/kg</p>
                          <p className="text-lg font-bold text-primary">${material.price_per_kg}</p>
                        </div>

                        {/* Stock */}
                        {material.stock_quantity !== undefined && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Stock</p>
                            <p className={`text-lg font-bold ${
                              material.stock_quantity > 3 ? 'text-green-400' :
                              material.stock_quantity > 1 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {material.stock_quantity.toFixed(1)} kg
                            </p>
                          </div>
                        )}

                        {/* Print Temperature */}
                        {material.print_temp && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Temp. impression</p>
                            <p className="text-sm font-semibold text-white">{material.print_temp}°C</p>
                          </div>
                        )}

                        {/* Bed Temperature */}
                        {material.bed_temp && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Temp. plateau</p>
                            <p className="text-sm font-semibold text-white">{material.bed_temp}°C</p>
                          </div>
                        )}
                      </div>

                      {/* Supplier */}
                      {material.supplier && (
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-xs text-muted-foreground mb-1">Fournisseur</p>
                          <p className="text-sm text-white font-medium">{material.supplier}</p>
                        </div>
                      )}
                    </div>

                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity pointer-events-none"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Statistics Summary */}
          {!loadingMaterials && materials.length > 0 && (
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Matériaux disponibles</p>
                  <p className="text-3xl font-bold text-primary">{materials.length}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Stock total</p>
                  <p className="text-3xl font-bold text-green-400">
                    {materials.reduce((sum, m) => sum + (m.stock_quantity || 0), 0).toFixed(1)} kg
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Types de matériaux</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {new Set(materials.map(m => m.type)).size}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Prix moyen/kg</p>
                  <p className="text-3xl font-bold text-blue-400">
                    ${(materials.reduce((sum, m) => sum + m.price_per_kg, 0) / materials.length).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-6 bg-gradient-to-b from-background via-primary/5 to-muted/30 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        </div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text leading-tight">
              {t('landing.whyChooseUsSubtitle')}
            </h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
              {t('landing.whyChooseUsDescription')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group animate-scale-in relative"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="relative p-8 rounded-3xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-500 h-full shadow-lg">
                  {/* Icon Container */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary via-purple-600 to-accent rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 relative z-10">
                      <feature.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>
                    {/* Decorative Elements */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-bounce"></div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </p>
                  
                  {/* Hover Indicator */}
                  <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full border-2 border-primary/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-180">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  
                  {/* Corner Accent */}
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary/0 group-hover:border-primary/50 rounded-tl-3xl transition-all duration-500"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-accent/5"></div>
        <div className="w-full relative z-10">
          <div className="px-6 md:px-12 py-16 bg-white/95 backdrop-blur-sm shadow-2xl border-y-2 border-primary/10">
            <div className="container mx-auto text-center max-w-7xl">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">{t('landing.readyToStart')}</h2>
              <p className="text-muted-foreground mb-10 text-lg leading-relaxed max-w-2xl mx-auto">
                {t('landing.subtitle')}
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Button 
                  size="lg" 
                  className="text-lg px-12 py-7 hover-lift shadow-xl group relative overflow-hidden"
                  onClick={() => navigate("/new-print")}
                >
                  <span className="relative z-10 flex items-center">
                    <Upload className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                    {t('landing.uploadNow')}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background relative">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 id="contact-form" className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{t('landing.contactTitle')}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t('landing.contactSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="shadow-xl border-2 border-primary/10 bg-gradient-to-br from-card to-muted/30 animate-scale-in">
              <CardContent className="pt-8 pb-8">
                <form className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">{t('landing.contactName')}</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors bg-background"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">{t('landing.contactEmail')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input 
                        type="email" 
                        className="w-full pl-11 pr-4 py-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors bg-background"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">{t('landing.contactPhone')}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input 
                        type="tel" 
                        className="w-full pl-11 pr-4 py-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors bg-background"
                        placeholder="+48 123 456 789"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">{t('landing.contactMessage')}</label>
                    <textarea 
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors bg-background resize-none"
                      placeholder={t('landing.contactMessagePlaceholder')}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 hover-lift shadow-lg group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      <Send className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      {t('landing.contactSend')}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info Cards */}
            <div className="space-y-4">
              {/* Our Location */}
              <Card className="border-2 border-transparent bg-gradient-to-br from-card to-muted/30 shadow-lg animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{t('landing.contactAddress')}</h3>
                      <p className="text-muted-foreground text-sm">{t('landing.contactAddressLine1')}</p>
                      <p className="text-muted-foreground text-sm">{t('landing.contactAddressLine2')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email */}
              <Card className="border-2 border-transparent bg-gradient-to-br from-card to-muted/30 shadow-lg animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{t('landing.email')}</h3>
                      <p className="text-muted-foreground text-sm">info@protolab.pl</p>
                      <p className="text-muted-foreground text-sm">support@protolab.pl</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phone */}
              <Card className="border-2 border-transparent bg-gradient-to-br from-card to-muted/30 shadow-lg animate-scale-in" style={{ animationDelay: '0.3s' }}>
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{t('landing.phone')}</h3>
                      <p className="text-muted-foreground text-sm">+48 123 456 789</p>
                      <p className="text-muted-foreground text-sm">+48 987 654 321</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Working Hours */}
              <Card className="border-2 border-transparent bg-gradient-to-br from-card to-muted/30 shadow-lg animate-scale-in" style={{ animationDelay: '0.4s' }}>
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{t('landing.contactHours')}</h3>
                      <p className="text-muted-foreground text-sm">{t('landing.contactHoursTime')}</p>
                      <p className="text-muted-foreground text-sm">{t('landing.contactHoursWeekend')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Full-width Google Maps at bottom */}
          <div className="w-full mt-12">
            <div className="h-80 w-full rounded-lg overflow-hidden shadow-xl border-2 border-primary/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2443.2879478476776!2d21.01223431594395!3d52.22967797975988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471ecc669a869f01%3A0x72f0be2a88ead3fc!2sPalace%20of%20Culture%20and%20Science!5e0!3m2!1sen!2spl!4v1234567890123!5m2!1sen!2spl"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-16 px-6 bg-gradient-to-b from-background to-muted/30 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 text-xl font-bold mb-6 group cursor-pointer">
                <Logo size="sm" textClassName="text-xl" />
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('landing.footerDescription')}
              </p>
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-primary/10 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center cursor-pointer transition-all hover-lift">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </div>
                <div className="w-10 h-10 bg-primary/10 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center cursor-pointer transition-all hover-lift">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </div>
                <div className="w-10 h-10 bg-primary/10 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center cursor-pointer transition-all hover-lift">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">{t('landing.footerServices')}</h4>
              <ul className="space-y-3">
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/new-print")}>{t('landing.footerPrinting')}</li>
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/design-assistance")}>{t('landing.footerDesign')}</li>
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/design-assistance")}>{t('landing.footerPrototyping')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">{t('landing.footerCompany')}</h4>
              <ul className="space-y-3">
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/about")}>{t('landing.footerAbout')}</li>
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>{t('landing.footerContact')}</li>
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/privacy-policy")}>{t('landing.footerPrivacy')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">{t('landing.footerContactHeader')}</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">📧 info@protolab.pl</li>
                <li className="hover:text-primary transition-colors cursor-pointer">📞 +48 123 456 789</li>
                <li className="hover:text-primary transition-colors cursor-pointer">📍 {t('landing.footerLocation')}</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 text-center">
            <p className="text-muted-foreground">
              {t('landing.footerCopyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
