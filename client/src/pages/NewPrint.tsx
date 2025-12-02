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
import { Upload, Calculator, Send, CreditCard, FileText, FolderOpen, X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { DeliveryOptions, deliveryOptions } from "@/components/DeliveryOptions";
import { LockerPickerModal } from "@/components/LockerPickerModal";
import { DPDAddressForm, isAddressValid, ShippingAddress } from "@/components/DPDAddressForm";
import { ModelViewer } from "@/components/ModelViewer/ModelViewer";
import type { ModelAnalysis } from "@/components/ModelViewer/useModelAnalysis";
import { apiFormData } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

const NewPrint = () => {
  const navigate = useNavigate();
  
  // Upload mode: 'single' or 'project'
  const [uploadMode, setUploadMode] = useState<'single' | 'project'>('single');
  
  // Single file state
  const [file, setFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [material, setMaterial] = useState("");
  const [quality, setQuality] = useState("");
  const [quantity, setQuantity] = useState(1);
  
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
      setModelError(null);
      toast.success("File uploaded successfully! Analyzing model...");
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
    toast.success(`Model analyzed! Volume: ${analysis.volumeCm3.toFixed(2)} cm³`);
  };

  const handleModelError = (error: string | null) => {
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
    
    const materialPrices: Record<string, number> = {
      "pla-white": 39, "pla-black": 39, "pla-red": 49, "pla-yellow": 49, "pla-blue": 49,
      "abs-silver": 50, "abs-transparent": 50, "abs-black": 50, "abs-grey": 50,
      "abs-red": 50, "abs-white": 50, "abs-blue": 50, "abs-green": 50,
      "petg-black": 30, "petg-white": 35, "petg-red": 39, "petg-green": 39,
      "petg-blue": 39, "petg-yellow": 39, "petg-pink": 39, "petg-orange": 39, "petg-silver": 39,
    };

    const materialPricePerKg = materialPrices[projectFile.material] || 39;
    const Cmaterial = materialPricePerKg * (materialWeightGrams / 1000);
    const Cenergy = printTimeHours * 0.27 * 0.914;
    const Clabor = 31.40 * (10 / 60);
    const Cdepreciation = (3483.39 / 5000) * printTimeHours;
    const Cmaintenance = Cdepreciation * 0.03;
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

      // Navigate to payment page with project order data
      navigate('/payment', {
        state: {
          orderData: {
            isProject: true,
            projectName: projectName || 'Untitled Project',
            files: projectFiles.map(pf => ({
              file: pf.file,
              material: pf.material,
              quality: pf.quality,
              quantity: pf.quantity,
              modelAnalysis: pf.modelAnalysis,
              estimatedPrice: calculateProjectFilePrice(pf)?.totalPrice || 0,
            })),
            deliveryOption: selectedDeliveryOption,
            locker: selectedLocker,
            shippingAddress,
            projectTotal,
            deliveryPrice,
            totalAmount,
          }
        }
      });
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

    // Validate model is valid (no errors)
    if (modelError) {
      toast.error("Please fix the model issues before submitting");
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
      formData.append('price', estimatedPrice.toString());
      
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
              <Logo size="sm" textClassName="text-xl" />
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

          {/* Upload Mode Selection */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-white to-gray-50/30">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Upload className="w-6 h-6 text-primary" />
                Upload 3D Model
              </CardTitle>
              <CardDescription className="text-base">Supported formats: STL, OBJ, STEP (max 50MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'single' | 'project')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="single" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Single File
                  </TabsTrigger>
                  <TabsTrigger value="project" className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Project (Multiple Files)
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
                      accept=".stl,.obj,.step"
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
                            {isDragging ? 'Drop your file here!' : 'Click to upload or drag and drop'}
                          </p>
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
                      <ModelViewer file={file} onAnalysisComplete={handleAnalysisComplete} onError={handleModelError} />
                      
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
                </TabsContent>

                {/* Project (Multiple Files) Upload */}
                <TabsContent value="project">
                  <div className="space-y-4">
                    {/* Project Name */}
                    <div className="space-y-2">
                      <Label htmlFor="project-name" className="text-base font-semibold">Project Name</Label>
                      <Input 
                        id="project-name"
                        placeholder="My 3D Print Project"
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
                        accept=".stl,.obj,.step"
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
                          {isDragging ? 'Drop files here!' : 'Add files to project'}
                        </p>
                        <p className="text-sm text-muted-foreground">Click or drag multiple STL, OBJ, or STEP files</p>
                      </label>
                    </div>

                    {/* Project Files List */}
                    {projectFiles.length > 0 && (
                      <div className="space-y-4 mt-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg">{projectFiles.length} File{projectFiles.length > 1 ? 's' : ''} in Project</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById('project-file-upload') as HTMLInputElement;
                              input?.click();
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add More
                          </Button>
                        </div>

                        {projectFiles.map((pf, index) => (
                          <Collapsible key={pf.id} open={pf.isExpanded} onOpenChange={() => toggleFileExpanded(pf.id)}>
                            <div className="border-2 border-primary/20 rounded-xl overflow-hidden bg-white">
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
                                    {pf.isLoading && <span className="text-xs text-yellow-600">Loading...</span>}
                                    {pf.error && <span className="text-xs text-red-600">Error</span>}
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
                                      <Label className="text-sm">Material & Color</Label>
                                      <Select 
                                        value={pf.material} 
                                        onValueChange={(v) => updateProjectFile(pf.id, { material: v })}
                                      >
                                        <SelectTrigger className="h-10">
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">PLA</div>
                                          <SelectItem value="pla-white">🤍 PLA - White</SelectItem>
                                          <SelectItem value="pla-black">🖤 PLA - Black</SelectItem>
                                          <SelectItem value="pla-red">❤️ PLA - Red</SelectItem>
                                          <SelectItem value="pla-blue">💙 PLA - Blue</SelectItem>
                                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">ABS</div>
                                          <SelectItem value="abs-black">🖤 ABS - Black</SelectItem>
                                          <SelectItem value="abs-white">🤍 ABS - White</SelectItem>
                                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">PETG</div>
                                          <SelectItem value="petg-black">🖤 PETG - Black</SelectItem>
                                          <SelectItem value="petg-white">🤍 PETG - White</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-1">
                                      <Label className="text-sm">Quality</Label>
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
                                      <Label className="text-sm">Quantity</Label>
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
                                        <p className="text-xs text-muted-foreground">Volume</p>
                                        <p className="font-bold text-primary">{pf.modelAnalysis.volumeCm3.toFixed(2)} cm³</p>
                                      </div>
                                      <div className="p-2 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground">Est. Weight</p>
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
                                        <p className="text-xs text-muted-foreground">Price</p>
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
                              <span className="font-bold text-lg">Project Total ({projectFiles.length} items)</span>
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
          )}

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
              ) : uploadMode === 'single' ? (
                <Button onClick={calculatePrice} className="w-full h-12 hover-lift shadow-lg group relative overflow-hidden" variant="default">
                  <span className="relative z-10 flex items-center">
                    <Calculator className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Calculate Price
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
              ) : (
                <Button onClick={calculateAllProjectPrices} className="w-full h-12 hover-lift shadow-lg group relative overflow-hidden" variant="default" disabled={projectFiles.length === 0}>
                  <span className="relative z-10 flex items-center">
                    <Calculator className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Calculate All Prices ({projectFiles.length} files)
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
              )}

              {/* Single file price breakdown */}
              {uploadMode === 'single' && estimatedPrice !== null && priceBreakdown && (
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

              {/* Project mode price summary */}
              {uploadMode === 'project' && projectFiles.length > 0 && totalProjectPrice > 0 && (
                <div className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl border-2 border-primary/30 shadow-lg animate-scale-in">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold">Project Price Summary</p>
                      <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded">
                        {projectFiles.length} file{projectFiles.length > 1 ? 's' : ''}
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
                        <span className="font-bold">Print Cost (All Files)</span>
                        <span className="text-2xl font-bold text-primary">{totalProjectPrice.toFixed(2)} PLN</span>
                      </div>
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
                            <span className="text-lg font-bold">Total Project Price</span>
                            <span className="text-4xl font-bold gradient-text">
                              {(totalProjectPrice + (deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.price || 0)).toFixed(2)} PLN
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
