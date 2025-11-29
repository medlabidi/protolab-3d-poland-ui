import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Calculator, Send, Box, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { DeliveryOptions, deliveryOptions } from "@/components/DeliveryOptions";
import { LockerPickerModal } from "@/components/LockerPickerModal";
import { DPDAddressForm, isAddressValid, ShippingAddress } from "@/components/DPDAddressForm";
import { ModelViewer } from "@/components/ModelViewer/ModelViewer";
import type { ModelAnalysis } from "@/components/ModelViewer/useModelAnalysis";

interface PriceBreakdown {
  materialCost: number;
  energyCost: number;
  serviceFee: number;
  depreciation: number;
  maintenance: number;
  internalCost: number;
  vat: number;
  totalPrice: number;
}

const NewPrint = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [material, setMaterial] = useState("");
  const [quality, setQuality] = useState("");
  const [quantity, setQuantity] = useState(1);
  
  // Delivery state
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<string | null>(null);
  const [showLockerModal, setShowLockerModal] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<{ id: string; name: string; address: string } | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
  });
  
  // 3D Model Analysis state
  const [modelAnalysis, setModelAnalysis] = useState<ModelAnalysis | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Material densities (g/cm³) - matches backend
  const MATERIAL_DENSITIES: Record<string, number> = {
    pla: 1.24,
    abs: 1.04,
    petg: 1.27,
    tpu: 1.21,
    resin: 1.1,
  };

  // Infill percentages by quality - matches backend
  const INFILL_BY_QUALITY: Record<string, number> = {
    draft: 10,
    standard: 20,
    high: 30,
    ultra: 40,
  };

  // Print speed multipliers by quality (base speed in cm³/hour)
  const PRINT_SPEED_CM3_PER_HOUR: Record<string, number> = {
    draft: 15,      // Fastest - larger layers
    standard: 10,   // Normal speed
    high: 6,        // Slower for quality
    ultra: 3,       // Slowest for finest detail
  };

  // Computed weight based on material, quality, and model volume
  const estimatedWeight = useMemo(() => {
    if (!modelAnalysis || !material || !quality) return null;
    
    const materialType = material.split('-')[0];
    const density = MATERIAL_DENSITIES[materialType] || 1.24;
    const infillPercent = INFILL_BY_QUALITY[quality] || 20;
    
    // Weight = volume × density × (1 + infill%)
    const effectiveVolume = modelAnalysis.volumeCm3 * (1 + infillPercent / 100);
    return effectiveVolume * density;
  }, [modelAnalysis, material, quality]);

  // Computed print time based on model volume and quality
  const estimatedPrintTime = useMemo(() => {
    if (!modelAnalysis || !quality) return null;
    
    const infillPercent = INFILL_BY_QUALITY[quality] || 20;
    const speedCm3PerHour = PRINT_SPEED_CM3_PER_HOUR[quality] || 10;
    
    // Effective volume with infill
    const effectiveVolume = modelAnalysis.volumeCm3 * (1 + infillPercent / 100);
    
    // Time = volume / speed (in hours)
    const printTimeHours = effectiveVolume / speedCm3PerHour;
    
    // Add setup time (15 minutes minimum)
    return Math.max(0.25, printTimeHours);
  }, [modelAnalysis, quality]);

  // Format print time for display
  const formatPrintTime = (hours: number | null): string => {
    if (hours === null) return '--';
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsModelLoading(true);
      setModelAnalysis(null);
      toast.success("File uploaded successfully! Analyzing model...");
    }
  };

  const handleAnalysisComplete = (analysis: ModelAnalysis) => {
    setModelAnalysis(analysis);
    setIsModelLoading(false);
    toast.success(`Model analyzed! Volume: ${analysis.volumeCm3.toFixed(2)} cm³, Weight: ${analysis.weightGrams.toFixed(1)}g`);
  };

  const calculatePrice = () => {
    // Validate inputs
    if (!file) {
      toast.error("Please upload a 3D model file first");
      return;
    }
    
    if (!material) {
      toast.error("Please select a material");
      return;
    }
    
    if (!quality) {
      toast.error("Please select print quality");
      return;
    }
    
    // MATERIAL PRICES (PLN per kg) - exact pricing
    const materialPrices: Record<string, number> = {
      // PLA
      "pla-white": 39,
      "pla-black": 39,
      "pla-red": 49,
      "pla-yellow": 49,
      "pla-blue": 49,
      // ABS
      "abs-silver": 50,
      "abs-transparent": 50,
      "abs-black": 50,
      "abs-grey": 50,
      "abs-red": 50,
      "abs-white": 50,
      "abs-blue": 50,
      "abs-green": 50,
      // PETG
      "petg-black": 30,
      "petg-white": 35,
      "petg-red": 39,
      "petg-green": 39,
      "petg-blue": 39,
      "petg-yellow": 39,
      "petg-pink": 39,
      "petg-orange": 39,
      "petg-silver": 39,
    };

    // Get material type from selection (e.g., "pla-white" -> "pla")
    const materialType = material.split('-')[0];
    const density = MATERIAL_DENSITIES[materialType] || 1.24;
    const infillPercent = INFILL_BY_QUALITY[quality] || 20;
    
    // Calculate weight using volume, density, and infill factor (matches backend)
    let materialWeightGrams: number;
    if (modelAnalysis) {
      const volumeCm3 = modelAnalysis.volumeCm3;
      const effectiveVolume = volumeCm3 * (1 + (infillPercent / 100));
      materialWeightGrams = effectiveVolume * density;
    } else {
      // Fallback: 1MB ≈ 10g
      materialWeightGrams = (file.size / 1024 / 1024) * 10;
      toast.warning("Using estimated weight. Model is still loading...");
    }
    
    // Calculate print time based on volume and quality
    const printTimeHours = estimatedPrintTime || 4;
    
    // Material cost: Cmaterial = materialPricePerKg * (materialWeightGrams / 1000)
    const materialPricePerKg = materialPrices[material] || 39;
    const Cmaterial = materialPricePerKg * (materialWeightGrams / 1000);
    
    // Energy cost: Cenergy = T * W * Pe
    const W = 0.27; // 270W = 0.27 kW
    const Pe = 0.914; // PLN per kWh in Krakow
    const Cenergy = printTimeHours * W * Pe;
    
    // Labor cost: Clabor = R * L (10 minutes default - matches backend)
    const R = 31.40; // PLN per hour
    const laborTimeMinutes = 10;
    const Clabor = R * (laborTimeMinutes / 60);
    
    // Machine depreciation: Cdepreciation = (machineCost / lifespanHours) * printTimeHours
    const machineCost = 3483.39;
    const lifespanHours = 5000;
    const Cdepreciation = (machineCost / lifespanHours) * printTimeHours;
    
    // Maintenance cost: Cmaintenance = Cdepreciation * 0.03 (3% - matches backend)
    const Cmaintenance = Cdepreciation * 0.03;
    
    // Total internal cost
    const Cinternal = Cmaterial + Cenergy + Clabor + Cdepreciation + Cmaintenance;
    
    // VAT (23% in Poland)
    const vat = Cinternal * 0.23;
    
    // Final price (without delivery)
    const priceWithoutDelivery = Cinternal + vat;
    const totalPrice = Math.round(priceWithoutDelivery * quantity * 100) / 100;
    
    // Store detailed breakdown
    const breakdown: PriceBreakdown = {
      materialCost: Math.round(Cmaterial * 100) / 100,
      energyCost: Math.round(Cenergy * 100) / 100,
      serviceFee: Math.round(Clabor * 100) / 100,
      depreciation: Math.round(Cdepreciation * 100) / 100,
      maintenance: Math.round(Cmaintenance * 100) / 100,
      internalCost: Math.round(Cinternal * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      totalPrice: totalPrice,
    };
    
    setEstimatedPrice(totalPrice);
    setPriceBreakdown(breakdown);
    toast.success(`Price calculated! Weight: ${materialWeightGrams.toFixed(1)}g, Time: ${formatPrintTime(printTimeHours)}`);
  };

  const proceedToPayment = () => {
    // Validate file upload
    if (!file) {
      toast.error("Please upload a 3D model file");
      return;
    }

    // Validate material and quality
    if (!material || !quality) {
      toast.error("Please select material and quality");
      return;
    }

    // Validate price calculation
    if (!estimatedPrice || !priceBreakdown) {
      toast.error("Please calculate the price first");
      return;
    }

    // Validate delivery selection
    if (!selectedDeliveryOption) {
      toast.error("Please select a delivery method");
      return;
    }

    // Validate locker selection for InPost
    if (selectedDeliveryOption === "inpost" && !selectedLocker) {
      toast.error("Please select an InPost locker");
      return;
    }

    // Validate address for DPD
    if (selectedDeliveryOption === "dpd" && !isAddressValid(shippingAddress)) {
      toast.error("Please fill in all required address fields");
      return;
    }

    // Calculate delivery price
    const deliveryPrice = deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.price || 0;
    const totalAmount = estimatedPrice + deliveryPrice;

    // Navigate to payment page with order data
    navigate('/payment', {
      state: {
        orderData: {
          file,
          material,
          quality,
          quantity,
          deliveryOption: selectedDeliveryOption,
          locker: selectedLocker,
          shippingAddress,
          priceBreakdown,
          deliveryPrice,
          totalAmount,
        }
      }
    });
  };

  const submitOrder = async () => {
    // Validate file upload
    if (!file) {
      toast.error("Please upload a 3D model file");
      return;
    }

    // Validate material and quality
    if (!material || !quality) {
      toast.error("Please select material and quality");
      return;
    }

    // Validate price calculation
    if (!estimatedPrice) {
      toast.error("Please calculate the price first");
      return;
    }

    // Validate delivery selection
    if (!selectedDeliveryOption) {
      toast.error("Please select a delivery method");
      return;
    }

    // Validate locker selection for InPost
    if (selectedDeliveryOption === "inpost" && !selectedLocker) {
      toast.error("Please select an InPost locker");
      return;
    }

    // Validate address for DPD
    if (selectedDeliveryOption === "dpd" && !isAddressValid(shippingAddress)) {
      toast.error("Please fill in all required address fields");
      return;
    }

    try {
      // Create FormData to send file and order details
      const formData = new FormData();
      formData.append('file', file);
      formData.append('material', material.split('-')[0]); // e.g., 'pla-white' -> 'pla'
      formData.append('color', material.split('-')[1] || 'white'); // e.g., 'pla-white' -> 'white'
      formData.append('layerHeight', quality === 'draft' ? '0.3' : quality === 'standard' ? '0.2' : quality === 'high' ? '0.15' : '0.1');
      formData.append('infill', quality === 'draft' ? '10' : quality === 'standard' ? '20' : quality === 'high' ? '50' : '100');
      formData.append('quantity', quantity.toString());
      formData.append('shippingMethod', selectedDeliveryOption);
      
      // Add delivery-specific details
      if (selectedDeliveryOption === 'inpost' && selectedLocker) {
        formData.append('shippingAddress', JSON.stringify({
          lockerCode: selectedLocker.name,
          lockerAddress: selectedLocker.address
        }));
      } else if (selectedDeliveryOption === 'dpd') {
        formData.append('shippingAddress', JSON.stringify(shippingAddress));
      }

      const token = localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const order = await response.json();
      
      toast.success("Order submitted successfully! We'll contact you soon.");
      
      // Navigate to orders page after short delay
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
      
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit order. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background overflow-hidden">
      {isLoggedIn && <DashboardSidebar />}
      
      {!isLoggedIn && (
        <header className="fixed top-0 left-0 right-0 border-b border-border glass-effect z-50 animate-slide-up">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <button 
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-all group"
            >
              <Box className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
              <span className="gradient-text">ProtoLab</span>
            </button>
            <Button variant="outline" onClick={() => navigate("/login")} className="hover-lift">
              Login
            </Button>
          </div>
        </header>
      )}
      
      <main className={`flex-1 p-8 ${!isLoggedIn ? 'pt-24' : ''} overflow-y-auto max-h-screen`}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold mb-3 gradient-text">New Print Request</h1>
            <p className="text-muted-foreground text-lg">Upload your 3D model and configure print parameters</p>
          </div>

          {/* File Upload */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-white to-gray-50/30">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Upload className="w-6 h-6 text-primary" />
                Upload 3D Model
              </CardTitle>
              <CardDescription className="text-base">Supported formats: STL, OBJ, STEP (max 50MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-3 border-dashed border-primary/30 rounded-2xl p-12 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group hover-lift bg-gradient-to-br from-primary/5 to-purple-500/5">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".stl,.obj,.step"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  {file ? (
                    <div className="animate-scale-in">
                      <p className="font-bold text-xl text-primary mb-2">{file.name}</p>
                      <p className="text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">Click to upload or drag and drop</p>
                      <p className="text-muted-foreground">STL, OBJ, or STEP files</p>
                    </div>
                  )}
                </label>
              </div>
              
              {file && (
                <div className="mt-6 p-6 bg-gradient-to-br from-muted/50 to-background rounded-2xl border-2 border-primary/10 animate-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isModelLoading ? 'bg-yellow-500 animate-pulse' : modelAnalysis ? 'bg-green-500' : 'bg-primary animate-pulse'}`}></span>
                      3D Preview {isModelLoading && "(Loading...)"}
                    </p>
                    {modelAnalysis && (
                      <span className="text-xs text-green-600 font-semibold">✓ Analysis Complete</span>
                    )}
                  </div>
                  <ModelViewer file={file} onAnalysisComplete={handleAnalysisComplete} />
                  
                  {/* Dynamic Model Stats */}
                  {modelAnalysis && (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-white rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground">Volume</p>
                        <p className="text-lg font-bold text-primary">{modelAnalysis.volumeCm3.toFixed(2)} cm³</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground">Est. Weight</p>
                        <p className="text-lg font-bold text-primary">
                          {estimatedWeight ? `${estimatedWeight.toFixed(1)}g` : '--'}
                        </p>
                        {material && <p className="text-xs text-muted-foreground">{material.split('-')[0].toUpperCase()}</p>}
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground">Est. Print Time</p>
                        <p className="text-lg font-bold text-primary">
                          {formatPrintTime(estimatedPrintTime)}
                        </p>
                        {quality && <p className="text-xs text-muted-foreground">{quality} quality</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-white to-gray-50/30" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calculator className="w-6 h-6 text-primary" />
                Print Configuration
              </CardTitle>
              <CardDescription className="text-base">Select your preferred print settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="material" className="text-base font-semibold">Material & Color</Label>
                  <Select value={material} onValueChange={setMaterial}>
                    <SelectTrigger id="material" className="h-12">
                      <SelectValue placeholder="Select material and color" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">PLA</div>
                      <SelectItem value="pla-white">🤍 PLA - White</SelectItem>
                      <SelectItem value="pla-black">🖤 PLA - Black</SelectItem>
                      <SelectItem value="pla-red">❤️ PLA - Red</SelectItem>
                      <SelectItem value="pla-yellow">💛 PLA - Yellow</SelectItem>
                      <SelectItem value="pla-blue">💙 PLA - Blue</SelectItem>
                      
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">ABS</div>
                      <SelectItem value="abs-silver">⚪ ABS - Silver</SelectItem>
                      <SelectItem value="abs-transparent">💎 ABS - Transparent</SelectItem>
                      <SelectItem value="abs-black">🖤 ABS - Black</SelectItem>
                      <SelectItem value="abs-grey">🩶 ABS - Grey</SelectItem>
                      <SelectItem value="abs-red">❤️ ABS - Red</SelectItem>
                      <SelectItem value="abs-white">🤍 ABS - White</SelectItem>
                      <SelectItem value="abs-blue">💙 ABS - Blue</SelectItem>
                      <SelectItem value="abs-green">💚 ABS - Green</SelectItem>
                      
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">PETG</div>
                      <SelectItem value="petg-black">🖤 PETG - Black</SelectItem>
                      <SelectItem value="petg-white">🤍 PETG - White</SelectItem>
                      <SelectItem value="petg-red">❤️ PETG - Red</SelectItem>
                      <SelectItem value="petg-green">💚 PETG - Green</SelectItem>
                      <SelectItem value="petg-blue">💙 PETG - Blue</SelectItem>
                      <SelectItem value="petg-yellow">💛 PETG - Yellow</SelectItem>
                      <SelectItem value="petg-pink">💗 PETG - Pink</SelectItem>
                      <SelectItem value="petg-orange">🧡 PETG - Orange</SelectItem>
                      <SelectItem value="petg-silver">⚪ PETG - Silver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality" className="text-base font-semibold">Print Quality</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger id="quality" className="h-12">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">⚡ Draft - Fast</SelectItem>
                      <SelectItem value="standard">✨ Standard</SelectItem>
                      <SelectItem value="high">💎 High Quality</SelectItem>
                      <SelectItem value="ultra">🏆 Ultra - Finest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-base font-semibold">Quantity</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min="1"
                    className="h-12 text-lg"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of the Part</Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe what this part will be used for..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="advanced"
                  checked={showAdvanced}
                  onCheckedChange={(checked) => setShowAdvanced(checked as boolean)}
                />
                <Label htmlFor="advanced" className="cursor-pointer">
                  Show advanced settings
                </Label>
              </div>

              {showAdvanced && (
                <div className="grid md:grid-cols-2 gap-6 p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="layer-height">Layer Height (mm)</Label>
                    <Select>
                      <SelectTrigger id="layer-height">
                        <SelectValue placeholder="Select layer height" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.1">0.1mm - Ultra Fine</SelectItem>
                        <SelectItem value="0.2">0.2mm - Standard</SelectItem>
                        <SelectItem value="0.3">0.3mm - Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="infill">Infill %</Label>
                    <Select>
                      <SelectTrigger id="infill">
                        <SelectValue placeholder="Select infill" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10% - Light</SelectItem>
                        <SelectItem value="20">20% - Standard</SelectItem>
                        <SelectItem value="50">50% - Strong</SelectItem>
                        <SelectItem value="100">100% - Solid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pattern">Infill Pattern</Label>
                    <Select>
                      <SelectTrigger id="pattern">
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="honeycomb">Honeycomb</SelectItem>
                        <SelectItem value="triangles">Triangles</SelectItem>
                        <SelectItem value="gyroid">Gyroid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supports">Support Structures</Label>
                    <Select>
                      <SelectTrigger id="supports">
                        <SelectValue placeholder="Select supports" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="tree">Tree Supports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Estimate */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-white to-gray-50/30" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calculator className="w-6 h-6 text-primary" />
                Price Estimate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isLoggedIn ? (
                <Button
                  onClick={() => {
                    toast.info("Please login to calculate price");
                    window.location.href = '/login';
                  }}
                  className="w-full h-12 hover-lift shadow-lg border-2 border-primary/50"
                  variant="outline"
                >
                  <span className="flex items-center">
                    🔒 Login Required to Calculate Price
                  </span>
                </Button>
              ) : (
                <Button onClick={calculatePrice} className="w-full h-12 hover-lift shadow-lg group relative overflow-hidden" variant="default">
                  <span className="relative z-10 flex items-center">
                    <Calculator className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Calculate Price
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
              )}

              {estimatedPrice !== null && priceBreakdown && (
                <div className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl border-2 border-primary/30 shadow-lg animate-scale-in">
                  <div className="space-y-4">
                    {/* Price Breakdown Header */}
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold">Price Breakdown</p>
                      {modelAnalysis ? (
                        <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded">✓ Actual weight</span>
                      ) : (
                        <span className="text-xs text-yellow-600 font-semibold bg-yellow-100 px-2 py-1 rounded">⚠ Estimated</span>
                      )}
                    </div>

                    {/* Internal Costs */}
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-muted-foreground">Internal Costs</span>
                      <span className="font-semibold">{priceBreakdown.internalCost.toFixed(2)} PLN</span>
                    </div>

                    {/* Service Fee */}
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-muted-foreground">Service Fee</span>
                      <span className="font-semibold">{priceBreakdown.serviceFee.toFixed(2)} PLN</span>
                    </div>

                    {/* VAT */}
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-muted-foreground">VAT (23%)</span>
                      <span className="font-semibold">{priceBreakdown.vat.toFixed(2)} PLN</span>
                    </div>

                    {/* Print Cost Total */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Print Cost {quantity > 1 ? `(×${quantity})` : ''}</span>
                        <span className="text-2xl font-bold text-primary">{estimatedPrice.toFixed(2)} PLN</span>
                      </div>
                      {modelAnalysis && estimatedWeight && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {estimatedWeight.toFixed(1)}g • {modelAnalysis.volumeCm3.toFixed(2)} cm³ • {formatPrintTime(estimatedPrintTime)}
                        </p>
                      )}
                    </div>
                    
                    {selectedDeliveryOption && (
                      <>
                        <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                          <span className="text-muted-foreground">Delivery</span>
                          <span className="font-semibold text-primary">
                            {(deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.price || 0).toFixed(2)} PLN
                          </span>
                        </div>
                        
                        <div className="border-t-2 border-primary/30 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Total Price</span>
                            <span className="text-4xl font-bold gradient-text">
                              {(estimatedPrice + (deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.price || 0)).toFixed(2)} PLN
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-white to-gray-50/30" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Send className="w-6 h-6 text-primary" />
                Delivery Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryOptions
                selectedOption={selectedDeliveryOption}
                onSelectOption={(optionId) => {
                  setSelectedDeliveryOption(optionId);
                  if (optionId !== "inpost") {
                    setSelectedLocker(null);
                  }
                  if (optionId !== "dpd") {
                    setShippingAddress({
                      fullName: "",
                      phone: "",
                      street: "",
                      city: "",
                      postalCode: "",
                    });
                  }
                }}
                onSelectLocker={() => setShowLockerModal(true)}
                selectedLockerName={selectedLocker?.name}
              />

              {/* DPD Address Form */}
              {selectedDeliveryOption === "dpd" && (
                <div className="mt-4 animate-scale-in">
                  <DPDAddressForm
                    address={shippingAddress}
                    onChange={setShippingAddress}
                  />
                </div>
              )}

              {/* Selected Locker Confirmation */}
              {selectedLocker && selectedDeliveryOption === "inpost" && (
                <div className="mt-4 p-4 bg-primary/5 border-2 border-primary/20 rounded-lg animate-scale-in">
                  <p className="font-bold text-sm mb-1">Selected Locker:</p>
                  <p className="text-sm">{selectedLocker.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedLocker.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Locker Picker Modal */}
          <LockerPickerModal
            open={showLockerModal}
            onClose={() => setShowLockerModal(false)}
            onSelectLocker={(locker) => {
              setSelectedLocker(locker);
              toast.success(`Locker ${locker.name} selected`);
            }}
          />

          {/* Submit */}
          <Button onClick={proceedToPayment} size="lg" className="w-full h-14 text-lg hover-lift shadow-xl group relative overflow-hidden animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <span className="relative z-10 flex items-center">
              <CreditCard className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
              Proceed to Payment
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NewPrint;
