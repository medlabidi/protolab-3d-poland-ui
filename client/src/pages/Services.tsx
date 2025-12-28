import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Upload, Palette, Calendar, ArrowRight, CheckCircle2, LayoutDashboard, Download, Package, Zap, Truck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Services = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('accessToken');

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 border-b border-border glass-effect z-50 animate-slide-up">
        <div className="container mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold text-primary group cursor-pointer" onClick={() => navigate("/")}>
            <Logo size="sm" textClassName="text-xl" />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate("/about")} className="text-primary transition-shadow">
              {t('nav.aboutUs')}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/services")} className="text-primary transition-shadow">
              {t('nav.services')}
            </Button>
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {isLoggedIn ? (
              <Button onClick={() => navigate("/dashboard")} className="hover-lift shadow-lg hover:shadow-xl">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                {t('dashboard.overview')}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/login")} className="hover-lift">
                {t('landing.login')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-8 px-6 relative animate-slide-up">
        <div className="container mx-auto max-w-7xl text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-gradient bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent leading-tight">
            {t('services.hero.title')}
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            {t('services.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <Tabs defaultValue="printing" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="printing" className="text-lg">3D Printing</TabsTrigger>
              <TabsTrigger value="assistance" className="text-lg">3D Design Assistance</TabsTrigger>
            </TabsList>

            <TabsContent value="printing" className="space-y-8">
              <div className="max-w-6xl mx-auto">
                <Card className="border-none shadow-xl bg-gradient-to-br from-card to-muted/50">
                  <CardContent className="pt-8">
                    {/* Service Header */}
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Package className="w-12 h-12 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold mb-2">3D Printing Service</h3>
                        <p className="text-muted-foreground text-lg">
                          Professional 3D printing with premium materials and fast delivery
                        </p>
                      </div>
                    </div>

                    {/* Detailed Description */}
                    <div className="mb-8 p-6 bg-muted/30 rounded-xl">
                      <h4 className="font-semibold text-xl mb-4">What We Offer</h4>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Transform your digital designs into physical reality with our state-of-the-art 3D printing service. 
                        We offer high-quality prints using a wide range of materials including PLA, ABS, PETG, TPU, Nylon, and Resin. 
                        Whether you need prototypes, custom parts, or final products, we've got you covered.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <span className="text-sm">Multiple material options for different applications</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <span className="text-sm">Various colors and finishes available</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <span className="text-sm">High precision printing (0.1mm - 0.3mm layers)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <span className="text-sm">Fast turnaround - most orders ship within 48-72h</span>
                        </div>
                      </div>
                    </div>

                    {/* Process Steps */}
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold text-xl mb-6">Simple Process:</h4>
                        <div className="space-y-4">
                          {[
                            { 
                              step: 1, 
                              title: "Upload Your 3D File", 
                              desc: "Support for .STL, .OBJ, .3MF formats. Drag and drop or browse to upload." 
                            },
                            { 
                              step: 2, 
                              title: "Configure Your Print", 
                              desc: "Select material, color, layer height, infill density, and quantity." 
                            },
                            { 
                              step: 3, 
                              title: "Get Instant Quote", 
                              desc: "See real-time pricing based on volume, material, and quality settings." 
                            },
                            { 
                              step: 4, 
                              title: "Secure Payment & Tracking", 
                              desc: "Pay online securely and track your order status in real-time." 
                            },
                            { 
                              step: 5, 
                              title: "Delivery to Your Door", 
                              desc: "Receive professionally packaged prints via InPost or courier." 
                            }
                          ].map((item) => (
                            <div key={item.step} className="flex gap-4 items-start p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-white">{item.step}</span>
                              </div>
                              <div>
                                <h5 className="font-semibold mb-1">{item.title}</h5>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing & Features */}
                      <div>
                        <h4 className="font-semibold text-xl mb-6">Pricing & Benefits:</h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <h5 className="font-semibold mb-2 text-primary">Transparent Pricing</h5>
                            <p className="text-sm text-muted-foreground">
                              Calculated based on model volume, material cost, print time, and complexity. 
                              No hidden fees - what you see is what you pay.
                            </p>
                          </div>
                          <div className="p-4 bg-background rounded-lg border border-border">
                            <h5 className="font-semibold mb-2">Quality Guarantee</h5>
                            <p className="text-sm text-muted-foreground">
                              Every print is quality-checked before shipping. Not satisfied? We'll reprint for free.
                            </p>
                          </div>
                          <div className="p-4 bg-background rounded-lg border border-border">
                            <h5 className="font-semibold mb-2">Bulk Discounts</h5>
                            <p className="text-sm text-muted-foreground">
                              Order multiple copies? Enjoy automatic discounts on quantities of 10+ units.
                            </p>
                          </div>
                          <div className="p-4 bg-background rounded-lg border border-border">
                            <h5 className="font-semibold mb-2">Express Options</h5>
                            <p className="text-sm text-muted-foreground">
                              Need it faster? Choose express production (24h) and next-day delivery.
                            </p>
                          </div>
                        </div>
                        
                        <Button onClick={() => navigate("/new-print")} className="w-full mt-6" size="lg">
                          <Upload className="w-4 h-4 mr-2" />
                          Start Your Print Order
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="assistance" className="space-y-8">
              <div className="max-w-6xl mx-auto">
                <Card className="border-none shadow-xl bg-gradient-to-br from-card to-muted/50">
                  <CardContent className="pt-8">
                    {/* Service Header */}
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Palette className="w-12 h-12 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold mb-2">3D Design Assistance</h3>
                        <p className="text-muted-foreground text-lg">
                          Professional 3D modeling from concept to ready-to-print file
                        </p>
                      </div>
                    </div>

                    {/* Detailed Description */}
                    <div className="mb-8 p-6 bg-muted/30 rounded-xl">
                      <h4 className="font-semibold text-xl mb-4">What We Offer</h4>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Don't have a 3D model yet? No problem! Our experienced design team will transform your ideas, 
                        sketches, or descriptions into professional 3D models ready for printing. Perfect for custom parts, 
                        prototypes, decorative items, mechanical components, and more.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-1" />
                          <span className="text-sm">Custom designs from sketches or descriptions</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-1" />
                          <span className="text-sm">CAD modeling for mechanical parts</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-1" />
                          <span className="text-sm">Organic and artistic 3D sculpting</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-1" />
                          <span className="text-sm">Print-optimized file preparation</span>
                        </div>
                      </div>
                    </div>

                    {/* Process Steps */}
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold text-xl mb-6">Design Process:</h4>
                        <div className="space-y-4">
                          {[
                            { 
                              step: 1, 
                              title: "Submit Your Idea", 
                              desc: "Describe what you need, attach sketches, photos, or reference materials." 
                            },
                            { 
                              step: 2, 
                              title: "Design Consultation", 
                              desc: "Our designer reviews your request and may ask clarifying questions." 
                            },
                            { 
                              step: 3, 
                              title: "3D Model Creation", 
                              desc: "We create your 3D model using professional CAD/3D software." 
                            },
                            { 
                              step: 4, 
                              title: "Review & Revisions", 
                              desc: "Preview the model, request changes, and approve the final design." 
                            },
                            { 
                              step: 5, 
                              title: "Download & Print", 
                              desc: "Get your print-ready file and optionally order prints from us." 
                            }
                          ].map((item) => (
                            <div key={item.step} className="flex gap-4 items-start p-4 rounded-lg bg-background/50 border border-border/50 hover:border-purple-500/50 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-white">{item.step}</span>
                              </div>
                              <div>
                                <h5 className="font-semibold mb-1">{item.title}</h5>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing & Features */}
                      <div>
                        <h4 className="font-semibold text-xl mb-6">Design Services:</h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                            <h5 className="font-semibold mb-2 text-purple-600">Simple Objects</h5>
                            <p className="text-sm text-muted-foreground mb-2">
                              Basic shapes, simple mechanical parts, straightforward designs.
                            </p>
                            <p className="text-xs text-muted-foreground">Starting from 50 PLN</p>
                          </div>
                          <div className="p-4 bg-background rounded-lg border border-border">
                            <h5 className="font-semibold mb-2">Complex Parts</h5>
                            <p className="text-sm text-muted-foreground mb-2">
                              Detailed mechanical assemblies, precise engineering parts.
                            </p>
                            <p className="text-xs text-muted-foreground">Starting from 150 PLN</p>
                          </div>
                          <div className="p-4 bg-background rounded-lg border border-border">
                            <h5 className="font-semibold mb-2">Artistic Models</h5>
                            <p className="text-sm text-muted-foreground mb-2">
                              Sculptures, figurines, decorative items with organic shapes.
                            </p>
                            <p className="text-xs text-muted-foreground">Starting from 200 PLN</p>
                          </div>
                          <div className="p-4 bg-background rounded-lg border border-border">
                            <h5 className="font-semibold mb-2">Revisions Included</h5>
                            <p className="text-sm text-muted-foreground">
                              Up to 2 rounds of revisions included in every design project.
                            </p>
                          </div>
                        </div>
                        
                        <Button onClick={() => navigate("/design-assistance")} className="w-full mt-6" size="lg">
                          <Download className="w-4 h-4 mr-2" />
                          Request Design Help
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Dashboard Demo Video Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background relative">
        <div className="container mx-auto max-w-7xl">
          <div className="animate-slide-up text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">See Our Dashboard In Action</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Experience our intuitive client dashboard where you can manage your orders, track progress, and communicate with our team - all in one place.
            </p>
          </div>

          {/* Dashboard Demo Video */}
          <div className="max-w-6xl mx-auto animate-scale-in">
            {/* Monitor Frame */}
            <div className="relative">
              {/* Monitor Screen */}
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-3 shadow-2xl">
                {/* Top Bar */}
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                
                {/* Video Container */}
                <div className="relative rounded-lg overflow-hidden shadow-xl border-2 border-primary/30">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto"
                  >
                    <source src="/dashboard-demo.mp4" type="video/mp4" />
                  </video>
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent"></div>
                  </div>
                </div>
              </div>
              
              {/* Monitor Stand */}
              <div className="flex justify-center mt-4">
                <div className="w-32 h-2 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-full"></div>
              </div>
              <div className="flex justify-center">
                <div className="w-48 h-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-t-lg"></div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-primary/20 rounded-full blur-2xl animate-float"></div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
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
      <section className="w-full border-y-2 border-border bg-white py-16 px-6">
        <div className="container mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold mb-4 gradient-text">{t('services.cta.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('services.cta.subtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/new-print")}
              className="shadow-lg hover:shadow-xl"
            >
              {t('services.cta.startButton')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                navigate("/");
                setTimeout(() => {
                  const contactSection = document.getElementById("contact-form");
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }, 100);
              }}
            >
              {t('services.cta.contactButton')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/services/design")}>{t('landing.footerDesign')}</li>
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/services/consulting")}>{t('landing.footerPrototyping')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">{t('landing.footerCompany')}</h4>
              <ul className="space-y-3">
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/about")}>{t('landing.footerAbout')}</li>
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/contact")}>{t('landing.footerContact')}</li>
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">{t('landing.footerPrivacy')}</li>
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

export default Services;
