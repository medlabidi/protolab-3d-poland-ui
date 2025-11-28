import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
}

interface DPDAddressFormProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
}

export const DPDAddressForm = ({ address, onChange }: DPDAddressFormProps) => {
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const accessToken = localStorage.getItem('accessToken');
      
      if (!isLoggedIn || !accessToken) return;

      // Only fetch if address is empty
      if (address.fullName || address.phone || address.street) return;

      try {
        setIsLoading(true);
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          
          // Auto-populate address fields from user profile
          onChange({
            fullName: userData.name || userData.fullName || '',
            phone: userData.phone || '',
            street: userData.address?.street || userData.street || '',
            city: userData.address?.city || userData.city || '',
            postalCode: userData.address?.postalCode || userData.postalCode || '',
          });
        }
      } catch (error) {
        console.log('Could not fetch user data:', error);
        // Silently fail - user can still enter manually
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const validateField = (field: keyof ShippingAddress, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "fullName":
        if (!value.trim()) {
          newErrors.fullName = "Full name is required";
        } else {
          delete newErrors.fullName;
        }
        break;
      case "phone":
        if (!value.trim()) {
          newErrors.phone = "Phone number is required";
        } else if (!/^[+]?[\d\s()-]{9,}$/.test(value)) {
          newErrors.phone = "Invalid phone number";
        } else {
          delete newErrors.phone;
        }
        break;
      case "street":
        if (!value.trim()) {
          newErrors.street = "Street address is required";
        } else {
          delete newErrors.street;
        }
        break;
      case "city":
        if (!value.trim()) {
          newErrors.city = "City is required";
        } else {
          delete newErrors.city;
        }
        break;
      case "postalCode":
        if (!value.trim()) {
          newErrors.postalCode = "Postal code is required";
        } else if (!/^\d{2}-?\d{3}$/.test(value)) {
          newErrors.postalCode = "Invalid postal code (use format: 12-345)";
        } else {
          delete newErrors.postalCode;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (field: keyof ShippingAddress, value: string) => {
    onChange({ ...address, [field]: value });
    validateField(field, value);
  };

  return (
    <div className="space-y-4 p-4 bg-muted rounded-lg">
      {isLoading && (
        <div className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
          <span className="animate-spin">⏳</span>
          Loading your saved address...
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="fullName">
          Full Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fullName"
          value={address.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          onBlur={(e) => validateField("fullName", e.target.value)}
          placeholder="Jan Kowalski"
          className={errors.fullName ? "border-destructive" : ""}
        />
        {errors.fullName && (
          <p className="text-xs text-destructive">{errors.fullName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          value={address.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          onBlur={(e) => validateField("phone", e.target.value)}
          placeholder="+48 123 456 789"
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="street">
          Street Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="street"
          value={address.street}
          onChange={(e) => handleChange("street", e.target.value)}
          onBlur={(e) => validateField("street", e.target.value)}
          placeholder="ul. Floriańska 1/23"
          className={errors.street ? "border-destructive" : ""}
        />
        {errors.street && (
          <p className="text-xs text-destructive">{errors.street}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            value={address.city}
            onChange={(e) => handleChange("city", e.target.value)}
            onBlur={(e) => validateField("city", e.target.value)}
            placeholder="Kraków"
            className={errors.city ? "border-destructive" : ""}
          />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">
            Postal Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="postalCode"
            value={address.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            onBlur={(e) => validateField("postalCode", e.target.value)}
            placeholder="31-001"
            className={errors.postalCode ? "border-destructive" : ""}
          />
          {errors.postalCode && (
            <p className="text-xs text-destructive">{errors.postalCode}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const isAddressValid = (address: ShippingAddress): boolean => {
  return Boolean(
    address.fullName.trim() &&
    address.phone.trim() &&
    /^[+]?[\d\s()-]{9,}$/.test(address.phone) &&
    address.street.trim() &&
    address.city.trim() &&
    address.postalCode.trim() &&
    /^\d{2}-?\d{3}$/.test(address.postalCode)
  );
};
