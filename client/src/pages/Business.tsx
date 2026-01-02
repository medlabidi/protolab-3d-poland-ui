import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  Trash2,
  Download,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Zap
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BillingHistoryItem {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  description: string;
  status: string;
  type: string;
}

const Business = () => {
  const { t } = useLanguage();
  // Billing information state
  const [billingInfo, setBillingInfo] = useState({
    companyName: '',
    taxId: '',
    vatNumber: '',
    billingAddress: '',
    billingCity: '',
    billingZipCode: '',
    billingCountry: 'Poland',
    billingEmail: '',
    generateInvoice: true,
  });
  const [billingInfoSaved, setBillingInfoSaved] = useState(false);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);

  useEffect(() => {
    // Load billing information from localStorage
    const savedBillingInfo = localStorage.getItem("billingInfo");
    if (savedBillingInfo) {
      try {
        const saved = JSON.parse(savedBillingInfo);
        setBillingInfo(prev => ({ ...prev, ...saved }));
        setBillingInfoSaved(true);
      } catch (error) {
        console.error("Failed to parse billing info:", error);
      }
    }

    // Load billing history from localStorage
    const savedBillingHistory = localStorage.getItem("billingHistory");
    if (savedBillingHistory) {
      try {
        const history = JSON.parse(savedBillingHistory);
        setBillingHistory(history);
      } catch (error) {
        console.error("Failed to parse billing history:", error);
      }
    }
  }, []);

  const handleBillingInfoChange = (field: keyof typeof billingInfo, value: string | boolean) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBillingInfo = () => {
    // Validate required fields
    if (!billingInfo.companyName.trim()) {
      toast.error(t('business.validation.companyNameRequired'));
      return;
    }
    if (!billingInfo.taxId.trim()) {
      toast.error(t('business.validation.taxIdRequired'));
      return;
    }
    if (!billingInfo.billingAddress.trim()) {
      toast.error(t('business.validation.addressRequired'));
      return;
    }
    if (!billingInfo.billingCity.trim()) {
      toast.error(t('business.validation.cityRequired'));
      return;
    }
    if (!billingInfo.billingZipCode.trim()) {
      toast.error(t('business.validation.zipRequired'));
      return;
    }

    localStorage.setItem("billingInfo", JSON.stringify(billingInfo));
    setBillingInfoSaved(true);
    toast.success(t('business.toasts.saved'));
  };

  const handleClearBillingInfo = () => {
    setBillingInfo({
      companyName: '',
      taxId: '',
      vatNumber: '',
      billingAddress: '',
      billingCity: '',
      billingZipCode: '',
      billingCountry: 'Poland',
      billingEmail: '',
      generateInvoice: true,
    });
    localStorage.removeItem("billingInfo");
    setBillingInfoSaved(false);
    toast.success(t('business.toasts.cleared'));
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold gradient-text mb-2">{t('business.title')}</h1>
            <p className="text-muted-foreground">
              {t('business.subtitle')}
            </p>
          </div>

          {/* Billing Information Card */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('business.billingInfo.title')}
              </CardTitle>
              <CardDescription>
                {t('business.billingInfo.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{t('business.billingInfo.companyDetails')}</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">{t('business.billingInfo.companyName')} *</Label>
                    <Input
                      id="companyName"
                      placeholder={t('business.billingInfo.companyNamePlaceholder')}
                      value={billingInfo.companyName}
                      onChange={(e) => handleBillingInfoChange('companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingEmail">{t('business.billingInfo.billingEmail')}</Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      placeholder="billing@company.com"
                      value={billingInfo.billingEmail}
                      onChange={(e) => handleBillingInfoChange('billingEmail', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">{t('business.billingInfo.taxId')} *</Label>
                    <Input
                      id="taxId"
                      placeholder="1234567890"
                      value={billingInfo.taxId}
                      onChange={(e) => handleBillingInfoChange('taxId', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{t('business.billingInfo.taxIdHint')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">{t('business.billingInfo.vatNumber')}</Label>
                    <Input
                      id="vatNumber"
                      placeholder="PL1234567890"
                      value={billingInfo.vatNumber}
                      onChange={(e) => handleBillingInfoChange('vatNumber', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{t('business.billingInfo.vatNumberHint')}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Billing Address */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{t('business.billingInfo.billingAddress')}</h4>
                <div className="space-y-2">
                  <Label htmlFor="billingAddress">{t('business.billingInfo.streetAddress')} *</Label>
                  <Input
                    id="billingAddress"
                    placeholder={t('business.billingInfo.streetAddressPlaceholder')}
                    value={billingInfo.billingAddress}
                    onChange={(e) => handleBillingInfoChange('billingAddress', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="billingCity">{t('business.billingInfo.city')} *</Label>
                    <Input
                      id="billingCity"
                      placeholder={t('business.billingInfo.cityPlaceholder')}
                      value={billingInfo.billingCity}
                      onChange={(e) => handleBillingInfoChange('billingCity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingZipCode">{t('business.billingInfo.zipCode')} *</Label>
                    <Input
                      id="billingZipCode"
                      placeholder="00-000"
                      value={billingInfo.billingZipCode}
                      onChange={(e) => handleBillingInfoChange('billingZipCode', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingCountry">{t('business.billingInfo.country')}</Label>
                    <Input
                      id="billingCountry"
                      placeholder={t('business.billingInfo.countryPlaceholder')}
                      value={billingInfo.billingCountry}
                      onChange={(e) => handleBillingInfoChange('billingCountry', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Invoice Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{t('business.billingInfo.invoiceSettings')}</h4>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{t('business.billingInfo.autoGenerateInvoices')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('business.billingInfo.autoGenerateInvoicesDesc')}
                    </p>
                  </div>
                  <Switch 
                    checked={billingInfo.generateInvoice} 
                    onCheckedChange={(checked) => handleBillingInfoChange('generateInvoice', checked)} 
                  />
                </div>
              </div>

              {/* Save/Clear Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveBillingInfo} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {billingInfoSaved ? t('business.billingInfo.updateButton') : t('business.billingInfo.saveButton')}
                </Button>
                {billingInfoSaved && (
                  <Button variant="outline" onClick={handleClearBillingInfo}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('business.billingInfo.clearButton')}
                  </Button>
                )}
              </div>

              {billingInfoSaved && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">{t('business.billingInfo.savedTitle')}</p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {t('business.billingInfo.savedDesc')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing History Card */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('business.history.title')}
              </CardTitle>
              <CardDescription>{t('business.history.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {billingHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">{t('business.history.empty')}</p>
                  <p className="text-xs mt-1">{t('business.history.emptyDesc')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {billingHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">{item.amount.toFixed(2)} PLN</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Features Card */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {t('business.features.title')}
              </CardTitle>
              <CardDescription>{t('business.features.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl border-2 border-primary/20">
                <h3 className="text-xl font-bold mb-2">{t('business.features.upgradeTitle')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('business.features.upgradeDesc')}
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    {t('business.features.volumeDiscounts')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    {t('business.features.teamManagement')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    {t('business.features.prioritySupport')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    {t('business.features.fasterTurnaround')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary" />
                    {t('business.features.apiAccess')}
                  </li>
                </ul>
                <Button className="w-full" size="lg">
                  <Building2 className="w-4 h-4 mr-2" />
                  {t('business.features.contactSales')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Business;
