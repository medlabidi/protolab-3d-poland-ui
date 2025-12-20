import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";
import type { ModelAnalysis } from "@/components/ModelViewer/useModelAnalysis";
import * as THREE from 'three';
import { ArrowLeft, Save, Loader2, X, Calculator, RefreshCw, AlertTriangle, Ban, FileText, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { DeliveryOptions, deliveryOptions } from "@/components/DeliveryOptions";
import { LockerPickerModal } from "@/components/LockerPickerModal";
import { DPDAddressForm, isAddressValid, ShippingAddress } from "@/components/DPDAddressForm";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  created_at: string;
  material: string;
  color: string;
  layer_height: string;
  infill: string;
  quantity: number;
  file_name: string;
  file_url: string;
  shipping_method: string;
  shipping_address?: string;
  price: number;
  material_weight?: number;
  print_time?: number;
  model_volume_cm3?: number;
  // Advanced settings
  support_type?: 'none' | 'normal' | 'tree';
  infill_pattern?: 'grid' | 'honeycomb' | 'triangles' | 'gyroid';
  custom_layer_height?: string;
  custom_infill?: string;
}

interface MaterialData {
  id: string;
  material_type: string;
  color: string;
  price_per_kg: number;
  stock_status: string;
  lead_time_days: number;
  hex_color?: string;
  is_active: boolean;
}

interface PrinterSpecs {
  power_watts: number;
  cost_pln: number;
  lifespan_hours: number;
  maintenance_rate: number;
}

// Fallback printer specs if database fetch fails
const DEFAULT_PRINTER_SPECS: PrinterSpecs = {
  power_watts: 270,
  cost_pln: 3483.39,
  lifespan_hours: 5000,
  maintenance_rate: 0.03,
};

const SHIPPING_COSTS: Record<string, number> = {
  'pickup': 0,
  'inpost': 12.99,
  'dpd': 24.99,
  'courier': 24.99,
  'standard': 12.99,
  'express': 24.99,
};

// Material densities (g/cm³) - same as NewPrint
const MATERIAL_DENSITIES: Record<string, number> = {
  pla: 1.24,
  abs: 1.04,
  petg: 1.27,
  tpu: 1.21,
  nylon: 1.14,
  resin: 1.1,
};

// Infill percentages by quality
const INFILL_BY_QUALITY: Record<string, number> = {
  '0.3': 10,   // Draft
  '0.2': 20,   // Standard
  '0.15': 30,  // High
  '0.1': 40,   // Ultra
};

// Print speeds (cm³/hour) by layer height
const PRINT_SPEED_CM3_PER_HOUR: Record<string, number> = {
  '0.3': 15,   // Draft
  '0.2': 10,   // Standard
  '0.15': 6,   // High
  '0.1': 3,    // Ultra
};

