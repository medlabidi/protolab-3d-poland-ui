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

          {/* Show lab address and map for Local Pickup */}
          {selectedOption === "pickup" && option.id === "pickup" && (
            <div className="mt-3 ml-8 space-y-3 animate-scale-in">
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Pickup Location
                </p>
                <p className="text-base font-semibold text-green-900 mt-2">
                  Zielonogórska 13
                </p>
                <p className="text-sm text-green-800">
                  30-406 Kraków, Poland
                </p>
                <p className="text-xs text-green-700 mt-2">
                  Mon-Fri: 9:00 - 17:00 | Sat: 10:00 - 14:00
                </p>
              </div>
              <div className="rounded-lg overflow-hidden border-2 border-primary/20">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2562.4!2d19.9367!3d50.0467!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47165b0a3d7c2c8f%3A0x0!2sZielonogórska%2013%2C%2030-406%20Kraków!5e0!3m2!1sen!2spl!4v1701234567890!5m2!1sen!2spl"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="ProtoLab Location"
                ></iframe>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Zielonogórska+13,+30-406+Kraków,+Poland"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Open in Google Maps
                </Button>
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export { deliveryOptions };
