import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Upload, Settings, Truck, Package, Palette, Zap, Box, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const steps = [
    {
      icon: Upload,
      title: t.landing.step1Title,
      description: t.landing.step1Desc,
      number: "01",
    },
    {
      icon: Settings,
      title: t.landing.step2Title,
      description: t.landing.step2Desc,
      number: "02",
    },
    {
      icon: Zap,
      title: t.landing.step3Title,
      description: t.landing.step3Desc,
      number: "03",
    },
  ];

  const materials = [
    { name: "PLA", description: t.landing.material1, color: "bg-blue-100 text-blue-600" },
    { name: "ABS", description: t.landing.material2, color: "bg-yellow-100 text-yellow-600" },
    { name: "PETG", description: t.landing.material3, color: "bg-red-100 text-red-600" },
    { name: "TPU", description: t.landing.material4, color: "bg-green-100 text-green-600" },
    { name: "Nylon", description: t.landing.material5, color: "bg-purple-100 text-purple-600" },
    { name: "Resin", description: t.landing.material6, color: "bg-pink-100 text-pink-600" },
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
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header - Modern Sticky */}
      <header className="sticky top-0 z-50 border-b border-slate-100/50 dark:border-slate-800/50 backdrop-blur-lg bg-white/80 dark:bg-slate-950/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-primary to-accent dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent animate-in fade-in">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 dark:from-blue-400/20 dark:to-blue-300/20">
              <Box className="w-6 h-6 text-primary dark:text-blue-400" />
            </div>
            {t.common.protolab}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button variant="outline" onClick={() => navigate("/login")} className="hover:bg-slate-100 dark:hover:bg-slate-800 dark:border-slate-700">
              {t.landing.login}
            </Button>
            <Button onClick={() => navigate("/new-print")} className="bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all">
              {t.landing.getStarted}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Premium */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-50"></div>
        </div>
        <div className="container mx-auto text-center max-w-3xl">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-primary to-accent dark:from-white dark:via-blue-400 dark:to-blue-300 bg-clip-text text-transparent leading-tight">
              {t.landing.title}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              {t.landing.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-7 bg-gradient-to-r from-primary to-accent hover:shadow-xl transition-all" onClick={() => navigate("/new-print")}>
                <Upload className="mr-2 h-5 w-5" />
                {t.landing.uploadButton}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-7 hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Interactive Cards */}
      <section className="py-24 px-6 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">How It Works</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">Three simple steps to get your 3D print</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="group relative">
                <Card className="h-full border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                  <CardContent className="pt-12 pb-8">
                    <div className="relative mb-6">
                      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors"></div>
                      <div className="relative text-5xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors mb-4">
                        {step.number}
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all">
                        <step.icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-primary/30">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materials - Vibrant Grid */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">Supported Materials</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">Choose from our 6 premium materials</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {materials.map((material, index) => (
              <div key={index} className="group cursor-pointer">
                <Card className="h-full border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 hover:border-primary/50 transition-all overflow-hidden hover:shadow-xl hover:-translate-y-1">
                  <CardContent className="pt-8">
                    <div className={`w-12 h-12 rounded-lg ${material.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Palette className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">{material.name}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{material.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-primary dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-semibold">Learn More</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Modern Benefits */}
      <section className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">Why Choose ProtoLab</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">We offer the best 3D printing services in Poland</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 group-hover:from-primary/30 dark:group-hover:from-primary/40 group-hover:to-accent/30 dark:group-hover:to-accent/40 transition-all">
                      <feature.icon className="h-7 w-7 text-primary dark:text-primary group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-primary dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-semibold">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Premium */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 -z-10"></div>
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">Ready to Start?</h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed">
            Upload your 3D model and get an instant quote in seconds
          </p>
          <Button size="lg" className="text-lg px-8 py-7 bg-gradient-to-r from-primary to-accent hover:shadow-2xl transition-all animate-pulse" onClick={() => navigate("/new-print")}>
            <Upload className="mr-2 h-5 w-5" />
            {t.landing.uploadNow}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer - Modern */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-16 px-6 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-primary dark:text-blue-400 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 dark:from-blue-400/20 dark:to-blue-300/20">
                  <Box className="w-5 h-5 text-primary dark:text-blue-400" />
                </div>
                {t.common.protolab}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t.footer.aboutDesc}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-slate-900 dark:text-white">{t.footer.services}</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="hover:text-primary dark:hover:text-blue-400 transition-colors cursor-pointer">3D Printing</li>
                <li className="hover:text-primary dark:hover:text-blue-400 transition-colors cursor-pointer">{t.footer.designConsultation}</li>
                <li className="hover:text-primary dark:hover:text-blue-400 transition-colors cursor-pointer">{t.footer.rapidPrototyping}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-slate-900 dark:text-white">{t.footer.company}</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="hover:text-primary dark:hover:text-blue-400 transition-colors cursor-pointer">{t.footer.aboutUs}</li>
                <li className="hover:text-primary dark:hover:text-blue-400 transition-colors cursor-pointer">{t.footer.contact}</li>
                <li className="hover:text-primary dark:hover:text-blue-400 transition-colors cursor-pointer">{t.footer.termsOfService}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-slate-900 dark:text-white">{t.footer.contactInfo}</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>{t.footer.email}</li>
                <li>{t.footer.phone}</li>
                <li>{t.footer.location}</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-600 dark:text-slate-400">
            {t.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
