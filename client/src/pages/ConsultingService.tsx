import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { Calendar, Clock, CheckCircle2, ArrowRight, User, Mail, Phone, MessageSquare } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const ConsultingService = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "",
    message: "",
  });

  // Available time slots
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  ];

  // Filter out past dates and weekends
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = date.getDay();
    return date < today || day === 0 || day === 6; // Disable past dates and weekends
  };

  const consultingTopics = [
    { value: "3d-modeling", label: t('services.consulting.topics.modeling') },
    { value: "material-selection", label: t('services.consulting.topics.materials') },
    { value: "project-optimization", label: t('services.consulting.topics.optimization') },
    { value: "technical-support", label: t('services.consulting.topics.technical') },
    { value: "business-solutions", label: t('services.consulting.topics.business') },
    { value: "other", label: t('services.consulting.topics.other') },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.topic || !selectedDate || !selectedTime) {
      toast.error(t('services.consulting.validation.required'));
      return;
    }

    // TODO: Implement actual appointment booking logic
    const appointmentData = {
      ...formData,
      date: selectedDate,
      time: selectedTime,
    };
    
    toast.success(t('services.consulting.success'));
    console.log("Appointment booked:", appointmentData);
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      topic: "",
      message: "",
    });
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  const benefits = [
    {
      icon: User,
      title: t('services.consulting.benefits.expert'),
      description: t('services.consulting.benefits.expertDesc'),
    },
    {
      icon: Clock,
      title: t('services.consulting.benefits.flexible'),
      description: t('services.consulting.benefits.flexibleDesc'),
    },
    {
      icon: MessageSquare,
      title: t('services.consulting.benefits.personalized'),
      description: t('services.consulting.benefits.personalizedDesc'),
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
      <section className="py-16 px-6 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/5">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-gradient bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
            {t('services.consulting.title')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('services.consulting.heroDescription')}
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t('services.consulting.benefits.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={index} className="text-center hover-lift">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Appointment Booking */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-3xl">{t('services.consulting.booking.title')}</CardTitle>
              <CardDescription className="text-base">
                {t('services.consulting.booking.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    {t('services.consulting.booking.personalInfo')}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('services.consulting.booking.name')} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('services.consulting.booking.namePlaceholder')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('services.consulting.booking.email')} *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t('services.consulting.booking.emailPlaceholder')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('services.consulting.booking.phone')}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={t('services.consulting.booking.phonePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic">{t('services.consulting.booking.topic')} *</Label>
                      <Select value={formData.topic} onValueChange={(value) => setFormData({ ...formData, topic: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('services.consulting.booking.topicPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {consultingTopics.map((topic) => (
                            <SelectItem key={topic.value} value={topic.value}>
                              {topic.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Date and Time Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {t('services.consulting.booking.selectDateTime')}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date">{t('services.consulting.booking.selectDate')} *</Label>
                      <div className="flex justify-center border rounded-lg p-4 bg-card">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={isDateDisabled}
                          className="rounded-md border-0"
                        />
                      </div>
                      {selectedDate && (
                        <p className="text-sm text-muted-foreground text-center">
                          {t('services.consulting.booking.selectedDate')}: <span className="font-semibold text-primary">{selectedDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">{t('services.consulting.booking.selectTime')} *</Label>
                      <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto p-4 border rounded-lg bg-card scrollbar-thin">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={selectedTime === time ? "default" : "outline"}
                            className="w-full h-11 text-sm font-medium"
                            onClick={() => setSelectedTime(time)}
                            disabled={!selectedDate}
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {time}
                          </Button>
                        ))}
                      </div>
                      {selectedTime && (
                        <p className="text-sm text-muted-foreground text-center">
                          {t('services.consulting.booking.selectedTime')}: <span className="font-semibold text-primary">{selectedTime}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">{t('services.consulting.booking.message')}</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t('services.consulting.booking.messagePlaceholder')}
                    rows={4}
                  />
                </div>

                {/* Summary */}
                {selectedDate && selectedTime && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        {t('services.consulting.booking.summary')}
                      </h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>{t('services.consulting.booking.date')}:</strong> {selectedDate.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p><strong>{t('services.consulting.booking.time')}:</strong> {selectedTime}</p>
                        {formData.topic && <p><strong>{t('services.consulting.booking.topic')}:</strong> {consultingTopics.find(t => t.value === formData.topic)?.label}</p>}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button type="submit" size="lg" className="w-full">
                  {t('services.consulting.booking.confirm')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t('services.consulting.expect.title')}</h2>
          <div className="space-y-4">
            {[
              t('services.consulting.expect.item1'),
              t('services.consulting.expect.item2'),
              t('services.consulting.expect.item3'),
              t('services.consulting.expect.item4'),
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
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

export default ConsultingService;
