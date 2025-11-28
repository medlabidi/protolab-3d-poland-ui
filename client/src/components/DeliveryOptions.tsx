import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, Store } from "lucide-react";

export interface DeliveryOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface DeliveryOptionsProps {
  selectedOption: string | null;
  onSelectOption: (optionId: string) => void;
  onSelectLocker?: () => void;
  selectedLockerName?: string;
}

const deliveryOptions: DeliveryOption[] = [
  {
    id: "pickup",
    name: "Local Pickup",
    price: 0,
    description: "Free - Collect from our studio in Krakow",
  },
  {
    id: "inpost",
    name: "InPost Paczkomat",
    price: 12,
    description: "Parcel locker delivery across Poland",
  },
  {
    id: "dpd",
    name: "DPD Courier",
    price: 25,
    description: "Direct courier delivery to your address",
  },
];

export const DeliveryOptions = ({
  selectedOption,
  onSelectOption,
  onSelectLocker,
  selectedLockerName,
}: DeliveryOptionsProps) => {
  return (
    <div className="space-y-3">
      {deliveryOptions.map((option) => (
        <div key={option.id}>
          <div
            className={`flex items-center space-x-3 p-5 border-2 rounded-xl cursor-pointer transition-all hover-lift group ${
              selectedOption === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-primary/5 hover:border-primary/40"
            }`}
            onClick={() => onSelectOption(option.id)}
          >
            <input
              type="radio"
              name="shipping"
              id={option.id}
              checked={selectedOption === option.id}
              onChange={() => onSelectOption(option.id)}
              className="w-5 h-5"
            />
            <Label htmlFor={option.id} className="cursor-pointer flex-1">
              <div className="flex items-center gap-2 mb-1">
                {option.id === "pickup" && <Store className="w-5 h-5 text-primary" />}
                {option.id === "inpost" && <MapPin className="w-5 h-5 text-primary" />}
                {option.id === "dpd" && <Truck className="w-5 h-5 text-primary" />}
                <p className="font-bold text-lg group-hover:text-primary transition-colors">
                  {option.name}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </Label>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                option.price === 0
                  ? "bg-green-500/10 text-green-600"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {option.price === 0 ? "FREE" : `${option.price} PLN`}
            </div>
          </div>

          {/* Show locker selector for InPost */}
          {selectedOption === "inpost" && option.id === "inpost" && (
            <div className="mt-3 ml-8 space-y-3 animate-scale-in">
              <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                  ⏳ Waiting for service integration
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  InPost business registration in progress. Locker selection will be available soon.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSelectLocker}
                  className="w-full"
                  disabled
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {selectedLockerName ? `Selected: ${selectedLockerName}` : "Select Locker (Coming Soon)"}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export { deliveryOptions };
