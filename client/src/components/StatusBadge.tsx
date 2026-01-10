import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type OrderStatus = "submitted" | "in_queue" | "printing" | "finished" | "delivered" | "on_hold" | "suspended";
export type PaymentStatus = "paid" | "pending" | "on_hold" | "failed" | "refunding" | "refunded";

interface StatusBadgeProps {
  status: OrderStatus;
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  amount?: number;
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
  on_hold: {
    label: "On Hold",
    className: "bg-amber-500 text-white hover:bg-amber-500/90",
  },
  suspended: {
    label: "Suspended",
    className: "bg-red-500 text-white hover:bg-red-500/90",
  },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  paid: {
    label: "Paid",
    className: "bg-green-600 text-white hover:bg-green-600/90",
  },
  pending: {
    label: "Pending",
    className: "bg-blue-500 text-white hover:bg-blue-500/90",
  },
  on_hold: {
    label: "On Hold",
    className: "bg-amber-500 text-white hover:bg-amber-500/90",
  },
  failed: {
    label: "Failed",
    className: "bg-red-600 text-white hover:bg-red-600/90",
  },
  refunding: {
    label: "Refunding",
    className: "bg-orange-500 text-white hover:bg-orange-500/90",
  },
  refunded: {
    label: "Refunded",
    className: "bg-gray-500 text-white hover:bg-gray-500/90",
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

export const PaymentStatusBadge = ({ status, amount }: PaymentStatusBadgeProps) => {
  const config = paymentStatusConfig[status] || paymentStatusConfig.paid;
  
  return (
    <Badge className={cn("font-medium", config.className)}>
      {config.label}
      {amount != null && status === 'paid' && ` (${amount.toFixed(2)} PLN)`}
    </Badge>
  );
};
