import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Upload, Settings, Truck, Package, Palette, Zap, Box } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Upload,
      title: "Upload Your Model",
      description: "Support for STL, OBJ, and STEP files",
    },
    {
      icon: Settings,
      title: "Configure Parameters",
      description: "Choose material, color, quality and more",
    },
    {
      icon: Zap,
      title: "Get Instant Quote",
      description: "Receive your price estimate immediately",
    },
  ];

  const materials = [
    { name: "PLA", description: "Standard, eco-friendly" },
    { name: "ABS", description: "Durable, heat-resistant" },
    { name: "PETG", description: "Strong and flexible" },
    { name: "TPU", description: "Rubber-like elasticity" },
    { name: "Nylon", description: "Industrial strength" },
    { name: "Resin", description: "High detail finish" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold text-primary">
            <Box className="w-6 h-6" />
            ProtoLab
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="outline" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/new-print")}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            On-Demand 3D Printing in Poland
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload your 3D model, get instant pricing, and receive professional prints delivered to your door
          </p>
          <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/new-print")}>
            <Upload className="mr-2 h-5 w-5" />
            Upload Your 3D File
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
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
          <h2 className="text-3xl font-bold text-center mb-12">Supported Materials</h2>
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

      {/* Pricing Info */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Our pricing is based on material volume, print time, and chosen quality. Get an instant estimate before placing your order.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <Package className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Local Pickup</h3>
                <p className="text-sm text-muted-foreground">Free - Collect from our studio</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Truck className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">InPost Locker</h3>
                <p className="text-sm text-muted-foreground">From 12 PLN</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Truck className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Courier Delivery</h3>
                <p className="text-sm text-muted-foreground">From 25 PLN</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
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
