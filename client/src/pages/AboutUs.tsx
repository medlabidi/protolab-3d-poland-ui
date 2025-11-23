import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Box, Target, Users, Award, Sparkles, Heart, Globe, Zap, Package, Shield } from "lucide-react";

const AboutUs = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const values = [
    {
      icon: Target,
      title: t.aboutUs.value1Title,
      description: t.aboutUs.value1Desc,
    },
    {
      icon: Heart,
      title: t.aboutUs.value2Title,
      description: t.aboutUs.value2Desc,
    },
    {
      icon: Sparkles,
      title: t.aboutUs.value3Title,
      description: t.aboutUs.value3Desc,
    },
    {
      icon: Shield,
      title: t.aboutUs.value4Title,
      description: t.aboutUs.value4Desc,
    },
  ];

  const milestones = [
    {
      year: "2020",
      title: t.aboutUs.milestone1Title,
      description: t.aboutUs.milestone1Desc,
    },
    {
      year: "2021",
      title: t.aboutUs.milestone2Title,
      description: t.aboutUs.milestone2Desc,
    },
    {
      year: "2023",
      title: t.aboutUs.milestone3Title,
      description: t.aboutUs.milestone3Desc,
    },
    {
      year: "2024",
      title: t.aboutUs.milestone4Title,
      description: t.aboutUs.milestone4Desc,
    },
  ];

  const team = [
    {
      name: "Adam Kowalski",
      role: t.aboutUs.teamRole1,
      description: t.aboutUs.teamDesc1,
    },
    {
      name: "Maria Nowak",
      role: t.aboutUs.teamRole2,
      description: t.aboutUs.teamDesc2,
    },
    {
      name: "Piotr Wiśniewski",
      role: t.aboutUs.teamRole3,
      description: t.aboutUs.teamDesc3,
    },
  ];

  const stats = [
    {
      icon: Package,
      value: "5000+",
      label: t.aboutUs.stat1,
    },
    {
      icon: Users,
      value: "500+",
      label: t.aboutUs.stat2,
    },
    {
      icon: Globe,
      value: "50+",
      label: t.aboutUs.stat3,
    },
    {
      icon: Award,
      value: "98%",
      label: t.aboutUs.stat4,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="border-b border-border glass-effect sticky top-0 z-50 animate-slide-up">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xl font-bold text-primary group cursor-pointer"
          >
            <Box className="w-6 h-6 transition-transform group-hover:rotate-180 duration-500" />
            <span className="gradient-text">{t.common.protolab}</span>
          </button>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/login")} className="hover-lift">
              {t.landing.login}
            </Button>
            <Button onClick={() => navigate("/new-print")} className="hover-lift shadow-lg hover:shadow-xl">
              {t.landing.getStarted}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 relative animate-slide-up">
        <div className="container mx-auto text-center max-w-4xl">
          {/* <div className="inline-block mb-4 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-semibold animate-pulse-glow">
            ✨ {t.aboutUs.badge}
          </div> */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-gradient bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent leading-tight">
            {t.aboutUs.title}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            {t.aboutUs.subtitle}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background relative">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h2 className="text-4xl font-bold mb-6 gradient-text">{t.aboutUs.storyTitle}</h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>{t.aboutUs.storyPara1}</p>
                <p>{t.aboutUs.storyPara2}</p>
                <p>{t.aboutUs.storyPara3}</p>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-3xl flex items-center justify-center border-2 border-primary/20 shadow-2xl">
                <Box className="w-32 h-32 text-primary animate-float" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-purple-600 to-primary rounded-2xl flex items-center justify-center shadow-xl animate-pulse-glow">
                <Zap className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card 
                key={index}
                className="text-center hover-lift border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-white to-gray-50/30 shadow-lg animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-8 pb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                  <p className="text-muted-foreground font-semibold">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{t.aboutUs.valuesTitle}</h2>
            <p className="text-muted-foreground text-lg">{t.aboutUs.valuesSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card 
                key={index}
                className="hover-lift group border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-white to-gray-50/30 shadow-lg animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-8 pb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <value.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{value.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{t.aboutUs.journeyTitle}</h2>
            <p className="text-muted-foreground text-lg">{t.aboutUs.journeySubtitle}</p>
          </div>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary to-purple-600 hidden md:block"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} animate-slide-up`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <Card className="hover-lift border-2 border-primary/20 bg-gradient-to-br from-white to-gray-50/30 shadow-lg">
                      <CardContent className="pt-6 pb-6">
                        <div className="text-3xl font-bold gradient-text mb-2">{milestone.year}</div>
                        <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                        <p className="text-muted-foreground">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="hidden md:block w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full border-4 border-background shadow-lg z-10"></div>
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{t.aboutUs.teamTitle}</h2>
            <p className="text-muted-foreground text-lg">{t.aboutUs.teamSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card 
                key={index}
                className="hover-lift text-center border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-white to-gray-50/30 shadow-lg animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-8 pb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                  <p className="text-primary font-semibold mb-3">{member.role}</p>
                  <p className="text-muted-foreground leading-relaxed">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-accent/5"></div>
        <div className="container mx-auto text-center max-w-3xl relative z-10">
          <div className="p-12 rounded-3xl glass-effect shadow-2xl border-2 border-primary/10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">{t.aboutUs.ctaTitle}</h2>
            <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
              {t.aboutUs.ctaSubtitle}
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button 
                size="lg" 
                className="text-lg px-12 py-7 hover-lift shadow-xl group relative overflow-hidden"
                onClick={() => navigate("/new-print")}
              >
                <span className="relative z-10 flex items-center">
                  <Zap className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                  {t.aboutUs.ctaButton}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-12 py-7 hover-lift border-2"
                onClick={() => navigate("/login")}
              >
                {t.landing.login}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6 bg-gradient-to-b from-background to-muted/30 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 text-xl font-bold mb-6 group cursor-pointer">
                <Box className="w-6 h-6 text-primary transition-transform group-hover:rotate-180 duration-500" />
                <span className="gradient-text">ProtoLab</span>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Professional 3D printing services in Poland
              </p>
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
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Contact</li>
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

export default AboutUs;
