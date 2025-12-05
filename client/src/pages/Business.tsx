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
      toast.error("Company name is required");
      return;
    }
    if (!billingInfo.taxId.trim()) {
      toast.error("Tax ID (NIP) is required");
      return;
    }
    if (!billingInfo.billingAddress.trim()) {
      toast.error("Billing address is required");
      return;
    }
    if (!billingInfo.billingCity.trim()) {
      toast.error("City is required");
      return;
    }
    if (!billingInfo.billingZipCode.trim()) {
      toast.error("ZIP code is required");
      return;
    }

    localStorage.setItem("billingInfo", JSON.stringify(billingInfo));
    setBillingInfoSaved(true);
    toast.success("Billing information saved successfully");
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
    toast.success("Billing information cleared");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold gradient-text mb-2">ProtoLab for Business</h1>
            <p className="text-muted-foreground">
              Manage your business account, billing information, and invoices
            </p>
          </div>

          {/* Billing Information Card */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Billing Information
              </CardTitle>
              <CardDescription>
                Add your business details to generate invoices automatically with each payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Company Details</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Your Company Ltd."
                      value={billingInfo.companyName}
                      onChange={(e) => handleBillingInfoChange('companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingEmail">Billing Email</Label>
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
                    <Label htmlFor="taxId">Tax ID (NIP) *</Label>
                    <Input
                      id="taxId"
                      placeholder="1234567890"
                      value={billingInfo.taxId}
                      onChange={(e) => handleBillingInfoChange('taxId', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Polish tax identification number</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">EU VAT Number (Optional)</Label>
                    <Input
                      id="vatNumber"
                      placeholder="PL1234567890"
                      value={billingInfo.vatNumber}
                      onChange={(e) => handleBillingInfoChange('vatNumber', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">For EU cross-border transactions</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Billing Address */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Billing Address</h4>
                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Street Address *</Label>
                  <Input
                    id="billingAddress"
                    placeholder="ul. Example Street 123"
                    value={billingInfo.billingAddress}
                    onChange={(e) => handleBillingInfoChange('billingAddress', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="billingCity">City *</Label>
                    <Input
                      id="billingCity"
                      placeholder="Warsaw"
                      value={billingInfo.billingCity}
                      onChange={(e) => handleBillingInfoChange('billingCity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingZipCode">ZIP Code *</Label>
                    <Input
                      id="billingZipCode"
                      placeholder="00-000"
                      value={billingInfo.billingZipCode}
                      onChange={(e) => handleBillingInfoChange('billingZipCode', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingCountry">Country</Label>
                    <Input
                      id="billingCountry"
                      placeholder="Poland"
                      value={billingInfo.billingCountry}
                      onChange={(e) => handleBillingInfoChange('billingCountry', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Invoice Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Invoice Settings</h4>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">Auto-generate Invoices</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate an invoice for each payment using your billing information
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
                  {billingInfoSaved ? 'Update Billing Info' : 'Save Billing Info'}
                </Button>
                {billingInfoSaved && (
                  <Button variant="outline" onClick={handleClearBillingInfo}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>

              {billingInfoSaved && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">Billing information saved</p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Invoices will be automatically generated with your saved details when you make payments.
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
                Billing History
              </CardTitle>
              <CardDescription>View and download your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {billingHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No billing history available</p>
                  <p className="text-xs mt-1">Invoices will appear here after you make a purchase with billing info enabled</p>
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
                Business Features
              </CardTitle>
              <CardDescription>Unlock features designed for businesses and teams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl border-2 border-primary/20">
                <h3 className="text-xl font-bold mb-2">Upgrade to Business Pro</h3>
                <p className="text-muted-foreground mb-4">
                  Get access to bulk ordering, team management, priority support, and advanced invoicing features.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Volume discounts on orders
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    Team management & shared projects
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    Priority support & dedicated account manager
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    Faster turnaround times
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary" />
                    API access for automated ordering
                  </li>
                </ul>
                <Button className="w-full" size="lg">
                  <Building2 className="w-4 h-4 mr-2" />
                  Contact Sales
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
