import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Lock, Eye, FileText, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('accessToken');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 animate-slide-up">
        <div className="backdrop-blur-md bg-background/30 border-b border-white/10">
          <div className="container mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl font-bold text-primary group cursor-pointer" onClick={() => navigate("/")}>
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
      <section className="pt-32 pb-12 px-6 relative">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-3 mb-6">
            <Shield className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-gradient bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent leading-tight">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Last updated: December 11, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-6 relative">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg max-w-none">
            
            {/* Introduction */}
            <div className="mb-12 p-6 bg-card rounded-lg border-2 border-primary/20">
              <h2 className="text-3xl font-bold mb-4 text-primary flex items-center gap-3">
                <FileText className="w-8 h-8" />
                Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                At Protolab 3D Poland, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="mb-12 p-6 bg-card rounded-lg border-2 border-primary/20">
              <h2 className="text-3xl font-bold mb-4 text-primary flex items-center gap-3">
                <Eye className="w-8 h-8" />
                Information We Collect
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Personal Information</h3>
                  <p className="leading-relaxed">
                    We may collect personal information that you voluntarily provide to us when you:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Register for an account</li>
                    <li>Place an order for 3D printing services</li>
                    <li>Submit design assistance requests</li>
                    <li>Contact us through our contact form</li>
                    <li>Subscribe to our newsletter</li>
                  </ul>
                  <p className="mt-2">
                    This information may include: name, email address, phone number, billing address, shipping address, and payment information.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Technical Information</h3>
                  <p className="leading-relaxed">
                    We automatically collect certain information when you visit our website:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>IP address</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Pages visited and time spent</li>
                    <li>Referring website</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">3D Files and Design Data</h3>
                  <p className="leading-relaxed">
                    When you upload 3D models or submit design requests, we collect and store your files and project specifications to fulfill your orders.
                  </p>
                </div>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div className="mb-12 p-6 bg-card rounded-lg border-2 border-primary/20">
              <h2 className="text-3xl font-bold mb-4 text-primary flex items-center gap-3">
                <Lock className="w-8 h-8" />
                How We Use Your Information
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Process and fulfill your orders</li>
                  <li>Communicate with you about your projects and orders</li>
                  <li>Provide customer support</li>
                  <li>Send you updates about our services (with your consent)</li>
                  <li>Improve our website and services</li>
                  <li>Detect and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </div>

            {/* Data Security */}
            <div className="mb-12 p-6 bg-card rounded-lg border-2 border-primary/20">
              <h2 className="text-3xl font-bold mb-4 text-primary flex items-center gap-3">
                <Shield className="w-8 h-8" />
                Data Security
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments</li>
                  <li>Access controls and authentication</li>
                  <li>Secure file storage and backup systems</li>
                </ul>
              </div>
            </div>

            {/* Data Retention */}
            <div className="mb-12 p-6 bg-card rounded-lg border-2 border-primary/20">
              <h2 className="text-3xl font-bold mb-4 text-primary">Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. 3D files and design data are retained for the duration of your project and may be archived for quality assurance purposes.
              </p>
            </div>

            {/* Your Rights */}
            <div className="mb-12 p-6 bg-card rounded-lg border-2 border-primary/20">
              <h2 className="text-3xl font-bold mb-4 text-primary">Your Rights</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">Under GDPR and applicable data protection laws, you have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal data</li>
                  <li>Rectify inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Request data portability</li>
                  <li>Withdraw consent at any time</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  To exercise any of these rights, please contact us at privacy@protolab3d.pl
                </p>
              </div>
            </div>

            {/* Cookies */}
            <div className="mb-12 p-6 bg-card rounded-lg border-2 border-primary/20">
              <h2 className="text-3xl font-bold mb-4 text-primary">Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.
              </p>
            </div>

            {/* Third-Party Services */}
            <div className="mb-12 p-6 bg-card rounded-lg border-2 border-primary/20">
              <h2 className="text-3xl font-bold mb-4 text-primary">Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party service providers to help us operate our business and website. These providers have access to your information only to perform tasks on our behalf and are obligated to protect your data.
              </p>
            </div>

            {/* Contact Information */}
            <div className="mb-12 p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary/30">
              <h2 className="text-3xl font-bold mb-4 text-primary">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-foreground">
                <p><strong>Email:</strong> privacy@protolab3d.pl</p>
                <p><strong>Phone:</strong> +48 123 456 789</p>
                <p><strong>Address:</strong> Warsaw, Poland</p>
              </div>
            </div>

            {/* Updates */}
            <div className="p-6 bg-card rounded-lg border-2 border-primary/20">
              <h2 className="text-3xl font-bold mb-4 text-primary">Policy Updates</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Back to Home Button */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <Button 
            onClick={() => navigate("/")} 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            Back to Home
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 mt-20">
        <div className="container mx-auto max-w-7xl text-center text-muted-foreground">
          <p>&copy; 2025 Protolab 3D Poland. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
