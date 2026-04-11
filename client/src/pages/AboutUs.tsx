import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Box, Target, Users, Award, Sparkles, Heart, Globe, Zap, Package, Shield, Upload, LayoutDashboard, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useEffect, useRef } from "react";

const AboutUs = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('accessToken');

  const values = [
    {
      icon: Target,
      title: t('aboutUs.value1Title'),
      description: t('aboutUs.value1Desc'),
    },
    {
      icon: Heart,
      title: t('aboutUs.value2Title'),
      description: t('aboutUs.value2Desc'),
    },
    {
      icon: Sparkles,
      title: t('aboutUs.value3Title'),
      description: t('aboutUs.value3Desc'),
    },
    {
      icon: Shield,
      title: t('aboutUs.value4Title'),
      description: t('aboutUs.value4Desc'),
    },
  ];

  const milestones = [
    {
      year: "",
      title: t('aboutUs.milestone1Title'),
      description: t('aboutUs.milestone1Desc'),
    },
    {
      year: "",
      title: t('aboutUs.milestone2Title'),
      description: t('aboutUs.milestone2Desc'),
    },
    {
      year: "",
      title: t('aboutUs.milestone3Title'),
      description: t('aboutUs.milestone3Desc'),
    },
    {
      year: "",
      title: t('aboutUs.milestone4Title'),
      description: t('aboutUs.milestone4Desc'),
    },
  ];

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
        <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8">
          <div ref={countRef} className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-2 sm:mb-3">
            {count}{suffix}
          </div>
          <p className="text-muted-foreground font-semibold text-base sm:text-lg">{stat.label}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 border-b border-border glass-effect z-50 animate-slide-up">
        <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
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
          <button
            className="md:hidden p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            {isLoggedIn ? (
              <Button onClick={() => navigate("/dashboard")} className="hover-lift shadow-lg hover:shadow-xl" size="sm">
                <LayoutDashboard className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('dashboard.overview')}</span>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/login")} className="hover-lift" size="sm">
                {t('landing.login')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[57px] z-40 md:hidden bg-background/95 backdrop-blur-md border-b border-border p-4 space-y-2">
          <Button variant="ghost" onClick={() => { navigate("/about"); setMobileMenuOpen(false); }} className="w-full justify-start">
            {t('nav.aboutUs')}
          </Button>
          <Button variant="ghost" onClick={() => { navigate("/services"); setMobileMenuOpen(false); }} className="w-full justify-start">
            {t('nav.services')}
          </Button>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6 relative animate-slide-up">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 animate-gradient bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent leading-tight">
            {t('aboutUs.title')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('aboutUs.subtitle')}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 bg-gradient-to-b from-muted/30 to-background relative">
        <div className="container mx-auto max-w-7xl">
          <div className="animate-slide-up text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 gradient-text">{t('aboutUs.storyTitle')}</h2>
            <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              <p>{t('aboutUs.storyPara1')}</p>
              <p>{t('aboutUs.storyPara2')}</p>
              <p>{t('aboutUs.storyPara3')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-fixed bg-center bg-cover opacity-50"
          style={{
            backgroundImage: `url('/OurValues.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background/70"></div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 gradient-text">{t('aboutUs.valuesTitle')}</h2>
            <p className="text-muted-foreground text-base sm:text-lg">{t('aboutUs.valuesSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="group border-2 border-transparent bg-gradient-to-br from-card to-muted/30 shadow-lg animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <value.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors">{value.title}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section - Simple Modern Design */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-fixed bg-center bg-cover opacity-50"
          style={{
            backgroundImage: `url('/OurValues.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background/70"></div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 gradient-text">{t('aboutUs.journeyTitle')}</h2>
            <p className="text-muted-foreground text-base sm:text-lg">{t('aboutUs.journeySubtitle')}</p>
          </div>

          {/* Simple Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {milestones.map((milestone, index) => (
              <Card
                key={index}
                className="group border-2 border-primary/20 bg-card/80 backdrop-blur shadow-lg transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4 sm:p-6 md:p-8">
                  {/* Number and Title in same line */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0">
                      {index + 1}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold group-hover:text-primary transition-colors">
                      {milestone.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {milestone.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-accent/5"></div>
        <div className="w-full relative z-10">
          <div className="px-3 sm:px-4 md:px-6 lg:px-12 py-10 sm:py-12 md:py-16 bg-white/95 backdrop-blur-sm shadow-2xl border-y-2 border-primary/10">
            <div className="container mx-auto text-center max-w-7xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 gradient-text">{t('aboutUs.ctaTitle')}</h2>
              <p className="text-muted-foreground mb-6 sm:mb-8 md:mb-10 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                {t('aboutUs.ctaSubtitle')}
              </p>
              <Button
                size="lg"
                className="text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-7 hover-lift shadow-xl group relative overflow-hidden"
                onClick={() => navigate("/new-print")}
              >
                <span className="relative z-10 flex items-center">
                  <Zap className="mr-2 h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
                  {t('aboutUs.ctaButton')}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-b from-background to-muted/30 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-10 md:mb-12">
            <div>
              <div className="flex items-center gap-2 text-xl font-bold mb-4 sm:mb-6 group cursor-pointer">
                <Logo size="sm" textClassName="text-xl" />
              </div>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                {t('landing.footerDescription')}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">{t('landing.footerServices')}</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/new-print")}>{t('landing.footerPrinting')}</li>
                <li className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/design-assistance")}>{t('landing.footerDesign')}</li>
                <li className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/design-assistance")}>{t('landing.footerPrototyping')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">{t('landing.footerCompany')}</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/about")}>{t('landing.footerAbout')}</li>
                <li className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>{t('landing.footerContact')}</li>
                <li className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors cursor-pointer">{t('landing.footerPrivacy')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">{t('landing.footerContactHeader')}</h4>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">info@protolab.pl</li>
                <li className="hover:text-primary transition-colors cursor-pointer">+48 123 456 789</li>
                <li className="hover:text-primary transition-colors cursor-pointer">{t('landing.footerLocation')}</li>
              </ul>
            </div>
          </div>
          <div className="pt-6 sm:pt-8 border-t border-border/50 text-center">
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('landing.footerCopyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
