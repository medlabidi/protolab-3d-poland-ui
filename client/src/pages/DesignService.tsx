import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { Palette, Upload, FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { submitDesignRequest } from "@/utils/servicesApi";

const DesignService = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectDescription: "",
    referenceFiles: [] as File[],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        referenceFiles: Array.from(e.target.files),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.projectDescription) {
      toast.error(t('services.design.validation.required') || 'Please fill in all required fields');
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading('Submitting your design request...');

    try {
      const result = await submitDesignRequest(formData);
      
      if (result.success) {
        toast.success(result.message || t('services.design.success') || 'Design request submitted successfully!', {
          id: loadingToast,
        });
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          projectDescription: "",
          referenceFiles: [],
        });
      } else {
        toast.error(result.message || 'Failed to submit design request', {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error('Error submitting design request:', error);
      toast.error('An error occurred while submitting your request', {
        id: loadingToast,
      });
    }
  };

  const designProcess = [
    {
      step: "1",
      title: t('services.design.process.step1Title'),
      description: t('services.design.process.step1Desc'),
    },
    {
      step: "2",
      title: t('services.design.process.step2Title'),
      description: t('services.design.process.step2Desc'),
    },
    {
      step: "3",
      title: t('services.design.process.step3Title'),
      description: t('services.design.process.step3Desc'),
    },
    {
      step: "4",
      title: t('services.design.process.step4Title'),
      description: t('services.design.process.step4Desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass-effect sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold text-primary group cursor-pointer" onClick={() => navigate("/")}>
            <Logo size="sm" textClassName="text-xl" />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/services")} className="hover-lift">
              {t('common.back')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/5">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
            <Palette className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-gradient bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            {t('services.design.title')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('services.design.heroDescription')}
          </p>
        </div>
      </section>

      {/* Design Process */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t('services.design.process.title')}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {designProcess.map((item) => (
              <Card key={item.step} className="text-center hover-lift">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                    {item.step}
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Request Form */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-3xl">{t('services.design.form.title')}</CardTitle>
              <CardDescription className="text-base">
                {t('services.design.form.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('services.design.form.name')} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('services.design.form.namePlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('services.design.form.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('services.design.form.emailPlaceholder')}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('services.design.form.phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('services.design.form.phonePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('services.design.form.description')} *</Label>
                  <Textarea
                    id="description"
                    value={formData.projectDescription}
                    onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                    placeholder={t('services.design.form.descriptionPlaceholder')}
                    rows={6}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('services.design.form.descriptionHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="files">{t('services.design.form.files')}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <Input
                      id="files"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.dwg,.dxf,.step,.stl,.obj"
                    />
                    <label htmlFor="files" className="cursor-pointer">
                      <p className="text-sm font-medium mb-2">
                        {t('services.design.form.filesUpload')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('services.design.form.filesHint')}
                      </p>
                    </label>
                    {formData.referenceFiles.length > 0 && (
                      <div className="mt-4 text-left">
                        <p className="text-sm font-medium mb-2">{t('services.design.form.filesSelected')}:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {formData.referenceFiles.map((file, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {file.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  {t('services.design.form.submit')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services Included */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t('services.design.included.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              t('services.design.included.item1'),
              t('services.design.included.item2'),
              t('services.design.included.item3'),
              t('services.design.included.item4'),
              t('services.design.included.item5'),
              t('services.design.included.item6'),
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
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
                <div className="w-10 h-10 bg-primary/10 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center cursor-pointer transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </div>
                <div className="w-10 h-10 bg-primary/10 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center cursor-pointer transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </div>
                <div className="w-10 h-10 bg-primary/10 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center cursor-pointer transition-all">
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
                <li className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>{t('landing.footerContact')}</li>
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

export default DesignService;
