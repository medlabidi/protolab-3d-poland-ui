import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Upload, Settings, Truck, Package, Palette, Zap, Box } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold text-primary">
            <Box className="w-6 h-6" />
            {t.common.protolab}
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="outline" onClick={() => navigate("/login")}>
              {t.landing.login}
            </Button>
            <Button onClick={() => navigate("/new-print")}>{t.landing.getStarted}</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t.landing.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.landing.subtitle}
          </p>
          <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/new-print")}>
            <Upload className="mr-2 h-5 w-5" />
            {t.landing.uploadButton}
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t.landing.howItWorks}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Materials */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t.landing.supportedMaterials}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {materials.map((material, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Palette className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">{material.name}</h3>
                      <p className="text-sm text-muted-foreground">{material.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t.landing.whyChooseUs}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">{t.landing.readyToStart}</h2>
          <p className="text-muted-foreground mb-8">
            {t.landing.subtitle}
          </p>
          <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/new-print")}>
            <Upload className="mr-2 h-5 w-5" />
            {t.landing.uploadNow}
          </Button>
        </div>
      </section>
      <footer className="border-t border-border py-12 px-6 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-primary mb-4">
                <Box className="w-5 h-5" />
                ProtoLab
              </div>
              <p className="text-sm text-muted-foreground">
                Professional 3D printing services in Poland
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>3D Printing</li>
                <li>Design Consultation</li>
                <li>Rapid Prototyping</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>info@protolab.pl</li>
                <li>+48 123 456 789</li>
                <li>Warsaw, Poland</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2024 ProtoLab. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
