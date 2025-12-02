import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Upload, Settings, Truck, Package, Palette, Zap, Mail, Phone, MapPin, Clock, Send, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Logo } from "@/components/Logo";

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('accessToken');

  const steps = [
    {
      icon: Upload,
      title: t.landing.step1Title,
      description: t.landing.step1Desc,
    },
    {
      icon: Settings,
      title: t.landing.step2Title,
      description: t.landing.step2Desc,
    },
    {
      icon: Zap,
      title: t.landing.step3Title,
      description: t.landing.step3Desc,
    },
  ];

  const materials = [
    { name: "PLA", description: t.landing.material1 },
    { name: "ABS", description: t.landing.material2 },
    { name: "PETG", description: t.landing.material3 },
    { name: "TPU", description: t.landing.material4 },
    { name: "Nylon", description: t.landing.material5 },
    { name: "Resin", description: t.landing.material6 },
  ];

  const features = [
    {
      icon: Zap,
      title: t.landing.feature1Title,
      description: t.landing.feature1Desc,
    },
    {
      icon: Package,
      title: t.landing.feature2Title,
      description: t.landing.feature2Desc,
    },
    {
      icon: Truck,
      title: t.landing.feature3Title,
      description: t.landing.feature3Desc,
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
      <header className="border-b border-border glass-effect sticky top-0 z-50 animate-slide-up">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold text-primary group cursor-pointer">
            <Logo size="sm" textClassName="text-xl" />
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {isLoggedIn ? (
              <Button onClick={() => navigate("/dashboard")} className="hover-lift shadow-lg hover:shadow-xl">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                {t.dashboard?.overview || 'Dashboard'}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/login")} className="hover-lift">
                  {t.landing.login}
                </Button>
                <Button onClick={() => navigate("/new-print")} className="hover-lift shadow-lg hover:shadow-xl">
                  {t.landing.getStarted}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 relative animate-slide-up">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-gradient bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent leading-tight">
            {t.landing.title}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            {t.landing.subtitle}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button 
              size="lg" 
              className="text-lg px-10 py-7 hover-lift shadow-xl group relative overflow-hidden"
              onClick={() => navigate("/new-print")}
            >
              <span className="relative z-10 flex items-center">
                <Upload className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                {t.landing.uploadButton}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-10 py-7 hover-lift"
              onClick={() => navigate("/about")}
            >
              {t.landing.learnMore}
            </Button>
          </div>
          
          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl font-bold gradient-text">500+</div>
              <div className="text-sm text-muted-foreground mt-1">Projects Completed</div>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-4xl font-bold gradient-text">24h</div>
              <div className="text-sm text-muted-foreground mt-1">Average Delivery</div>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.6s' }}>
              <div className="text-4xl font-bold gradient-text">98%</div>
              <div className="text-sm text-muted-foreground mt-1">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{t.landing.howItWorks}</h2>
            <p className="text-muted-foreground text-lg">Simple process, professional results</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card 
                key={index} 
                className="border-none shadow-lg hover-lift group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 animate-scale-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardContent className="pt-8 text-center relative z-10">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-primary/5">
                    {index + 1}
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Materials */}
      <section className="py-20 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{t.landing.supportedMaterials}</h2>
            <p className="text-muted-foreground text-lg">Industry-leading material selection</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {materials.map((material, index) => (
              <Card 
                key={index} 
                className="hover-lift group border-2 border-transparent hover:border-primary/20 transition-all duration-300 bg-gradient-to-br from-white to-gray-50/30"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Palette className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{material.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{material.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{t.landing.whyChooseUs}</h2>
            <p className="text-muted-foreground text-lg">Excellence in every print</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-center group animate-scale-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-accent/5"></div>
        <div className="container mx-auto text-center max-w-3xl relative z-10">
          <div className="p-12 rounded-3xl glass-effect shadow-2xl border-2 border-primary/10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">{t.landing.readyToStart}</h2>
            <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
              {t.landing.subtitle}
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button 
                size="lg" 
                className="text-lg px-12 py-7 hover-lift shadow-xl group relative overflow-hidden"
                onClick={() => navigate("/new-print")}
              >
                <span className="relative z-10 flex items-center">
                  <Upload className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                  {t.landing.uploadNow}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{t.landing.contactTitle}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.landing.contactSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="shadow-xl border-2 border-primary/10 bg-gradient-to-br from-white to-gray-50/30 animate-scale-in">
              <CardContent className="pt-8 pb-8">
                <form className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">{t.landing.contactName}</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors bg-background"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">{t.landing.contactEmail}</label>
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
                    <label className="text-sm font-semibold text-foreground">{t.landing.contactPhone}</label>
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
                    <label className="text-sm font-semibold text-foreground">{t.landing.contactMessage}</label>
                    <textarea 
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors bg-background resize-none"
                      placeholder="Tell us about your project..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 hover-lift shadow-lg group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      <Send className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      {t.landing.contactSend}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Map and Contact Info */}
            <div className="space-y-6">
              {/* Google Maps */}
              <Card className="shadow-xl border-2 border-primary/10 bg-gradient-to-br from-white to-gray-50/30 overflow-hidden animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-0">
                  <div className="aspect-video w-full">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2443.2879478476776!2d21.01223431594395!3d52.22967797975988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471ecc669a869f01%3A0x72f0be2a88ead3fc!2sPalace%20of%20Culture%20and%20Science!5e0!3m2!1sen!2spl!4v1234567890123!5m2!1sen!2spl"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="rounded-t-lg"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Details */}
              <div className="grid gap-4">
                <Card className="hover-lift border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-white to-gray-50/30 shadow-lg animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{t.landing.contactAddress}</h3>
                        <p className="text-muted-foreground">{t.landing.contactAddressLine1}</p>
                        <p className="text-muted-foreground">{t.landing.contactAddressLine2}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-lift border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-white to-gray-50/30 shadow-lg animate-scale-in" style={{ animationDelay: '0.3s' }}>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">Email</h3>
                        <p className="text-muted-foreground">info@protolab.pl</p>
                        <p className="text-muted-foreground">support@protolab.pl</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-lift border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-white to-gray-50/30 shadow-lg animate-scale-in" style={{ animationDelay: '0.4s' }}>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">Phone</h3>
                        <p className="text-muted-foreground">+48 123 456 789</p>
                        <p className="text-muted-foreground">+48 987 654 321</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-lift border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-white to-gray-50/30 shadow-lg animate-scale-in" style={{ animationDelay: '0.5s' }}>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{t.landing.contactHours}</h3>
                        <p className="text-muted-foreground">{t.landing.contactHoursTime}</p>
                        <p className="text-muted-foreground">Sat-Sun: Closed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-16 px-6 bg-gradient-to-b from-background to-muted/30 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 text-xl font-bold mb-6 group cursor-pointer">
                <Logo size="sm" textClassName="text-xl" />
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Professional 3D printing services in Poland
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
              <h4 className="font-bold text-lg mb-4">Services</h4>
              <ul className="space-y-3">
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">3D Printing</li>
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Design Consultation</li>
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Rapid Prototyping</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-3">
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/about")}>About Us</li>
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</li>
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Contact</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">📧 info@protolab.pl</li>
                <li className="hover:text-primary transition-colors cursor-pointer">📞 +48 123 456 789</li>
                <li className="hover:text-primary transition-colors cursor-pointer">📍 Warsaw, Poland</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 text-center">
            <p className="text-muted-foreground">
              © 2024 ProtoLab. All rights reserved. Made with ❤️ in Poland
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
