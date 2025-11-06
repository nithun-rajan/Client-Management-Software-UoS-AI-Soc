import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-status-available text-white" },
  let_agreed: { label: "Let Agreed", className: "bg-status-active text-white" },
  let_by: { label: "Let By", className: "bg-status-active text-white" },
  tenanted: { label: "Tenanted", className: "bg-secondary text-white" },
  under_offer: { label: "Under Offer", className: "bg-status-pending text-white" },
  blocked: { label: "Blocked", className: "bg-status-inactive text-white" },
  maintenance: { label: "Maintenance", className: "bg-status-urgent text-white" },
  new: { label: "New", className: "bg-status-available text-white" },
  qualified: { label: "Qualified", className: "bg-status-active text-white" },
  viewing_booked: {
    label: "Viewing Booked",
    className: "bg-status-pending text-white",
  },
  offer_submitted: {
    label: "Offer Submitted",
    className: "bg-status-pending text-white",
  },
  offer_accepted: {
    label: "Offer Accepted",
    className: "bg-status-available text-white",
  },
  references: { label: "References", className: "bg-status-pending text-white" },
  tenancy_started: { label: "Tenancy Started", className: "bg-secondary text-white" },
  archived: { label: "Archived", className: "bg-status-inactive text-white" },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-muted" };

  return <Badge className={cn(config.className, className)}>{config.label}</Badge>;
}
