import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatus } from "./StatusBadge";

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

const steps: { status: OrderStatus; label: string }[] = [
  { status: "submitted", label: "Submitted" },
  { status: "in_queue", label: "In Queue" },
  { status: "printing", label: "Printing" },
  { status: "finished", label: "Finished" },
  { status: "delivered", label: "Delivered" },
];

const statusOrder: Record<OrderStatus, number> = {
  submitted: 0,
  in_queue: 1,
  printing: 2,
  finished: 3,
  delivered: 4,
  on_hold: 2,
  suspended: -1,
};

export const OrderTimeline = ({ currentStatus }: OrderTimelineProps) => {
  const currentIndex = statusOrder[currentStatus];

  return (
    <div className="py-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.status} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isCompleted
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 transition-colors",
                      index < currentIndex ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