const EditOrder = () => {
  const { t } = useLanguage();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  // Order data
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Materials and printer specs
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [printerSpecs, setPrinterSpecs] = useState<PrinterSpecs>(DEFAULT_PRINTER_SPECS);
  
  // Model analysis
  const [modelAnalysis, setModelAnalysis] = useState<ModelAnalysis | null>(null);
  const [analyzingModel, setAnalyzingModel] = useState(false);

  // Form state
  const [material, setMaterial] = useState('');
  const [layerHeight, setLayerHeight] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
  });
  const [selectedLocker, setSelectedLocker] = useState<{ id: string; name: string; address: string } | null>(null);
  const [showLockerModal, setShowLockerModal] = useState(false);

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [supportType, setSupportType] = useState<'none' | 'normal' | 'tree'>('none');
  const [infillPattern, setInfillPattern] = useState<'grid' | 'honeycomb' | 'triangles' | 'gyroid'>('grid');
  const [customLayerHeight, setCustomLayerHeight] = useState<string | undefined>(undefined);
  const [customInfill, setCustomInfill] = useState<string | undefined>(undefined);

  // Price
  const [originalPrice, setOriginalPrice] = useState(0);
  const [newPrice, setNewPrice] = useState(0);

  // Permissions
  const [canEditPrintParams, setCanEditPrintParams] = useState(false);
  const [canEditShipping, setCanEditShipping] = useState(false);
  const [cannotEdit, setCannotEdit] = useState(false);

  const previousMaterialRef = useRef<string>('');
  const previousLayerHeightRef = useRef<string>('');
  const previousQuantityRef = useRef<number>(1);

  const getMaterialKey = (materialType: string, color: string) => {
    return `${materialType.toLowerCase()}-${color.toLowerCase()}`;
  };

  // Token refresh helper
  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        return data.tokens.accessToken;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    return null;
  };

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async (retry = true) => {
      try {
        let token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_URL}/orders/${orderId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401 && retry) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            return fetchOrder(false);
          }
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch order');

        const data = await response.json();
        console.log('=== RAW BACKEND RESPONSE ===', data);
        
        const fetchedOrder: Order = data.order;
        
        console.log('=== EDIT ORDER: Loaded Order Data ===', {
          id: fetchedOrder.id,
          model_volume_cm3: fetchedOrder.model_volume_cm3,
          material: fetchedOrder.material,
          color: fetchedOrder.color,
          layer_height: fetchedOrder.layer_height,
          infill: fetchedOrder.infill,
          quantity: fetchedOrder.quantity,
          price: fetchedOrder.price,
          material_weight: fetchedOrder.material_weight,
          print_time: fetchedOrder.print_time,
          support_type: fetchedOrder.support_type,
          infill_pattern: fetchedOrder.infill_pattern
        });
        
        setOrder(fetchedOrder);
        setOriginalPrice(fetchedOrder.price);
        setNewPrice(fetchedOrder.price);

        // Set form values
        if (fetchedOrder.material && fetchedOrder.color) {
          setMaterial(getMaterialKey(fetchedOrder.material, fetchedOrder.color));
        }
        setLayerHeight(String(fetchedOrder.layer_height || '0.2').replace('mm', ''));
        setQuantity(fetchedOrder.quantity || 1);
        setSelectedDeliveryOption(fetchedOrder.shipping_method);

        // Parse shipping address
        if (fetchedOrder.shipping_address) {
          try {
            const parsed = JSON.parse(fetchedOrder.shipping_address);
            if (parsed.lockerCode) {
              setSelectedLocker({ id: parsed.lockerCode, name: parsed.lockerCode, address: parsed.lockerAddress });
            } else {
              setShippingAddress(parsed);
            }
          } catch {
            // Plain string address
          }
        }

        // Load advanced settings
        setSupportType(fetchedOrder.support_type || 'none');
        setInfillPattern(fetchedOrder.infill_pattern || 'grid');
        setCustomLayerHeight(fetchedOrder.custom_layer_height);
        setCustomInfill(fetchedOrder.custom_infill);

        // Auto-show advanced if any non-default settings exist
        if (fetchedOrder.support_type !== 'none' || fetchedOrder.infill_pattern !== 'grid' || 
            fetchedOrder.custom_layer_height || fetchedOrder.custom_infill) {
          setShowAdvanced(true);
        }

        // Store refs
        if (fetchedOrder.material && fetchedOrder.color) {
          previousMaterialRef.current = getMaterialKey(fetchedOrder.material, fetchedOrder.color);
        }
        previousLayerHeightRef.current = String(fetchedOrder.layer_height || '0.2').replace('mm', '');
        previousQuantityRef.current = fetchedOrder.quantity || 1;

        // Set permissions
        const status = fetchedOrder.status;
        if (['finished', 'delivered', 'cancelled'].includes(status)) {
          setCannotEdit(true);
        } else if (status === 'printing') {
          setCanEditShipping(true);
        } else if (['submitted', 'in_queue'].includes(status)) {
          setCanEditPrintParams(true);
          setCanEditShipping(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);
  
  // Fetch and analyze the 3D model from storage
  useEffect(() => {
    const analyzeStoredModel = async () => {
      if (!order || !order.file_url || modelAnalysis) return;
      
      setAnalyzingModel(true);
      try {
        console.log('Fetching 3D model from storage:', order.file_url);
        
        // Load geometry from URL
        const { loadModelFromUrl } = await import('@/components/ModelViewer/loaders');
        const geometry = await loadModelFromUrl(order.file_url, order.file_name || 'model.stl');
        
        console.log('Geometry loaded, analyzing...', { vertices: geometry.attributes.position.count });
        
        // Calculate volume using the same method as useModelAnalysis
        const calculateVolume = (geom: THREE.BufferGeometry): number => {
          const position = geom.attributes.position;
          let volume = 0;
          
          if (geom.index) {
            const indices = geom.index.array;
            for (let i = 0; i < indices.length; i += 3) {
              const a = new THREE.Vector3().fromBufferAttribute(position, indices[i]);
              const b = new THREE.Vector3().fromBufferAttribute(position, indices[i + 1]);
              const c = new THREE.Vector3().fromBufferAttribute(position, indices[i + 2]);
              volume += a.dot(b.cross(c)) / 6;
            }
          } else {
            for (let i = 0; i < position.count; i += 3) {
              const a = new THREE.Vector3().fromBufferAttribute(position, i);
              const b = new THREE.Vector3().fromBufferAttribute(position, i + 1);
              const c = new THREE.Vector3().fromBufferAttribute(position, i + 2);
              volume += a.dot(b.cross(c)) / 6;
            }
          }
          
          return Math.abs(volume);
        };
        
        geometry.computeBoundingBox();
        const box = geometry.boundingBox!;
        
        const boundingBox = {
          x: (box.max.x - box.min.x) / 10, // Convert to cm
          y: (box.max.y - box.min.y) / 10,
          z: (box.max.z - box.min.z) / 10,
        };
        
        const volumeMm3 = calculateVolume(geometry);
        const volumeCm3 = volumeMm3 / 1000;
        
        const analysis: ModelAnalysis = {
          volumeCm3,
          boundingBox,
          surfaceArea: 0, // Not needed for price calculation
          weightGrams: null,
        };
        
        setModelAnalysis(analysis);
        console.log('Model analysis complete:', analysis);
        
        // Update order object with the volume for calculations
        setOrder(prev => prev ? { ...prev, model_volume_cm3: analysis.volumeCm3 } : prev);
        
      } catch (err) {
        console.error('Failed to analyze stored model:', err);
        toast.error('Could not analyze 3D model. Using fallback calculations.');
      } finally {
        setAnalyzingModel(false);
      }
    };
    
    analyzeStoredModel();
  }, [order?.file_url, order?.file_name]);

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch(`${API_URL}/materials/by-type`);
        if (response.ok) {
          const data = await response.json();
          const allMaterials: MaterialData[] = [];
          Object.values(data.materials).forEach((typeMaterials: any) => {
            allMaterials.push(...typeMaterials);
          });
          setMaterials(allMaterials);
        }
      } catch (error) {
        console.error('Failed to fetch materials:', error);
      } finally {
        setMaterialsLoading(false);
      }
    };

    const fetchPrinterSpecs = async () => {
      try {
        const response = await fetch(`${API_URL}/printers/default`);
        if (response.ok) {
          const data = await response.json();
          setPrinterSpecs(data.printer);
        }
      } catch (error) {
        console.error('Failed to fetch printer specs:', error);
      }
    };

    fetchMaterials();
    fetchPrinterSpecs();
  }, []);

  // Recalculate price when parameters change
  useEffect(() => {
    if (order && materials.length > 0) {
      calculateNewPrice();
    }
  }, [material, layerHeight, quantity, supportType, infillPattern, customLayerHeight, customInfill, selectedDeliveryOption, order, materials]);

  // Calculate new weight and print time based on new parameters
  const calculateNewWeightAndTime = () => {
    if (!order || !material || !material.includes('-')) return { weight: 100, time: 240 };

    const parts = material.split('-');
    const selectedMaterialType = parts[0];
    
    if (!selectedMaterialType) return { weight: 100, time: 240 };
    
    // Get the pure 3D model volume (same as NewPrint's modelAnalysis.volumeCm3)
    let baseVolumeCm3: number;
    
    if (order.model_volume_cm3 && order.model_volume_cm3 > 1) {
      baseVolumeCm3 = order.model_volume_cm3;
    } else if (order.material_weight && order.material && order.layer_height) {
      // Fallback: Back-calculate from stored weight
      const originalMaterialType = (order.material || '').toLowerCase();
      const originalDensity = MATERIAL_DENSITIES[originalMaterialType] || 1.24;
      const originalLayerHeight = String(order.layer_height || '0.2').replace('mm', '');
      const originalInfillPercent = INFILL_BY_QUALITY[originalLayerHeight] || 20;
      
      // Reverse calculate: weight = effectiveVolume × density
      // effectiveVolume = baseVolume × (1 + infill%)
      // So: baseVolume = weight / (density × (1 + infill%))
      const effectiveVolume = order.material_weight / originalDensity;
      baseVolumeCm3 = effectiveVolume / (1 + originalInfillPercent / 100);
      
      console.log('Using back-calculated volume from weight:', {
        material_weight: order.material_weight,
        originalDensity,
        originalInfillPercent,
        calculatedVolume: baseVolumeCm3
      });
    } else if (order.price && order.material && order.layer_height && order.infill) {
      // Last resort: Back-calculate from price
      // This is for old orders that don't have model_volume_cm3 or material_weight
      const originalMaterialType = (order.material || '').toLowerCase();
      const originalDensity = MATERIAL_DENSITIES[originalMaterialType] || 1.24;
      const originalInfillPercent = order.infill;
      
      // Find the material price from database
      const originalMaterialData = materials
        .filter(m => m.material_type && m.color)
        .find(m => getMaterialKey(m.material_type, m.color) === getMaterialKey(order.material, order.color || 'black'));
      const materialPricePerKg = originalMaterialData?.price_per_kg || 39;
      
      // Price formula (simplified, ignoring small costs):
      // price ≈ (material_cost + energy_cost + labor + depreciation + maintenance) * 1.23
      // We know labor ≈ 5.23, let's estimate the rest from price
      const priceWithoutVAT = order.price / 1.23;
      const estimatedMaterialCost = (priceWithoutVAT - 5.23) * 0.5; // Rough estimate
      const massKg = estimatedMaterialCost / materialPricePerKg;
      const materialWeightGrams = massKg * 1000;
      const effectiveVolume = materialWeightGrams / originalDensity;
      baseVolumeCm3 = effectiveVolume / (1 + Number(originalInfillPercent) / 100);
      
      console.log('Using back-calculated volume from price:', {
        originalPrice: order.price,
        priceWithoutVAT,
        estimatedMaterialCost,
        massKg,
        materialWeightGrams,
        originalDensity,
        originalInfillPercent,
        calculatedVolume: baseVolumeCm3
      });
    } else {
      // Last resort fallback
      baseVolumeCm3 = 67;
      console.warn('Using hardcoded fallback volume - no model_volume_cm3, material_weight, or price available');
    }

    // EXACT CALCULATION - Same as NewPrint
    const newDensity = MATERIAL_DENSITIES[(selectedMaterialType || '').toLowerCase()] || 1.24;
    
    // Use custom infill if set, otherwise use quality-based default
    const newInfillPercent = customInfill ? parseInt(customInfill) : (INFILL_BY_QUALITY[layerHeight] || 20);
    
    const newEffectiveVolume = baseVolumeCm3 * (1 + newInfillPercent / 100);
    let materialWeightGrams = newEffectiveVolume * newDensity;
    
    // Support structures add extra material (same as NewPrint)
    if (supportType === 'normal') {
      materialWeightGrams *= 1.15; // +15% for normal supports
    } else if (supportType === 'tree') {
      materialWeightGrams *= 1.10; // +10% for tree supports
    }
    
    materialWeightGrams = Math.round(materialWeightGrams);

    // Use custom layer height if set for speed calculation
    const effectiveLayerHeight = customLayerHeight || layerHeight;
    const printSpeedCm3PerHour = PRINT_SPEED_CM3_PER_HOUR[effectiveLayerHeight] || 10;
    let printTimeHours = Math.max(0.25, newEffectiveVolume / printSpeedCm3PerHour);
    
    // Support structures add extra time (same as NewPrint)
    if (supportType === 'normal') {
      printTimeHours *= 1.10; // +10% for normal supports
    } else if (supportType === 'tree') {
      printTimeHours *= 1.05; // +5% for tree supports
    }
    
    // Infill pattern affects print time (same as NewPrint)
    if (infillPattern === 'honeycomb' || infillPattern === 'gyroid') {
      printTimeHours *= 1.05; // +5% for complex patterns
    }
    
    const printTimeMinutes = Math.round(printTimeHours * 60);

    console.log('=== EDIT ORDER: Weight & Time Calculation ===' , {
      material: selectedMaterialType,
      baseVolume: baseVolumeCm3,
      density: newDensity,
      infillPercent: newInfillPercent,
      effectiveVolume: newEffectiveVolume,
      materialWeightGrams,
      printTimeHours,
      printTimeMinutes,
      supportType,
      infillPattern,
      customLayerHeight,
      customInfill
    });

    return { weight: materialWeightGrams, time: printTimeMinutes };
  };

  const calculateNewPrice = () => {
    if (materials.length === 0 || !order || !material || !material.includes('-')) return;

    // Extract material type and color from the selected material key (e.g., "pla-white" -> "pla", "white")
    const parts = material.split('-');
    const selectedMaterialType = parts[0];
    const selectedColor = parts[1];
    
    if (!selectedMaterialType || !selectedColor) {
      console.warn('Invalid material format:', material);
      return;
    }
    
    const materialKey = getMaterialKey(selectedMaterialType, selectedColor);
    const materialData = materials
      .filter(m => m.material_type && m.color) // Filter out invalid materials first
      .find(m => getMaterialKey(m.material_type, m.color) === materialKey);

    if (!materialData) {
      console.warn('Material not found in database:', materialKey);
      return;
    }

    if (!printerSpecs) {
      console.warn('Printer specs not loaded yet');
      return;
    }

    // Get the pure 3D model volume (base volume without infill)
    // This is the same volumeCm3 that NewPrint gets from modelAnalysis
    let baseVolumeCm3: number;
    
    if (order.model_volume_cm3 && order.model_volume_cm3 > 1) {
      // Use stored base volume - EXACT same as NewPrint's modelAnalysis.volumeCm3
      baseVolumeCm3 = order.model_volume_cm3;
    } else if (order.material_weight && order.material && order.layer_height) {
      // Fallback: Try to back-calculate from stored weight if available
      const originalMaterialType = (order.material || '').toLowerCase();
      const originalDensity = MATERIAL_DENSITIES[originalMaterialType] || 1.24;
      const originalLayerHeight = String(order.layer_height || '0.2').replace('mm', '');
      const originalInfillPercent = INFILL_BY_QUALITY[originalLayerHeight] || 20;
      
      // Reverse calculate: weight = effectiveVolume × density
      // effectiveVolume = baseVolume × (1 + infill%)
      // So: baseVolume = weight / (density × (1 + infill%))
      const effectiveVolume = order.material_weight / originalDensity;
      baseVolumeCm3 = effectiveVolume / (1 + originalInfillPercent / 100);
    } else if (order.price && order.material && order.layer_height && order.infill) {
      // Last resort: Back-calculate from price
      const originalMaterialType = (order.material || '').toLowerCase();
      const originalDensity = MATERIAL_DENSITIES[originalMaterialType] || 1.24;
      const originalInfillPercent = order.infill;
      
      // Find the original material price
      const originalMaterialData = materials
        .filter(m => m.material_type && m.color)
        .find(m => getMaterialKey(m.material_type, m.color) === getMaterialKey(order.material, order.color || 'black'));
      const materialPricePerKg = originalMaterialData?.price_per_kg || 39;
      
      // Reverse engineer from price
      const priceWithoutVAT = order.price / 1.23;
      const estimatedMaterialCost = (priceWithoutVAT - 5.23) * 0.5;
      const massKg = estimatedMaterialCost / materialPricePerKg;
      const materialWeightGrams = massKg * 1000;
      const effectiveVolume = materialWeightGrams / originalDensity;
      baseVolumeCm3 = effectiveVolume / (1 + Number(originalInfillPercent) / 100);
      
      console.log('calculateNewPrice: Using back-calculated volume from price:', {
        originalPrice: order.price,
        calculatedVolume: baseVolumeCm3
      });
    } else {
      baseVolumeCm3 = 1; // Use 1cm³ as minimum fallback
    }

    // EXACT CALCULATION - Same as NewPrint.tsx with advanced settings support
    
    // Step 1: Get NEW material density
    const newDensity = MATERIAL_DENSITIES[(selectedMaterialType || '').toLowerCase()] || 1.24;
    
    // Step 2: Get NEW infill percentage (custom or quality-based)
    const newInfillPercent = customInfill ? parseInt(customInfill) : (INFILL_BY_QUALITY[layerHeight] || 20);
    
    // Step 3: Calculate effective volume with infill
    const newEffectiveVolume = baseVolumeCm3 * (1 + newInfillPercent / 100);
    
    // Step 4: Calculate material weight with support multipliers
    let materialWeightGrams = newEffectiveVolume * newDensity;
    
    // Support structures add extra material (same as NewPrint)
    if (supportType === 'normal') {
      materialWeightGrams *= 1.15; // +15% for normal supports
    } else if (supportType === 'tree') {
      materialWeightGrams *= 1.10; // +10% for tree supports
    }

    // Step 5: Calculate print time with custom layer height and multipliers
    const effectiveLayerHeight = customLayerHeight || layerHeight;
    const printSpeedCm3PerHour = PRINT_SPEED_CM3_PER_HOUR[effectiveLayerHeight] || 10;
    let printTimeHours = Math.max(0.25, newEffectiveVolume / printSpeedCm3PerHour);
    
    // Support structures add extra time (same as NewPrint)
    if (supportType === 'normal') {
      printTimeHours *= 1.10; // +10% for normal supports
    } else if (supportType === 'tree') {
      printTimeHours *= 1.05; // +5% for tree supports
    }
    
    // Infill pattern affects print time (same as NewPrint)
    if (infillPattern === 'honeycomb' || infillPattern === 'gyroid') {
      printTimeHours *= 1.05; // +5% for complex patterns
    }
    
    const massKg = materialWeightGrams / 1000;

    // Material cost: Cmaterial = materialPricePerKg * massKg
    const Cmaterial = materialData.price_per_kg * massKg;

    // Energy cost: Cenergy = T * W * Pe
    const W = printerSpecs.power_watts / 1000; // Convert watts to kW
    const Pe = 0.914; // PLN per kWh in Krakow
    const Cenergy = printTimeHours * W * Pe;

    // Labor cost: Clabor = R * L (10 minutes labor time)
    const R = 31.40; // PLN per hour
    const laborTimeMinutes = 10;
    const Clabor = R * (laborTimeMinutes / 60);

    // Depreciation cost: Cdepreciation = (machineCost / lifespanHours) * printTimeHours
    const Cdepreciation = (printerSpecs.cost_pln / printerSpecs.lifespan_hours) * printTimeHours;

    // Maintenance cost: Cmaintenance = Cdepreciation * maintenanceRate
    const Cmaintenance = Cdepreciation * printerSpecs.maintenance_rate;

    // Total internal cost
    const Cinternal = Cmaterial + Cenergy + Clabor + Cdepreciation + Cmaintenance;

    // VAT (23% in Poland)
    const vat = Cinternal * 0.23;

    // Final price before delivery
    const priceWithoutDelivery = Cinternal + vat;

    // Multiply by quantity
    const totalPrice = priceWithoutDelivery * quantity;
    
    console.log('=== EDIT ORDER: Price Calculation ===' , {
      material: `${selectedMaterialType}-${selectedColor}`,
      baseVolume: baseVolumeCm3,
      materialWeightGrams,
      massKg,
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
      infillPattern
    });
    
    setNewPrice(Math.round(totalPrice * 100) / 100);
  };

  const priceDifference = newPrice - originalPrice;

  const handleSave = async () => {
    if (!order) return;

    // If price increased, redirect to payment
    if (priceDifference > 0.01) {
      const [materialType, materialColor] = (material || '').split('-');
      const { weight: newWeight, time: newTime } = calculateNewWeightAndTime();
      
      sessionStorage.setItem('pendingOrderUpdate', JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        updates: {
          material: canEditPrintParams ? materialType : order.material,
          color: canEditPrintParams ? materialColor : order.color,
          layer_height: canEditPrintParams ? layerHeight : order.layer_height,
          infill: canEditPrintParams ? (INFILL_BY_QUALITY[layerHeight] || 20) : order.infill,
          quantity: canEditPrintParams ? quantity : order.quantity,
          shipping_method: canEditShipping ? selectedDeliveryOption : order.shipping_method,
          shipping_address: canEditShipping ? JSON.stringify(selectedDeliveryOption === 'inpost' ? { lockerCode: selectedLocker?.name, lockerAddress: selectedLocker?.address } : shippingAddress) : order.shipping_address,
          price: newPrice,
          material_weight: canEditPrintParams ? newWeight : order.material_weight,
          print_time: canEditPrintParams ? newTime : order.print_time,
          support_type: canEditPrintParams ? supportType : order.support_type,
          infill_pattern: canEditPrintParams ? infillPattern : order.infill_pattern,
          custom_layer_height: canEditPrintParams ? customLayerHeight : order.custom_layer_height,
          custom_infill: canEditPrintParams ? customInfill : order.custom_infill,
        },
        originalPrice,
        newPrice,
        priceDifference,
      }));
      
      navigate('/payment', {
        state: {
          orderId: order.id,
          amount: priceDifference,
          isUpgrade: true,
          orderNumber: order.order_number,
          totalAmount: newPrice,
          previousPrice: originalPrice,
        }
      });
      return;
    }
    
    // If price decreased, redirect to refund page
    if (priceDifference < -0.01) {
      const [materialType, materialColor] = (material || '').split('-');
      const { weight: newWeight, time: newTime } = calculateNewWeightAndTime();
      
      sessionStorage.setItem('pendingOrderUpdate', JSON.stringify({
        orderId: order.id,
        updates: {
          material: canEditPrintParams ? materialType : order.material,
          color: canEditPrintParams ? materialColor : order.color,
          layer_height: canEditPrintParams ? layerHeight : order.layer_height,
          infill: canEditPrintParams ? (INFILL_BY_QUALITY[layerHeight] || 20) : order.infill,
          quantity: canEditPrintParams ? quantity : order.quantity,
          shipping_method: canEditShipping ? selectedDeliveryOption : order.shipping_method,
          shipping_address: canEditShipping ? JSON.stringify(selectedDeliveryOption === 'inpost' ? { lockerCode: selectedLocker?.name, lockerAddress: selectedLocker?.address } : shippingAddress) : order.shipping_address,
          price: newPrice,
          material_weight: canEditPrintParams ? newWeight : order.material_weight,
          print_time: canEditPrintParams ? newTime : order.print_time,
          support_type: canEditPrintParams ? supportType : order.support_type,
          infill_pattern: canEditPrintParams ? infillPattern : order.infill_pattern,
          custom_layer_height: canEditPrintParams ? customLayerHeight : order.custom_layer_height,
          custom_infill: canEditPrintParams ? customInfill : order.custom_infill,
        },
        originalPrice,
        newPrice,
        priceDifference,
      }));
      
      navigate('/refund', {
        state: {
          orderId: order.id,
          orderNumber: order.order_number,
          originalPrice,
          newPrice,
          refundAmount: Math.abs(priceDifference),
          reason: 'order_modification',
        }
      });
      return;
    }

    // Price is the same, save directly
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const updateData: any = {};
      
      if (canEditPrintParams) {
        const [materialType, materialColor] = (material || '').split('-');
        const { weight: newWeight, time: newTime } = calculateNewWeightAndTime();
        
        updateData.material = materialType;
        updateData.color = materialColor;
        updateData.layer_height = layerHeight;
        updateData.infill = INFILL_BY_QUALITY[layerHeight] || 20;
        updateData.quantity = quantity;
        updateData.price = newPrice;
        updateData.material_weight = newWeight;
        updateData.print_time = newTime;
        updateData.support_type = supportType;
        updateData.infill_pattern = infillPattern;
        if (customLayerHeight) {
          updateData.custom_layer_height = parseFloat(customLayerHeight);
        }
        if (customInfill) {
          updateData.custom_infill = parseInt(customInfill);
        }
      }
      
      if (canEditShipping) {
        updateData.shipping_method = selectedDeliveryOption;
        updateData.shipping_address = JSON.stringify(
          selectedDeliveryOption === 'inpost' 
            ? { lockerCode: selectedLocker?.name, lockerAddress: selectedLocker?.address }
            : shippingAddress
        );
      }
      
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      toast.success(t('editOrder.toasts.updateSuccess'));
      navigate(`/orders/${orderId}`);
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error(err instanceof Error ? err.message : t('editOrder.toasts.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;
    
    navigate('/refund', {
      state: {
        orderId: order.id,
        orderNumber: order.order_number,
        originalPrice: order.price,
        newPrice: 0,
        refundAmount: order.price,
        reason: 'cancellation',
      }
    });
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrintTime = (minutes: number | undefined): string => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const estimatedWeight = order && order.model_volume_cm3 && material && material.includes('-') ? (() => {
    const parts = material.split('-');
    const selectedMaterialType = parts[0];
    if (!selectedMaterialType) return null;
    
    const density = MATERIAL_DENSITIES[selectedMaterialType.toLowerCase()] || 1.24;
    const infillPercent = customInfill ? parseInt(customInfill) : (INFILL_BY_QUALITY[layerHeight] || 20);
    const effectiveVolume = order.model_volume_cm3 * (1 + infillPercent / 100);
    let weight = effectiveVolume * density;
    
    if (supportType === 'normal') weight *= 1.15;
    else if (supportType === 'tree') weight *= 1.10;
    
    return weight;
  })() : null;

  const estimatedPrintTime = order && order.model_volume_cm3 ? (() => {
    const infillPercent = customInfill ? parseInt(customInfill) : (INFILL_BY_QUALITY[layerHeight] || 20);
    const effectiveVolume = order.model_volume_cm3 * (1 + infillPercent / 100);
    const effectiveLayerHeight = customLayerHeight || layerHeight;
    const speedCm3PerHour = PRINT_SPEED_CM3_PER_HOUR[effectiveLayerHeight] || 10;
    let printTimeHours = Math.max(0.25, effectiveVolume / speedCm3PerHour);
    
    if (supportType === 'normal') printTimeHours *= 1.10;
    else if (supportType === 'tree') printTimeHours *= 1.05;
    
    if (infillPattern === 'honeycomb' || infillPattern === 'gyroid') printTimeHours *= 1.05;
    
    return Math.round(printTimeHours * 60);
  })() : null;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{t('editOrder.loading')}</span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto text-center py-12">
            <p className="text-destructive text-lg">{error || t('editOrder.notFound')}</p>
            <Button onClick={() => navigate("/orders")} variant="outline" className="mt-4">
              {t('editOrder.backToOrders')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (cannotEdit) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Ban className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">{t('editOrder.cannotEditTitle')}</h2>
                  <p className="text-muted-foreground mb-6">
                    {t('editOrder.cannotEditStatus')} "{order.status}".
                  </p>
                  <Button onClick={() => navigate(`/orders/${orderId}`)}>
                    {t('editOrder.viewOrderDetails')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4 animate-slide-up">
            <Button variant="outline" size="icon" onClick={() => navigate(`/orders/${orderId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-4xl font-bold gradient-text">{t('editOrder.title')}</h1>
              <p className="text-muted-foreground text-lg">Order #{order.order_number || order.id?.slice(0, 8) || 'N/A'} • {formatDate(order.created_at)}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Status Warning for Printing */}
          {order.status === 'printing' && (
            <Card className="border-yellow-500/50 bg-yellow-500/5 animate-scale-in">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">{t('editOrder.limitedEditingTitle')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('editOrder.limitedEditingDescription')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Preview Card (matching NewPrint upload style) */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-card to-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                {t('editOrder.modelPreview')}
              </CardTitle>
              <CardDescription className="text-base">
                {order.file_name || 'Model file'} • {t('editOrder.fileNote')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* File preview styled like NewPrint upload zone */}
              <div className="border-3 border-dashed rounded-2xl p-8 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/30">
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-xl text-primary">{order.file_name || 'Model file'}</p>
                      <p className="text-sm text-muted-foreground">Current order file (cannot be changed)</p>
                    </div>
                  </div>

                  {/* 3D Preview */}
                  <div className="h-64 bg-muted/30 rounded-2xl overflow-hidden border-2 border-primary/10">
                    <ModelViewerUrl 
                      url={order.file_url || ''} 
                      fileName={order.file_name || 'model'}
                      height="100%"
                    />
                  </div>

                  {/* Model Stats (matching NewPrint) */}
                  {order.model_volume_cm3 && (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-card rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground">Volume</p>
                        <p className="text-lg font-bold text-primary">{(order.model_volume_cm3 || 0).toFixed(2)} cm³</p>
                      </div>
                      <div className="p-3 bg-card rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground">Est. Weight</p>
                        <p className="text-lg font-bold text-primary">
                          {estimatedWeight ? `${estimatedWeight.toFixed(1)}g` : '--'}
                        </p>
                        {material && <p className="text-xs text-muted-foreground">{(material || '').split('-')[0]?.toUpperCase()}</p>}
                      </div>
                      <div className="p-3 bg-card rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground">Est. Print Time</p>
                        <p className="text-lg font-bold text-primary">
                          {formatPrintTime(estimatedPrintTime ?? undefined)}
                        </p>
                        {layerHeight && <p className="text-xs text-muted-foreground">{layerHeight}mm layer</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration (matching NewPrint settings) */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-card to-muted/30" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calculator className="w-6 h-6 text-primary" />
                {t('editOrder.printParameters')}
              </CardTitle>
              <CardDescription className="text-base">
                {canEditPrintParams 
                  ? t('editOrder.printParamsDescription') 
                  : t('editOrder.printParamsLocked')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-1 gap-6">
                {/* Material */}
                <div className="space-y-2">
                  <Label htmlFor="material" className="text-base font-semibold">{t('editOrder.material')}</Label>
                  <Select value={material} onValueChange={setMaterial} disabled={!canEditPrintParams || materialsLoading}>
                    <SelectTrigger id="material" className="h-12">
                      <SelectValue placeholder={materialsLoading ? "Loading materials..." : t('editOrder.selectMaterial')} />
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
                                if (!mat.material_type || !mat.color) return null;
                                const materialKey = getMaterialKey(mat.material_type, mat.color);
                                return (
                                  <SelectItem key={mat.id} value={materialKey}>
                                    <span style={{ color: mat.hex_color || '#000000' }}>♥</span> {mat.material_type} - {mat.color}
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

                {/* Quality */}
                <div className="space-y-2">
                  <Label htmlFor="quality" className="text-base font-semibold">{t('editOrder.printQuality')}</Label>
                  <Select value={layerHeight} onValueChange={setLayerHeight} disabled={!canEditPrintParams}>
                    <SelectTrigger id="quality" className="h-12">
                      <SelectValue placeholder={t('editOrder.selectQuality')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.3">⚡ Draft - Fast</SelectItem>
                      <SelectItem value="0.2">✨ Standard</SelectItem>
                      <SelectItem value="0.15">💎 High Quality</SelectItem>
                      <SelectItem value="0.1">🏆 Ultra - Finest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-base font-semibold">{t('editOrder.quantity')}</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min="1"
                    className="h-12 text-lg"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    disabled={!canEditPrintParams}
                  />
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="advanced"
                  checked={showAdvanced}
                  onCheckedChange={(checked) => setShowAdvanced(checked as boolean)}
                  disabled={!canEditPrintParams}
                />
                <Label htmlFor="advanced" className="cursor-pointer">
                  {t('editOrder.showAdvanced')}
                </Label>
              </div>

              {/* Advanced Settings */}
              {showAdvanced && (
                <div className="grid md:grid-cols-2 gap-6 p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="layer-height">Custom Layer Height</Label>
                    <Select value={customLayerHeight || 'default'} onValueChange={(val) => setCustomLayerHeight(val === 'default' ? undefined : val)} disabled={!canEditPrintParams}>
                      <SelectTrigger id="layer-height">
                        <SelectValue placeholder="Use quality default" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Use quality default</SelectItem>
                        <SelectItem value="0.3">0.3mm - Draft (Fast)</SelectItem>
                        <SelectItem value="0.2">0.2mm - Standard</SelectItem>
                        <SelectItem value="0.15">0.15mm - High (Slower)</SelectItem>
                        <SelectItem value="0.1">0.1mm - Ultra (Slowest)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {customLayerHeight ? `Custom: ${customLayerHeight}mm` : 'Using quality preset'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="infill">Custom Infill %</Label>
                    <Select value={customInfill || 'default'} onValueChange={(val) => setCustomInfill(val === 'default' ? undefined : val)} disabled={!canEditPrintParams}>
                      <SelectTrigger id="infill">
                        <SelectValue placeholder="Use quality default" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Use quality default</SelectItem>
                        <SelectItem value="10">10% - Light (Less material)</SelectItem>
                        <SelectItem value="20">20% - Standard</SelectItem>
                        <SelectItem value="30">30% - Strong</SelectItem>
                        <SelectItem value="50">50% - Very Strong</SelectItem>
                        <SelectItem value="100">100% - Solid (Most material)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {customInfill ? `Custom: ${customInfill}%` : 'Using quality preset'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pattern">Infill Pattern</Label>
                    <Select value={infillPattern} onValueChange={(val: any) => setInfillPattern(val)} disabled={!canEditPrintParams}>
                      <SelectTrigger id="pattern">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="honeycomb">Honeycomb (+5% time)</SelectItem>
                        <SelectItem value="triangles">Triangles</SelectItem>
                        <SelectItem value="gyroid">Gyroid (+5% time)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Pattern affects print time but not material cost
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supports">Support Structures</Label>
                    <Select value={supportType} onValueChange={(val: any) => setSupportType(val)} disabled={!canEditPrintParams}>
                      <SelectTrigger id="supports">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="normal">Normal (+15% material, +10% time)</SelectItem>
                        <SelectItem value="tree">Tree (+10% material, +5% time)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {supportType === 'none' && 'No supports - fastest and cheapest'}
                      {supportType === 'normal' && 'Standard supports - more stable but uses more material'}
                      {supportType === 'tree' && 'Tree supports - uses less material than normal'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Options (matching NewPrint) */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-card to-muted/30" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-2xl">{t('editOrder.shippingDetails')}</CardTitle>
              <CardDescription className="text-base">
                {canEditShipping 
                  ? t('editOrder.shippingDescription')
                  : t('editOrder.shippingLocked')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DeliveryOptions
                selectedOption={selectedDeliveryOption}
                onSelectOption={setSelectedDeliveryOption}
                onSelectLocker={() => setShowLockerModal(true)}
                selectedLockerName={selectedLocker?.name}
              />

              {selectedDeliveryOption === 'dpd' && (
                <div className="pt-4 border-t">
                  <Label className="text-base font-semibold mb-4 block">Delivery Address</Label>
                  <DPDAddressForm
                    address={shippingAddress}
                    onChange={setShippingAddress}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Summary (matching NewPrint) */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-card to-muted/30" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calculator className="w-6 h-6 text-primary" />
                {t('editOrder.priceSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price Display */}
              <div className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl border-2 border-primary/30">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-primary/20">
                    <span className="text-muted-foreground">{t('editOrder.originalPrice')}</span>
                    <span className="font-semibold text-lg">{(originalPrice || 0).toFixed(2)} PLN</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-primary/20">
                    <span className="text-muted-foreground">{t('editOrder.newPrice')}</span>
                    <span className="font-semibold text-lg">{(newPrice || 0).toFixed(2)} PLN</span>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">
                        {priceDifference > 0.01 ? t('editOrder.extraPayment') : priceDifference < -0.01 ? t('editOrder.refundAmount') : t('editOrder.difference')}
                      </span>
                      <span className={`text-2xl font-bold ${
                        priceDifference > 0.01 ? 'text-blue-600' : priceDifference < -0.01 ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        {priceDifference > 0 ? '+' : ''}{(priceDifference || 0).toFixed(2)} PLN
                      </span>
                    </div>
                  </div>

                  {/* Delivery cost */}
                  {selectedDeliveryOption && (
                    <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                      <span className="text-muted-foreground">Delivery ({deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.name})</span>
                      <span className="font-semibold text-primary">
                        {(deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.price || 0).toFixed(2)} PLN
                      </span>
                    </div>
                  )}

                  {selectedDeliveryOption && (
                    <div className="border-t-2 border-primary/30 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xl">Total with Delivery</span>
                        <span className="text-3xl font-bold gradient-text">
                          {((newPrice || 0) + (deliveryOptions.find(opt => opt.id === selectedDeliveryOption)?.price || 0)).toFixed(2)} PLN
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={handleSave} 
                  className="h-14 hover-lift shadow-lg group relative overflow-hidden"
                  size="lg"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {t('editOrder.processing')}
                    </>
                  ) : priceDifference > 0.01 ? (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      {t('editOrder.proceedToExtraPayment')}
                    </>
                  ) : priceDifference < -0.01 ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      {t('editOrder.proceedToRefund')}
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      {t('editOrder.saveChanges')}
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/orders/${orderId}`)}
                  className="h-14"
                  size="lg"
                >
                  <X className="w-5 h-5 mr-2" />
                  {t('editOrder.cancel')}
                </Button>
              </div>

              {/* Price Change Notices */}
              {priceDifference > 0.01 && (
                <div className="bg-blue-500/10 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-400 border border-blue-500/30">
                  <strong>{t('editOrder.note')}:</strong> {t('editOrder.extraPaymentNote')} <strong>{(priceDifference || 0).toFixed(2)} PLN</strong>. 
                  {t('editOrder.redirectToPayment')}
                </div>
              )}

              {priceDifference < -0.01 && (
                <div className="bg-green-500/10 p-4 rounded-lg text-sm text-green-700 dark:text-green-400 border border-green-500/30">
                  <strong>{t('editOrder.goodNews')}</strong> {t('editOrder.refundNote')} <strong>{Math.abs(priceDifference || 0).toFixed(2)} PLN</strong>. 
                  {t('editOrder.redirectToRefund')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cancel Order Section */}
          {canEditPrintParams && (
            <Card className="border-destructive/50 animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="text-destructive">{t('editOrder.cancelOrder')}</CardTitle>
                <CardDescription>
                  {t('editOrder.cancelDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelOrder}
                  size="lg"
                  className="w-full"
                >
                  {t('editOrder.cancelAndRefund')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Locker Modal */}
      <LockerPickerModal
        open={showLockerModal}
        onClose={() => setShowLockerModal(false)}
        onSelectLocker={(locker) => {
          setSelectedLocker(locker);
          setShowLockerModal(false);
        }}
      />
    </div>
  );
};

export default EditOrder;
