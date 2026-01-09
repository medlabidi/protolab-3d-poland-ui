import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Calculator, Send, CreditCard, FileText, FolderOpen, X, Plus, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DeliveryOptions, deliveryOptions } from "@/components/DeliveryOptions";
import { LockerPickerModal } from "@/components/LockerPickerModal";
import { DPDAddressForm, isAddressValid, ShippingAddress } from "@/components/DPDAddressForm";
import { ModelViewer } from "@/components/ModelViewer/ModelViewer";
import type { ModelAnalysis } from "@/components/ModelViewer/useModelAnalysis";
import { apiFormData } from "@/lib/api";
import { API_URL } from "@/config/api";
import { Logo } from "@/components/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";

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

interface ProjectFile {
  id: string;
  file: File;
  material: string;
  quality: string;
  quantity: number;
  modelAnalysis: ModelAnalysis | null;
  isLoading: boolean;
  error: string | null;
  isExpanded: boolean;
  estimatedPrice: number | null;
  priceBreakdown: PriceBreakdown | null;
}

// Memoized ModelViewer wrapper to prevent re-renders when other project file properties change
const MemoizedModelViewer = memo(({ 
  file, 
  fileId,
  onAnalysisComplete, 
  onError 
}: { 
  file: File; 
  fileId: string;
  onAnalysisComplete: (id: string, analysis: ModelAnalysis) => void; 
  onError: (id: string, error: string | null) => void;
}) => {
  return (
    <ModelViewer 
      file={file} 
      onAnalysisComplete={(analysis) => onAnalysisComplete(fileId, analysis)}
      onError={(error) => onError(fileId, error)}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if the file itself changes
  return prevProps.file === nextProps.file && prevProps.fileId === nextProps.fileId;
});

interface MaterialData {
  id: string;
  material_type: string;
  color: string;
  price_per_kg: number;
  stock_status: 'available' | 'low_stock' | 'out_of_stock';
  lead_time_days: number;
  hex_color?: string;
  is_active: boolean;
}

const NewPrint = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Upload mode: 'single' or 'project'
  const [uploadMode, setUploadMode] = useState<'single' | 'project'>('single');
  
  // Single file state
  const [file, setFile] = useState<File | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false); // Toggle between normal and advanced mode
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [material, setMaterial] = useState("");
  const [quality, setQuality] = useState("");
  const [quantity, setQuantity] = useState(1);
  
  // Advanced settings state (override quality-based defaults when advanced is enabled)
  const [customLayerHeight, setCustomLayerHeight] = useState<string | undefined>(undefined);
  const [customInfill, setCustomInfill] = useState<string | undefined>(undefined);
  const [supportType, setSupportType] = useState("none");
  const [infillPattern, setInfillPattern] = useState("grid");
  
  // Quality presets with characteristics
  const qualityPresets = {
    draft: { layerHeight: '0.28mm', infill: '10%', speed: 'Very Fast', detail: 'Low', icon: '⚡' },
    standard: { layerHeight: '0.20mm', infill: '20%', speed: 'Fast', detail: 'Medium', icon: '✨' },
    high: { layerHeight: '0.12mm', infill: '30%', speed: 'Medium', detail: 'High', icon: '💎' },
    ultra: { layerHeight: '0.08mm', infill: '40%', speed: 'Slow', detail: 'Very High', icon: '🏆' }
  };
  
  // Materials from database
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  // Printer specifications from database
  interface PrinterSpecs {
    power_watts: number;
    cost_pln: number;
    lifespan_hours: number;
    maintenance_rate: number;
  }
  const [printerSpecs, setPrinterSpecs] = useState<PrinterSpecs>({
    power_watts: 270,
    cost_pln: 3483.39,
    lifespan_hours: 5000,
    maintenance_rate: 0.03,
  });

  const getMaterialKey = (materialType: string, color: string) => {
    return `${materialType.toLowerCase()}-${color.toLowerCase()}`;
  };

  const isOutOfStock = (materialValue: string) => {
    const material = materials.find(m => getMaterialKey(m.material_type, m.color) === materialValue);
    return material?.stock_status === 'out_of_stock';
  };

  const getOutOfStockWarning = (materialValue: string) => {
    const material = materials.find(m => getMaterialKey(m.material_type, m.color) === materialValue);
    if (!material || material.stock_status !== 'out_of_stock') return null;
    const days = material.lead_time_days || 2;
    return `⚠️ Material color is out of stock. Print process will take approximately +${days} days longer.`;
  };
  
  // Project (multi-file) state
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [projectName, setProjectName] = useState("");
  
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
  const [modelError, setModelError] = useState<string | null>(null);
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

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
  
  // Infill by layer height mapping
  const INFILL_BY_LAYER_HEIGHT: Record<string, number> = {
    '0.3': 10,   // Draft
    '0.2': 20,   // Standard
    '0.15': 30,  // High
    '0.1': 40,   // Ultra
  };

  // Print speed multipliers by quality (base speed in cm³/hour)
  const PRINT_SPEED_CM3_PER_HOUR: Record<string, number> = {
    draft: 15,      // Fastest - larger layers
    standard: 10,   // Normal speed
    high: 6,        // Slower for quality
    ultra: 3,       // Slowest for finest detail
  };
  
  // Print speed by layer height mapping
  const SPEED_BY_LAYER_HEIGHT: Record<string, number> = {
    '0.3': 15,   // Draft
    '0.2': 10,   // Standard
    '0.15': 6,   // High
    '0.1': 3,    // Ultra
  };

  // Computed weight based on material, quality, and model volume
  const estimatedWeight = useMemo(() => {
    if (!modelAnalysis || !material || !quality) return null;
    
    const materialType = material.split('-')[0];
    const density = MATERIAL_DENSITIES[materialType] || 1.24;
    
    // Use custom infill if advanced settings are enabled, otherwise use quality-based default
    const infillPercent = advancedMode && customInfill ? parseInt(customInfill) : 
                         (INFILL_BY_QUALITY[quality] || 20);
    
    // Weight = volume × density × (1 + infill%)
    const effectiveVolume = modelAnalysis.volumeCm3 * (1 + infillPercent / 100);
    let weight = effectiveVolume * density;
    
    // Support structures add extra material
    if (supportType === 'normal') {
      weight *= 1.15; // +15% for normal supports
    } else if (supportType === 'tree') {
      weight *= 1.10; // +10% for tree supports
    }
    
    return weight;
  }, [modelAnalysis, material, quality, advancedMode, customInfill, supportType]);

  // Computed print time based on model volume and quality
  const estimatedPrintTime = useMemo(() => {
    if (!modelAnalysis || !quality) return null;
    
    // Use custom values if advanced settings are enabled, otherwise use quality-based defaults
    const layerHeight = advancedMode && customLayerHeight ? customLayerHeight : 
                       (quality === 'draft' ? '0.3' : quality === 'standard' ? '0.2' : quality === 'high' ? '0.15' : '0.1');
    
    const infillPercent = advancedMode && customInfill ? parseInt(customInfill) : 
                         (INFILL_BY_LAYER_HEIGHT[layerHeight] || 20);
    
    const speedCm3PerHour = SPEED_BY_LAYER_HEIGHT[layerHeight] || 10;
    
    // Effective volume with infill
    const effectiveVolume = modelAnalysis.volumeCm3 * (1 + infillPercent / 100);
    
    // Time = volume / speed (in hours)
    let printTimeHours = effectiveVolume / speedCm3PerHour;
    
    // Support structures add extra time
    if (supportType === 'normal') {
      printTimeHours *= 1.10; // +10% for normal supports
    } else if (supportType === 'tree') {
      printTimeHours *= 1.05; // +5% for tree supports (faster)
    }
    
    // Infill pattern affects print time
    if (infillPattern === 'honeycomb' || infillPattern === 'gyroid') {
      printTimeHours *= 1.05; // +5% for complex patterns
    }
    
    // Add setup time (15 minutes minimum)
    return Math.max(0.25, printTimeHours);
  }, [modelAnalysis, quality, advancedMode, customLayerHeight, customInfill, supportType, infillPattern]);

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

  // Fetch materials from database
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch('/api/materials/by-type');
        if (response.ok) {
          const data = await response.json();
          // Flatten the grouped materials with safe check
          const allMaterials: MaterialData[] = [];
          if (data.materials && typeof data.materials === 'object') {
            Object.values(data.materials).forEach((typeMaterials: any) => {
              if (Array.isArray(typeMaterials)) {
                allMaterials.push(...typeMaterials);
              }
            });
          }
          setMaterials(allMaterials);
        }
      } catch (error) {
        console.error('Failed to fetch materials:', error);
        toast.error('Failed to load materials');
      } finally {
        setMaterialsLoading(false);
      }
    };
    
    const fetchPrinterSpecs = async () => {
      try {
        const response = await fetch('/api/printers/default');
        if (response.ok) {
          const data = await response.json();
          setPrinterSpecs(data.printer);
        }
      } catch (error) {
        console.error('Failed to fetch printer specs:', error);
        // Continue with default fallback values
      }
    };
    
    fetchMaterials();
    fetchPrinterSpecs();
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);

    // Restore form state if coming back from checkout
    const savedState = sessionStorage.getItem('newPrintFormState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        let restored = false;
        
        if (state.material) { setMaterial(state.material); restored = true; }
        if (state.quality) { setQuality(state.quality); restored = true; }
        if (state.quantity) { setQuantity(state.quantity); restored = true; }
        if (state.advancedMode !== undefined) { setAdvancedMode(state.advancedMode); restored = true; }
        if (state.customLayerHeight) { setCustomLayerHeight(state.customLayerHeight); restored = true; }
        if (state.customInfill) { setCustomInfill(state.customInfill); restored = true; }
        if (state.supportType) { setSupportType(state.supportType); restored = true; }
        if (state.infillPattern) { setInfillPattern(state.infillPattern); restored = true; }
        if (state.selectedDeliveryOption) { setSelectedDeliveryOption(state.selectedDeliveryOption); restored = true; }
        if (state.shippingAddress) { setShippingAddress(state.shippingAddress); restored = true; }
        if (state.selectedLocker) { setSelectedLocker(state.selectedLocker); restored = true; }
        
        if (restored) {
          toast.info('Your previous settings have been restored. Please re-upload your file if needed.');
        }
        
        // Clear saved state after restoration
        sessionStorage.removeItem('newPrintFormState');
      } catch (error) {
        console.error('Failed to restore form state:', error);
      }
    }
  }, []);

  // Function to redirect directly to PayU payment
  const redirectToPayUPayment = async (orderId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please log in to continue');
        navigate('/login');
        return;
      }

      // Get order details first
      const orderResponse = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to fetch order details');
      }

      const orderData = await orderResponse.json();
      const order = orderData.order;

      // Create PayU payment request
      const payuResponse = await fetch(`${API_URL}/payments/payu/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.price,
          description: `Order #${order.id.slice(0, 8)} - ${order.file_name}`,
          userId: order.user_id,
          payMethods: undefined, // Let PayU show all available methods
        }),
      });

      if (!payuResponse.ok) {
        const errorData = await payuResponse.json();
        throw new Error(errorData.error || 'Payment creation failed');
      }

      const payuData = await payuResponse.json();
      console.log('PayU response data:', payuData);

      // Redirect to PayU payment page (standard flow)
      if (payuData.redirectUri) {
        console.log('Redirecting to PayU payment page:', payuData.redirectUri);
        window.location.href = payuData.redirectUri;
      } else {
        throw new Error('No payment redirect URL received from PayU');
      }

    } catch (error) {
      console.error('PayU redirect error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment redirect failed');
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsModelLoading(true);
      setModelAnalysis(null);
      setModelError(null);
      toast.success(t('newPrint.toasts.fileUploaded'));
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      const fileName = droppedFile.name.toLowerCase();
      
      // Check file extension
      if (fileName.endsWith('.stl') || fileName.endsWith('.obj') || fileName.endsWith('.step')) {
        setFile(droppedFile);
        setIsModelLoading(true);
        setModelAnalysis(null);
        setModelError(null);
        toast.success("File uploaded successfully! Analyzing model...");
      } else {
        toast.error("Invalid file type. Please upload STL, OBJ, or STEP files.");
      }
    }
  }, []);

  const handleAnalysisComplete = (analysis: ModelAnalysis) => {
    setModelAnalysis(analysis);
    setIsModelLoading(false);
    setModelError(null);
    
    console.log('📦 Model Analysis Complete:');
    console.log('  - Volume:', analysis.volumeCm3.toFixed(2), 'cm³');
    console.log('  - Bounding Box:', 
      `${analysis.boundingBox.x.toFixed(1)} × ${analysis.boundingBox.y.toFixed(1)} × ${analysis.boundingBox.z.toFixed(1)} cm`);
    console.log('  - Surface Area:', analysis.surfaceArea.toFixed(2), 'cm²');
    
    toast.success(`Model analyzed! Volume: ${analysis.volumeCm3.toFixed(2)} cm³`);
  };

  const handleModelError = (error: string | null) => {
    // Special handling for 3MF files - this is informational, not a blocking error
    if (error && error.includes('3MF_NO_PREVIEW')) {
      setModelError(null); // Don't block price calculation for 3MF
      setIsModelLoading(false);
      toast.info("3MF file uploaded. Preview unavailable, but you can proceed with pricing.");
      return;
    }
    
    setModelError(error);
    setIsModelLoading(false);
    if (error) {
      // Show a more user-friendly toast based on error type
      if (error.toLowerCase().includes('empty') || error.toLowerCase().includes('no valid')) {
        toast.error("The uploaded file appears to be empty or contains no valid 3D geometry.");
      } else if (error.toLowerCase().includes('volume') || error.toLowerCase().includes('too small')) {
        toast.error("The model is too small to print. Please check the dimensions.");
      } else if (error.toLowerCase().includes('corrupted')) {
        toast.error("The file appears to be corrupted. Please try a different file.");
      } else if (error.toLowerCase().includes('size') && error.toLowerCase().includes('large')) {
        toast.error("The file is too large. Maximum size is 50MB.");
      } else {
        toast.error(error);
      }
    }
  };

  // Project file handling functions
  const addProjectFiles = (files: FileList) => {
    const newFiles: ProjectFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const fileName = f.name.toLowerCase();
      if (fileName.endsWith('.stl') || fileName.endsWith('.obj') || fileName.endsWith('.step')) {
        newFiles.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          file: f,
          material: "",
          quality: "",
          quantity: 1,
          modelAnalysis: null,
          isLoading: false,
          error: null,
          isExpanded: false,
          estimatedPrice: null,
          priceBreakdown: null,
        });
      }
    }
    if (newFiles.length > 0) {
      setProjectFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) added to project`);
    } else {
      toast.error("No valid 3D files found. Please upload STL, OBJ, or STEP files.");
    }
  };

  const removeProjectFile = (id: string) => {
    setProjectFiles(prev => prev.filter(f => f.id !== id));
    toast.success("File removed from project");
  };

  const updateProjectFile = useCallback((id: string, updates: Partial<ProjectFile>) => {
    setProjectFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const handleProjectFileAnalysis = useCallback((id: string, analysis: ModelAnalysis) => {
    setProjectFiles(prev => prev.map(f => f.id === id ? { ...f, modelAnalysis: analysis, isLoading: false, error: null } : f));
  }, []);

  const handleProjectFileError = useCallback((id: string, error: string | null) => {
    setProjectFiles(prev => prev.map(f => f.id === id ? { ...f, error, isLoading: false } : f));
  }, []);

  const toggleFileExpanded = useCallback((id: string) => {
    setProjectFiles(prev => prev.map(f => {
      if (f.id === id) {
        const newExpanded = !f.isExpanded;
        return { 
          ...f, 
          isExpanded: newExpanded,
          isLoading: newExpanded && !f.modelAnalysis && !f.error
        };
      }
      return f;
    }));
  }, []);

  const handleProjectDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      addProjectFiles(droppedFiles);
    }
  }, []);

  const handleProjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addProjectFiles(e.target.files);
    }
  };

  // Calculate price for a single project file
  const calculateProjectFilePrice = (projectFile: ProjectFile): PriceBreakdown | null => {
    if (!projectFile.material || !projectFile.quality || !projectFile.modelAnalysis) {
      return null;
    }

    const materialType = projectFile.material.split('-')[0];
    const density = MATERIAL_DENSITIES[materialType] || 1.24;
    const infillPercent = INFILL_BY_QUALITY[projectFile.quality] || 20;
    
    const volumeCm3 = projectFile.modelAnalysis.volumeCm3;
    const effectiveVolume = volumeCm3 * (1 + (infillPercent / 100));
    const materialWeightGrams = effectiveVolume * density;
    
    const speedCm3PerHour = PRINT_SPEED_CM3_PER_HOUR[projectFile.quality] || 10;
    const printTimeHours = Math.max(0.25, effectiveVolume / speedCm3PerHour);
    
    // Get price from database materials
    const materialData = materials.find(m => 
      getMaterialKey(m.material_type, m.color) === projectFile.material
    );
    const materialPricePerKg = materialData?.price_per_kg || 39;
    const Cmaterial = materialPricePerKg * (materialWeightGrams / 1000);
    
    // Use printer specs from database
    const powerKW = printerSpecs.power_watts / 1000;
    const Cenergy = printTimeHours * powerKW * 0.914;
    const Clabor = 31.40 * (10 / 60);
    const Cdepreciation = (printerSpecs.cost_pln / printerSpecs.lifespan_hours) * printTimeHours;
    const Cmaintenance = Cdepreciation * printerSpecs.maintenance_rate;
    const Cinternal = Cmaterial + Cenergy + Clabor + Cdepreciation + Cmaintenance;
    const vat = Cinternal * 0.23;
    const totalPrice = Math.round((Cinternal + vat) * projectFile.quantity * 100) / 100;

    return {
      materialCost: Math.round(Cmaterial * 100) / 100,
      energyCost: Math.round(Cenergy * 100) / 100,
      serviceFee: Math.round(Clabor * 100) / 100,
      depreciation: Math.round(Cdepreciation * 100) / 100,
      maintenance: Math.round(Cmaintenance * 100) / 100,
      internalCost: Math.round(Cinternal * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      totalPrice,
    };
  };

  const calculateAllProjectPrices = () => {
    let hasErrors = false;
    const updatedFiles = projectFiles.map(pf => {
      if (!pf.material || !pf.quality) {
        hasErrors = true;
        return pf;
      }
      if (pf.error) {
        hasErrors = true;
        return pf;
      }
      if (!pf.modelAnalysis) {
        hasErrors = true;
        return pf;
      }
      const breakdown = calculateProjectFilePrice(pf);
      return { ...pf, priceBreakdown: breakdown, estimatedPrice: breakdown?.totalPrice || null };
    });

    if (hasErrors) {
      toast.error("Please ensure all files have material and quality selected, and no errors");
      return;
    }

    setProjectFiles(updatedFiles);
    toast.success("All prices calculated!");
  };

  // Total project price
  const totalProjectPrice = useMemo(() => {
    return projectFiles.reduce((sum, pf) => sum + (pf.estimatedPrice || 0), 0);
  }, [projectFiles]);

  const calculatePrice = () => {
    // Validate inputs
    if (!file) {
      toast.error("Please upload a 3D model file first");
      return;
    }
    
    if (modelError) {
      toast.error("Please fix the model issues before calculating price");
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
    
    // Get material price from database
    const materialData = materials.find(m => 
      getMaterialKey(m.material_type, m.color) === material
    );
    const materialPricePerKg = materialData?.price_per_kg || 39;

    // Get material type from selection (e.g., "pla-white" -> "pla")
    const materialType = material.split('-')[0];
    const density = MATERIAL_DENSITIES[materialType] || 1.24;
    
    // Use custom infill if advanced settings are enabled
    const infillPercent = advancedMode && customInfill ? parseInt(customInfill) : 
                         (INFILL_BY_QUALITY[quality] || 20);
    
    // Calculate weight using volume, density, and infill factor (matches backend)
    let materialWeightGrams: number;
    if (modelAnalysis) {
      const volumeCm3 = modelAnalysis.volumeCm3;
      const effectiveVolume = volumeCm3 * (1 + (infillPercent / 100));
      materialWeightGrams = effectiveVolume * density;
      
      // Support structures add extra material
      if (supportType === 'normal') {
        materialWeightGrams *= 1.15; // +15% for normal supports
      } else if (supportType === 'tree') {
        materialWeightGrams *= 1.10; // +10% for tree supports (less material)
      }
    } else {
      // Fallback: 1MB ≈ 10g
      materialWeightGrams = (file.size / 1024 / 1024) * 10;
      toast.warning("Using estimated weight. Model is still loading...");
    }
    
    // Calculate print time based on volume and quality
    const printTimeHours = estimatedPrintTime || 4;
    
    // Material cost: Cmaterial = materialPricePerKg * (materialWeightGrams / 1000)
    const Cmaterial = materialPricePerKg * (materialWeightGrams / 1000);
    
    // Energy cost: Cenergy = T * W * Pe (using printer specs from database)
    const W = printerSpecs.power_watts / 1000; // Convert watts to kW
    const Pe = 0.914; // PLN per kWh in Krakow
    const Cenergy = printTimeHours * W * Pe;
    
    // Labor cost: Clabor = R * L (10 minutes default - matches backend)
    const R = 31.40; // PLN per hour
    const laborTimeMinutes = 10;
    const Clabor = R * (laborTimeMinutes / 60);
    
    // Machine depreciation: Cdepreciation = (machineCost / lifespanHours) * printTimeHours (using printer specs from database)
    const Cdepreciation = (printerSpecs.cost_pln / printerSpecs.lifespan_hours) * printTimeHours;
    
    // Maintenance cost: Cmaintenance = Cdepreciation * maintenanceRate (using printer specs from database)
    const Cmaintenance = Cdepreciation * printerSpecs.maintenance_rate;
    
    // Total internal cost
    const Cinternal = Cmaterial + Cenergy + Clabor + Cdepreciation + Cmaintenance;
    
    // VAT (23% in Poland)
    const vat = Cinternal * 0.23;
    
    // Final price (without delivery)
    const priceWithoutDelivery = Cinternal + vat;
    const totalPrice = Math.round(priceWithoutDelivery * quantity * 100) / 100;
    
    console.log('=== NEW PRINT: Price Calculation ===' , {
      material: materialType,
      volume: modelAnalysis?.volumeCm3,
      density,
      infillPercent,
      materialWeightGrams: materialWeightGrams.toFixed(2),
      massKg: (materialWeightGrams / 1000).toFixed(3),
      printTimeHours: printTimeHours.toFixed(2),
      materialCost: Cmaterial.toFixed(2),
      energyCost: Cenergy.toFixed(2),
      laborCost: Clabor.toFixed(2),
      depreciationCost: Cdepreciation.toFixed(2),
      maintenanceCost: Cmaintenance.toFixed(2),
      internalCost: Cinternal.toFixed(2),
      vat: vat.toFixed(2),
      priceWithoutDelivery: priceWithoutDelivery.toFixed(2),
      quantity,
      totalPrice: totalPrice.toFixed(2),
      supportType,
      infillPattern,
      customInfill
    });
    
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

  // Auto-calculate price when required fields change
  useEffect(() => {
    if (file && !modelError && material && quality && modelAnalysis) {
      calculatePrice();
    }
  }, [file, modelError, material, quality, quantity, advancedMode, customLayerHeight, customInfill, supportType, infillPattern, modelAnalysis]);

  const proceedToPayment = async () => {
    // Check which mode we're in
    if (uploadMode === 'project') {
      // Project mode validation
      if (projectFiles.length === 0) {
        toast.error("Please upload at least one 3D model file");
        return;
      }

      // Check if all files have been analyzed successfully
      const filesWithErrors = projectFiles.filter(pf => pf.error);
      if (filesWithErrors.length > 0) {
        toast.error(`${filesWithErrors.length} file(s) have errors. Please remove them before proceeding.`);
        return;
      }

      // Check if all files are still loading
      const filesStillLoading = projectFiles.filter(pf => pf.isLoading && !pf.modelAnalysis);
      if (filesStillLoading.length > 0) {
        toast.error("Please wait for all files to finish loading");
        return;
      }

      // Check if all files have material and quality set
      const filesWithoutConfig = projectFiles.filter(pf => !pf.material || !pf.quality);
      if (filesWithoutConfig.length > 0) {
        toast.error(`${filesWithoutConfig.length} file(s) need material and quality selected`);
        return;
      }

      // Check if all files have model analysis
      const filesWithoutAnalysis = projectFiles.filter(pf => !pf.modelAnalysis);
      if (filesWithoutAnalysis.length > 0) {
        toast.error("Please expand each file to load its 3D preview before proceeding");
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

      // Calculate total price for project
      const projectTotal = projectFiles.reduce((sum, pf) => {
        const breakdown = calculateProjectFilePrice(pf);
        return sum + (breakdown?.totalPrice || 0);
      }, 0);

      if (projectTotal <= 0) {
        toast.error("Please ensure all files have valid prices calculated");
        return;
      }

      // Calculate delivery price
      const deliveryPrice = deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.price || 0;
      const totalAmount = projectTotal + deliveryPrice;

      try {
        setIsProcessing(true);
        const orderIds: string[] = [];

        // Create orders for each file
        for (const pf of projectFiles) {
          const formData = new FormData();
          formData.append('file', pf.file);
          formData.append('material', pf.material.split('-')[0]);
          formData.append('color', pf.material.split('-')[1] || 'white');
          formData.append('layerHeight', pf.quality === 'draft' ? '0.3' : pf.quality === 'standard' ? '0.2' : pf.quality === 'high' ? '0.15' : '0.1');
          formData.append('infill', pf.quality === 'draft' ? '10' : pf.quality === 'standard' ? '20' : pf.quality === 'high' ? '50' : '100');
          formData.append('quantity', pf.quantity.toString());
          formData.append('shippingMethod', selectedDeliveryOption);
          formData.append('paymentMethod', 'pending');
          formData.append('price', (calculateProjectFilePrice(pf)?.totalPrice || 0).toString());
          formData.append('projectName', projectName || 'Untitled Project');

          // Add delivery details
          if (selectedDeliveryOption === 'inpost' && selectedLocker) {
            formData.append('shippingAddress', JSON.stringify({
              lockerCode: selectedLocker.name,
              lockerAddress: selectedLocker.address
            }));
          } else if (selectedDeliveryOption === 'dpd' && shippingAddress) {
            formData.append('shippingAddress', JSON.stringify(shippingAddress));
          } else if (selectedDeliveryOption === 'pickup') {
            formData.append('shippingAddress', JSON.stringify({
              type: 'pickup',
              address: 'Zielonogórska 13, 30-406 Kraków'
            }));
          }

          const response = await apiFormData('/orders', formData);

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create order');
          }

          const result = await response.json();
          orderIds.push(result.id);
        }

        // Create PayU payment for first order and redirect directly
        if (orderIds.length > 0) {
          toast.success('Orders created. Redirecting to PayU payment...');
          await redirectToPayUPayment(orderIds[0]);
        }
      } catch (error) {
        console.error('Order creation error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create orders');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Single file mode validation
    if (!file) {
      toast.error("Please upload a 3D model file");
      return;
    }

    // Validate model is valid (no errors)
    if (modelError) {
      toast.error("Please fix the model issues before proceeding");
      return;
    }

    // Validate material and quality
    if (!material || !quality) {
      toast.error("Please select material and quality");
      return;
    }

    // Price should be calculated automatically, but double-check
    if (!estimatedPrice || !priceBreakdown) {
      toast.error("Price calculation in progress, please wait");
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

    try {
      setIsProcessing(true);
      
      // Check if there's a previous pending order from going back
      const savedState = sessionStorage.getItem('newPrintFormState');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.orderId) {
            // Cancel the previous pending order
            const token = localStorage.getItem('accessToken');
            await fetch(`${API_URL}/orders/${state.orderId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                status: 'cancelled',
                payment_status: 'cancelled'
              }),
            });
            console.log('Cancelled previous pending order:', state.orderId);
          }
        } catch (error) {
          console.error('Failed to cancel previous order:', error);
          // Continue anyway
        }
      }
      
      // Create order first
      const formData = new FormData();
      formData.append('file', file);
      formData.append('material', material.split('-')[0]);
      formData.append('color', material.split('-')[1] || 'white');
      
      // Use custom layer height if advanced settings enabled, otherwise quality preset
      const layerHeight = advancedMode && customLayerHeight ? customLayerHeight : 
                         (quality === 'draft' ? '0.3' : quality === 'standard' ? '0.2' : quality === 'high' ? '0.15' : '0.1');
      formData.append('layerHeight', layerHeight);
      
      // Use custom infill if advanced settings enabled, otherwise quality preset
      const infill = advancedMode && customInfill ? customInfill :
                    (quality === 'draft' ? '10' : quality === 'standard' ? '20' : quality === 'high' ? '30' : '40');
      formData.append('infill', infill);
      
      formData.append('quantity', quantity.toString());
      formData.append('shippingMethod', selectedDeliveryOption);
      formData.append('paymentMethod', 'pending');
      formData.append('price', totalAmount.toString());
      
      // Add advanced mode flag
      formData.append('advancedMode', advancedMode.toString());
      
      // Add advanced settings
      formData.append('supportType', supportType);
      formData.append('infillPattern', infillPattern);
      
      // Add custom values if advanced mode was used
      if (advancedMode) {
        if (customLayerHeight) {
          formData.append('customLayerHeight', customLayerHeight);
        }
        if (customInfill) {
          formData.append('customInfill', customInfill);
        }
      }
      
      // Add material weight and print time for accurate price recalculation later
      if (estimatedWeight && estimatedPrintTime) {
        formData.append('materialWeight', Math.round(estimatedWeight).toString()); // in grams
        formData.append('printTime', Math.round(estimatedPrintTime * 60).toString()); // convert hours to minutes
      }
      
      // CRITICAL: Store the base model volume for accurate recalculation in EditOrder
      if (modelAnalysis) {
        formData.append('modelVolume', modelAnalysis.volumeCm3.toString()); // in cm³
      }

      // Add delivery details
      if (selectedDeliveryOption === 'inpost' && selectedLocker) {
        formData.append('shippingAddress', JSON.stringify({
          lockerCode: selectedLocker.name,
          lockerAddress: selectedLocker.address
        }));
      } else if (selectedDeliveryOption === 'dpd' && shippingAddress) {
        formData.append('shippingAddress', JSON.stringify(shippingAddress));
      } else if (selectedDeliveryOption === 'pickup') {
        formData.append('shippingAddress', JSON.stringify({
          type: 'pickup',
          address: 'Zielonogórska 13, 30-406 Kraków'
        }));
      }

      const response = await apiFormData('/orders', formData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const result = await response.json();
      
      // Save form state and orderId before navigating to checkout
      const formState = {
        orderId: result.id,
        material,
        quality,
        quantity,
        advancedMode,
        customLayerHeight,
        customInfill,
        supportType,
        infillPattern,
        selectedDeliveryOption,
        shippingAddress,
        selectedLocker,
      };
      sessionStorage.setItem('newPrintFormState', JSON.stringify(formState));
      
      // Navigate to checkout page for review before payment
      toast.success('Order created. Please review your order before payment.');
      navigate(`/checkout?orderId=${result.id}`);
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setIsProcessing(false);
    }
  };

  const submitOrder = async () => {
    // Validate file upload
    if (!file) {
      toast.error(t('newPrint.toasts.uploadRequired'));
      return;
    }

    // Validate model is valid (no errors)
    if (modelError) {
      toast.error(t('newPrint.toasts.fixModelIssues'));
      return;
    }

    // Validate material and quality
    if (!material || !quality) {
      toast.error(t('newPrint.toasts.selectMaterialQuality'));
      return;
    }

    // Price should be calculated automatically
    if (!estimatedPrice) {
      toast.error("Price calculation in progress, please wait");
      return;
    }

    // Validate delivery selection
    if (!selectedDeliveryOption) {
      toast.error(t('newPrint.toasts.selectDelivery'));
      return;
    }

    // Validate locker selection for InPost
    if (selectedDeliveryOption === "inpost" && !selectedLocker) {
      toast.error(t('newPrint.toasts.selectLocker'));
      return;
    }

    // Validate address for DPD
    if (selectedDeliveryOption === "dpd" && !isAddressValid(shippingAddress)) {
      toast.error(t('newPrint.toasts.fillAddress'));
      return;
    }

    try {
      // Create FormData to send file and order details
      const formData = new FormData();
      formData.append('file', file);
      formData.append('material', material.split('-')[0]); // e.g., 'pla-white' -> 'pla'
      formData.append('color', material.split('-')[1] || 'white'); // e.g., 'pla-white' -> 'white'
      
      // Use custom layer height if advanced settings enabled, otherwise quality preset
      const layerHeight = advancedMode && customLayerHeight ? customLayerHeight : 
                         (quality === 'draft' ? '0.3' : quality === 'standard' ? '0.2' : quality === 'high' ? '0.15' : '0.1');
      formData.append('layerHeight', layerHeight);
      
      // Use custom infill if advanced settings enabled, otherwise quality preset
      const infill = advancedMode && customInfill ? customInfill :
                    (quality === 'draft' ? '10' : quality === 'standard' ? '20' : quality === 'high' ? '30' : '40');
      formData.append('infill', infill);
      
      formData.append('quantity', quantity.toString());
      formData.append('shippingMethod', selectedDeliveryOption);
      formData.append('price', estimatedPrice.toString());
      
      // Add advanced mode flag
      formData.append('advancedMode', advancedMode.toString());
      
      // Add advanced settings
      formData.append('supportType', supportType);
      formData.append('infillPattern', infillPattern);
      
      // Add custom values if advanced mode was used
      if (advancedMode) {
        if (customLayerHeight) {
          formData.append('customLayerHeight', customLayerHeight);
        }
        if (customInfill) {
          formData.append('customInfill', customInfill);
        }
      }
      
      // Add material weight and print time for accurate price recalculation later
      // These values are calculated based on actual model analysis
      if (estimatedWeight && estimatedPrintTime) {
        formData.append('materialWeight', Math.round(estimatedWeight).toString()); // in grams
        formData.append('printTime', Math.round(estimatedPrintTime * 60).toString()); // convert hours to minutes
      }
      
      // CRITICAL: Store the base model volume for accurate recalculation in EditOrder
      if (modelAnalysis) {
        formData.append('modelVolume', modelAnalysis.volumeCm3.toString()); // in cm³
      }
      
      // Add delivery-specific details
      if (selectedDeliveryOption === 'inpost' && selectedLocker) {
        formData.append('shippingAddress', JSON.stringify({
          lockerCode: selectedLocker.name,
          lockerAddress: selectedLocker.address
        }));
      } else if (selectedDeliveryOption === 'dpd') {
        formData.append('shippingAddress', JSON.stringify(shippingAddress));
      }

      const response = await apiFormData('/orders', formData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const order = await response.json();
      
      toast.success(t('newPrint.toasts.orderSubmitted'));
      
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
              <Logo size="sm" textClassName="text-xl" />
            </button>
            <Button variant="outline" onClick={() => navigate("/login")} className="hover-lift">
              {t('common.login')}
            </Button>
          </div>
        </header>
      )}
      
      <main className={`flex-1 p-8 ${!isLoggedIn ? 'pt-24' : ''} overflow-y-auto max-h-screen`}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold mb-3 gradient-text">{t('newPrint.title')}</h1>
            <p className="text-muted-foreground text-lg">{t('newPrint.subtitle')}</p>
          </div>

          {/* Upload Mode Selection */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-card to-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Upload className="w-6 h-6 text-primary" />
                {t('newPrint.uploadTitle')}
              </CardTitle>
              <CardDescription className="text-base">{t('newPrint.supportedFormats')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'single' | 'project')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="single" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t('newPrint.singleFile')}
                  </TabsTrigger>
                  <TabsTrigger value="project" className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    {t('newPrint.projectMultiple')}
                  </TabsTrigger>
                </TabsList>

                {/* Single File Upload */}
                <TabsContent value="single">
                  <div 
                    className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer group hover-lift bg-gradient-to-br from-primary/5 to-purple-500/5 ${
                      isDragging 
                        ? 'border-primary bg-primary/10 scale-[1.02]' 
                        : 'border-primary/30 hover:border-primary hover:bg-primary/5'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".stl,.obj,.3mf"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className={`w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-all duration-300 ${
                        isDragging ? 'scale-125 rotate-12' : 'group-hover:scale-110 group-hover:rotate-6'
                      }`}>
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
                          <p className={`font-bold text-xl mb-2 transition-colors ${isDragging ? 'text-primary' : 'group-hover:text-primary'}`}>
                            {isDragging ? t('newPrint.dropFileHere') : t('newPrint.clickToUpload')}
                          </p>
                          <p className="text-muted-foreground">{t('newPrint.fileFormats')}</p>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  {file && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-muted/50 to-background rounded-2xl border-2 border-primary/10 animate-slide-up">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isModelLoading ? 'bg-yellow-500 animate-pulse' : modelAnalysis ? 'bg-green-500' : 'bg-primary animate-pulse'}`}></span>
                          {t('newPrint.preview.title')} {isModelLoading && `(${t('common.loading')})`}
                        </p>
                        {modelAnalysis && (
                          <span className="text-xs text-green-600 font-semibold">✓ {t('newPrint.analysisComplete')}</span>
                        )}
                      </div>
                      <ModelViewer file={file} onAnalysisComplete={handleAnalysisComplete} onError={handleModelError} />
                      
                      {/* Dynamic Model Stats */}
                      {modelAnalysis && (
                        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 bg-card rounded-lg border border-primary/20">
                            <p className="text-xs text-muted-foreground">{t('newPrint.fileInfo.volume')}</p>
                            <p className="text-lg font-bold text-primary">{modelAnalysis.volumeCm3.toFixed(2)} cm³</p>
                          </div>
                          <div className="p-3 bg-card rounded-lg border border-primary/20">
                            <p className="text-xs text-muted-foreground">{t('newPrint.estWeight')}</p>
                            <p className="text-lg font-bold text-primary">
                              {estimatedWeight ? `${estimatedWeight.toFixed(1)}g` : '--'}
                            </p>
                            {material && <p className="text-xs text-muted-foreground">{material.split('-')[0].toUpperCase()}</p>}
                          </div>
                          <div className="p-3 bg-card rounded-lg border border-primary/20">
                            <p className="text-xs text-muted-foreground">{t('newPrint.estPrintTime')}</p>
                            <p className="text-lg font-bold text-primary">
                              {formatPrintTime(estimatedPrintTime)}
                            </p>
                            {quality && <p className="text-xs text-muted-foreground">{t(`newPrint.qualityOptions.${quality}`)}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Project (Multiple Files) Upload */}
                <TabsContent value="project">
                  <div className="space-y-4">
                    {/* Project Name */}
                    <div className="space-y-2">
                      <Label htmlFor="project-name" className="text-base font-semibold">{t('newPrint.projectName')}</Label>
                      <Input 
                        id="project-name"
                        placeholder={t('newPrint.projectNamePlaceholder')}
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    {/* Drop zone for multiple files */}
                    <div 
                      className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group hover-lift bg-gradient-to-br from-primary/5 to-purple-500/5 ${
                        isDragging 
                          ? 'border-primary bg-primary/10 scale-[1.02]' 
                          : 'border-primary/30 hover:border-primary hover:bg-primary/5'
                      }`}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleProjectDrop}
                    >
                      <input
                        type="file"
                        id="project-file-upload"
                        className="hidden"
                        accept=".stl,.obj,.3mf"
                        multiple
                        onChange={handleProjectFileChange}
                      />
                      <label htmlFor="project-file-upload" className="cursor-pointer">
                        <div className={`w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-300 ${
                          isDragging ? 'scale-125 rotate-12' : 'group-hover:scale-110 group-hover:rotate-6'
                        }`}>
                          <Plus className="w-8 h-8 text-white" />
                        </div>
                        <p className={`font-bold text-lg mb-1 transition-colors ${isDragging ? 'text-primary' : 'group-hover:text-primary'}`}>
                          {isDragging ? t('newPrint.dropFilesHere') : t('newPrint.addFilesToProject')}
                        </p>
                        <p className="text-sm text-muted-foreground">{t('newPrint.clickOrDragMultiple')}</p>
                      </label>
                    </div>

                    {/* Project Files List */}
                    {projectFiles.length > 0 && (
                      <div className="space-y-4 mt-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg">{projectFiles.length} {projectFiles.length > 1 ? t('newPrint.filesInProject') : t('newPrint.fileInProject')}</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById('project-file-upload') as HTMLInputElement;
                              input?.click();
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" /> {t('newPrint.addMore')}
                          </Button>
                        </div>

                        {projectFiles.map((pf, index) => (
                          <Collapsible key={pf.id} open={pf.isExpanded} onOpenChange={() => toggleFileExpanded(pf.id)}>
                            <div className="border-2 border-primary/20 rounded-xl overflow-hidden bg-card">
                              <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                                      <FileText className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="text-left">
                                      <p className="font-semibold">{pf.file.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {(pf.file.size / 1024 / 1024).toFixed(2)} MB
                                        {pf.modelAnalysis && ` • ${pf.modelAnalysis.volumeCm3.toFixed(2)} cm³`}
                                        {pf.estimatedPrice && ` • ${pf.estimatedPrice.toFixed(2)} PLN`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {pf.isLoading && <span className="text-xs text-yellow-600">{t('common.loading')}</span>}
                                    {pf.error && <span className="text-xs text-red-600">{t('common.error')}</span>}
                                    {pf.modelAnalysis && !pf.error && <span className="text-xs text-green-600">✓</span>}
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeProjectFile(pf.id);
                                      }}
                                    >
                                      <X className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                                    </Button>
                                    {pf.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent>
                                <div className="p-4 pt-0 space-y-4 border-t border-primary/10">
                                  {/* 3D Preview - Only render when expanded */}
                                  <div className="h-48 bg-muted/30 rounded-lg overflow-hidden">
                                    {pf.isExpanded && (
                                      <MemoizedModelViewer 
                                        file={pf.file}
                                        fileId={pf.id}
                                        onAnalysisComplete={handleProjectFileAnalysis}
                                        onError={handleProjectFileError}
                                      />
                                    )}
                                  </div>

                                  {/* File Configuration */}
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                      <Label className="text-sm">{t('newPrint.settings.material')}</Label>
                                      <Select 
                                        value={pf.material} 
                                        onValueChange={(v) => updateProjectFile(pf.id, { material: v })}
                                        disabled={materialsLoading}
                                      >
                                        <SelectTrigger className="h-10">
                                          <SelectValue placeholder={materialsLoading ? "Loading..." : "Select"} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                          {materialsLoading ? (
                                            <div className="px-2 py-2 text-sm text-muted-foreground">Loading materials...</div>
                                          ) : (
                                            ['PLA', 'ABS', 'PETG'].map(type => {
                                              const typeMaterials = materials.filter(m => m.material_type === type && m.is_active);
                                              if (typeMaterials.length === 0) return null;
                                              return (
                                                <div key={type}>
                                                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{type}</div>
                                                  {typeMaterials.map(mat => {
                                                    const materialKey = getMaterialKey(mat.material_type, mat.color);
                                                    const isOOS = mat.stock_status === 'out_of_stock';
                                                    return (
                                                      <SelectItem key={mat.id} value={materialKey}>
                                                        <span style={{ color: mat.hex_color || '#000000' }}>♥</span> {mat.material_type} - {mat.color} {isOOS && "⚠️"}
                                                      </SelectItem>
                                                    );
                                                  })}
                                                </div>
                                              );
                                            })
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-1">
                                      <Label className="text-sm">{t('newPrint.settings.quality')}</Label>
                                      <Select 
                                        value={pf.quality} 
                                        onValueChange={(v) => updateProjectFile(pf.id, { quality: v })}
                                      >
                                        <SelectTrigger className="h-10">
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="draft">⚡ Draft</SelectItem>
                                          <SelectItem value="standard">✨ Standard</SelectItem>
                                          <SelectItem value="high">💎 High</SelectItem>
                                          <SelectItem value="ultra">🏆 Ultra</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-1">
                                      <Label className="text-sm">{t('newPrint.settings.quantity')}</Label>
                                      <Input 
                                        type="number" 
                                        min="1"
                                        value={pf.quantity}
                                        onChange={(e) => updateProjectFile(pf.id, { quantity: parseInt(e.target.value) || 1 })}
                                        className="h-10"
                                      />
                                    </div>
                                  </div>

                                  {/* File Stats */}
                                  {pf.modelAnalysis && (
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                      <div className="p-2 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground">{t('newPrint.fileInfo.volume')}</p>
                                        <p className="font-bold text-primary">{pf.modelAnalysis.volumeCm3.toFixed(2)} cm³</p>
                                      </div>
                                      <div className="p-2 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground">{t('newPrint.estWeight')}</p>
                                        <p className="font-bold text-primary">
                                          {pf.material && pf.quality ? (() => {
                                            const materialType = pf.material.split('-')[0];
                                            const density = MATERIAL_DENSITIES[materialType] || 1.24;
                                            const infillPercent = INFILL_BY_QUALITY[pf.quality] || 20;
                                            const effectiveVolume = pf.modelAnalysis!.volumeCm3 * (1 + (infillPercent / 100));
                                            return `${(effectiveVolume * density).toFixed(1)}g`;
                                          })() : '--'}
                                        </p>
                                      </div>
                                      <div className="p-2 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground">{t('newPrint.pricing.total')}</p>
                                        <p className="font-bold text-primary">
                                          {pf.estimatedPrice ? `${pf.estimatedPrice.toFixed(2)} PLN` : '--'}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}

                        {/* Project Total */}
                        {projectFiles.length > 0 && (
                          <div className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl border-2 border-primary/30">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-lg">{t('newPrint.projectTotal')} ({projectFiles.length} {t('newPrint.items')})</span>
                              <span className="text-2xl font-bold gradient-text">
                                {totalProjectPrice > 0 ? `${totalProjectPrice.toFixed(2)} PLN` : '--'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Configuration - Only show for single file mode */}
          {uploadMode === 'single' && (
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-card to-muted/30" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calculator className="w-6 h-6 text-primary" />
                {t('newPrint.settings.title')}
              </CardTitle>
              <CardDescription className="text-base">{t('newPrint.selectPreferredSettings')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="material" className="text-base font-semibold">{t('newPrint.material')}</Label>
                  <Select value={material} onValueChange={setMaterial} disabled={materialsLoading}>
                    <SelectTrigger id="material" className="h-12">
                      <SelectValue placeholder={materialsLoading ? "Loading materials..." : t('newPrint.selectMaterial')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {materialsLoading ? (
                        <div className="px-2 py-3 text-sm text-muted-foreground">Loading materials...</div>
                      ) : (
                        ['PLA', 'ABS', 'PETG'].map(type => {
                          const typeMaterials = materials.filter(m => m.material_type === type && m.is_active);
                          if (typeMaterials.length === 0) return null;
                          return (
                            <div key={type}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{type}</div>
                              {typeMaterials.map(mat => {
                                const materialKey = getMaterialKey(mat.material_type, mat.color);
                                const isOOS = mat.stock_status === 'out_of_stock';
                                return (
                                  <SelectItem key={mat.id} value={materialKey}>
                                    <span style={{ color: mat.hex_color || '#000000' }}>♥</span> {mat.material_type} - {mat.color} {isOOS && "⚠️"}
                                  </SelectItem>
                                );
                              })}
                            </div>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  {material && isOutOfStock(material) && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg animate-scale-in">
                      <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        {getOutOfStockWarning(material)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality" className="text-base font-semibold">{t('newPrint.quality')}</Label>
                  <Select value={quality} onValueChange={setQuality} disabled={advancedMode}>
                    <SelectTrigger id="quality" className="h-12">
                      <SelectValue placeholder={t('newPrint.selectQuality')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        <div className="flex flex-col py-1">
                          <div className="font-semibold">⚡ Draft - Fast</div>
                          <div className="text-xs text-muted-foreground">Layer: 0.28mm | Infill: 10% | Speed: Very Fast</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="standard">
                        <div className="flex flex-col py-1">
                          <div className="font-semibold">✨ Standard</div>
                          <div className="text-xs text-muted-foreground">Layer: 0.20mm | Infill: 20% | Speed: Fast</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex flex-col py-1">
                          <div className="font-semibold">💎 High Quality</div>
                          <div className="text-xs text-muted-foreground">Layer: 0.12mm | Infill: 30% | Speed: Medium</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="ultra">
                        <div className="flex flex-col py-1">
                          <div className="font-semibold">🏆 Ultra - Finest</div>
                          <div className="text-xs text-muted-foreground">Layer: 0.08mm | Infill: 40% | Speed: Slow</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {quality && !advancedMode && (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      <div className="font-medium mb-1">{qualityPresets[quality as keyof typeof qualityPresets].icon} {quality.charAt(0).toUpperCase() + quality.slice(1)} Quality</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>• Layer Height: {qualityPresets[quality as keyof typeof qualityPresets].layerHeight}</div>
                        <div>• Infill: {qualityPresets[quality as keyof typeof qualityPresets].infill}</div>
                        <div>• Print Speed: {qualityPresets[quality as keyof typeof qualityPresets].speed}</div>
                        <div>• Detail Level: {qualityPresets[quality as keyof typeof qualityPresets].detail}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-base font-semibold">{t('newPrint.quantity')}</Label>
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
                <Label htmlFor="purpose">{t('newPrint.purpose')}</Label>
                <Textarea
                  id="purpose"
                  placeholder={t('newPrint.notesPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label htmlFor="advancedMode" className="text-base font-semibold cursor-pointer">Advanced Mode</Label>
                    <p className="text-sm text-muted-foreground">Manually configure all print parameters</p>
                  </div>
                  <Checkbox
                    id="advancedMode"
                    checked={advancedMode}
                    onCheckedChange={(checked) => {
                      setAdvancedMode(checked as boolean);
                      if (checked) {
                        // When switching to advanced mode, set defaults from quality preset
                        if (quality) {
                          const preset = qualityPresets[quality as keyof typeof qualityPresets];
                          setCustomLayerHeight(preset.layerHeight);
                          setCustomInfill(preset.infill);
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {advancedMode && (
                <div className="space-y-4 p-4 bg-muted rounded-lg border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">Advanced Settings Active</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customLayerHeight">Layer Height (mm)</Label>
                      <Input
                        id="customLayerHeight"
                        type="text"
                        placeholder="e.g., 0.20"
                        value={customLayerHeight || ''}
                        onChange={(e) => setCustomLayerHeight(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customInfill">Infill (%)</Label>
                      <Input
                        id="customInfill"
                        type="text"
                        placeholder="e.g., 20"
                        value={customInfill || ''}
                        onChange={(e) => setCustomInfill(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="infillPattern">Infill Pattern</Label>
                      <Select value={infillPattern} onValueChange={setInfillPattern}>
                        <SelectTrigger id="infillPattern">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid">Grid</SelectItem>
                          <SelectItem value="honeycomb">Honeycomb</SelectItem>
                          <SelectItem value="triangles">Triangles</SelectItem>
                          <SelectItem value="gyroid">Gyroid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Price Estimate */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-card to-muted/30" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calculator className="w-6 h-6 text-primary" />
                {t('newPrint.estimatedPrice')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isLoggedIn ? (
                <Button
                  onClick={() => {
                    toast.info(t('newPrint.loginRequired'));
                    window.location.href = '/login';
                  }}
                  className="w-full h-12 hover-lift shadow-lg border-2 border-primary/50"
                  variant="outline"
                >
                  <span className="flex items-center">
                    🔒 {t('newPrint.loginRequired')}
                  </span>
                </Button>
              ) : uploadMode === 'project' ? (
                <Button onClick={calculateAllProjectPrices} className="w-full h-12 hover-lift shadow-lg group relative overflow-hidden" variant="default" disabled={projectFiles.length === 0}>
                  <span className="relative z-10 flex items-center">
                    <Calculator className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    {t('newPrint.calculateAllPrices')} ({projectFiles.length} {t('newPrint.files')})
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
              ) : null}

              {/* Single file price breakdown */}
              {uploadMode === 'single' && estimatedPrice !== null && priceBreakdown && (
                <div className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl border-2 border-primary/30 shadow-lg animate-scale-in">
                  <div className="space-y-4">
                    {/* Price Breakdown Header */}
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold">{t('newPrint.pricing.title')}</p>
                      {modelAnalysis ? (
                        <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded">✓ {t('newPrint.actualWeight')}</span>
                      ) : (
                        <span className="text-xs text-yellow-600 font-semibold bg-yellow-100 px-2 py-1 rounded">⚠ {t('newPrint.estimated')}</span>
                      )}
                    </div>

                    {/* Internal Costs */}
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-muted-foreground">{t('newPrint.pricing.internalCosts')}</span>
                      <span className="font-semibold">{priceBreakdown.internalCost.toFixed(2)} {t('common.pln')}</span>
                    </div>

                    {/* Service Fee */}
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-muted-foreground">{t('newPrint.pricing.serviceFee')}</span>
                      <span className="font-semibold">{priceBreakdown.serviceFee.toFixed(2)} {t('common.pln')}</span>
                    </div>

                    {/* VAT */}
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-muted-foreground">{t('newPrint.pricing.vat')}</span>
                      <span className="font-semibold">{priceBreakdown.vat.toFixed(2)} {t('common.pln')}</span>
                    </div>

                    {/* Print Cost Total */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{t('newPrint.pricing.printCost')} {quantity > 1 ? `(×${quantity})` : ''}</span>
                        <span className="text-2xl font-bold text-primary">{estimatedPrice.toFixed(2)} {t('common.pln')}</span>
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
                          <span className="text-muted-foreground">{t('newPrint.delivery')}</span>
                          <span className="font-semibold text-primary">
                            {(deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.price || 0).toFixed(2)} {t('common.pln')}
                          </span>
                        </div>
                        
                        <div className="border-t-2 border-primary/30 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">{t('newPrint.pricing.total')}</span>
                            <span className="text-4xl font-bold gradient-text">
                              {(estimatedPrice + (deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.price || 0)).toFixed(2)} {t('common.pln')}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Project mode price summary */}
              {uploadMode === 'project' && projectFiles.length > 0 && totalProjectPrice > 0 && (
                <div className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl border-2 border-primary/30 shadow-lg animate-scale-in">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold">{t('newPrint.projectPriceSummary')}</p>
                      <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded">
                        {projectFiles.length} {projectFiles.length > 1 ? t('newPrint.files') : t('newPrint.file')}
                      </span>
                    </div>

                    {/* Individual file costs */}
                    {projectFiles.map((pf, index) => (
                      <div key={pf.id} className="flex justify-between items-center py-2 border-b border-primary/20">
                        <span className="text-muted-foreground text-sm truncate max-w-[200px]">
                          {index + 1}. {pf.file.name}
                        </span>
                        <span className="font-semibold">
                          {pf.estimatedPrice ? `${pf.estimatedPrice.toFixed(2)} PLN` : '--'}
                        </span>
                      </div>
                    ))}

                    {/* Subtotal */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{t('newPrint.pricing.printCostAllFiles')}</span>
                        <span className="text-2xl font-bold text-primary">{totalProjectPrice.toFixed(2)} {t('common.pln')}</span>
                      </div>
                    </div>
                    
                    {selectedDeliveryOption && (
                      <>
                        <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                          <span className="text-muted-foreground">{t('newPrint.delivery')}</span>
                          <span className="font-semibold text-primary">
                            {(deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.price || 0).toFixed(2)} {t('common.pln')}
                          </span>
                        </div>
                        
                        <div className="border-t-2 border-primary/30 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">{t('newPrint.totalProjectPrice')}</span>
                            <span className="text-4xl font-bold gradient-text">
                              {(totalProjectPrice + (deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.price || 0)).toFixed(2)} {t('common.pln')}
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
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-card to-muted/30" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Send className="w-6 h-6 text-primary" />
                {t('delivery.title')}
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
                  <p className="font-bold text-sm mb-1">{t('delivery.selectedLocker')}:</p>
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
              toast.success(`${t('delivery.lockerSelected')} ${locker.name}`);
            }}
          />

          {/* Submit */}
          <Button onClick={proceedToPayment} size="lg" className="w-full h-14 text-lg hover-lift shadow-xl group relative overflow-hidden animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <span className="relative z-10 flex items-center">
              <CreditCard className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
              {t('newPrint.placeOrder')}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NewPrint;
