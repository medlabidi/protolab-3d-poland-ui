import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type OrderStatus = "submitted" | "in_queue" | "printing" | "finished" | "delivered";

interface StatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  submitted: {
    label: "Submitted",
    className: "bg-status-new text-white hover:bg-status-new/90",
  },
  in_queue: {
    label: "In Queue",
    className: "bg-status-queue text-white hover:bg-status-queue/90",
  },
  printing: {
    label: "Printing",
    className: "bg-status-printing text-white hover:bg-status-printing/90",
  },
  finished: {
    label: "Finished",
    className: "bg-status-finished text-white hover:bg-status-finished/90",
  },
  delivered: {
    label: "Delivered",
    className: "bg-status-delivered text-white hover:bg-status-delivered/90",
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.submitted;
  
  return (
    <Badge className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
};
