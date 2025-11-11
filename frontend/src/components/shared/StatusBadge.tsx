import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Property statuses
  available: { label: "Available", className: "bg-status-available text-white" },
  let_agreed: { label: "Let Agreed", className: "bg-status-active text-white" },
  let_by: { label: "Let By", className: "bg-status-active text-white" },
  tenanted: { label: "Tenanted", className: "bg-secondary text-white" },
  under_offer: { label: "Under Offer", className: "bg-status-pending text-white" },
  blocked: { label: "Blocked", className: "bg-status-inactive text-white" },
  maintenance: { label: "Maintenance", className: "bg-status-urgent text-white" },
  // Applicant statuses
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
  // Vendor statuses
  instructed: { label: "Instructed", className: "bg-status-active text-white" },
  active: { label: "Active", className: "bg-status-available text-white" },
  sold: { label: "Sold", className: "bg-secondary text-white" },
  withdrawn: { label: "Withdrawn", className: "bg-status-inactive text-white" },
  lost: { label: "Lost", className: "bg-status-urgent text-white" },
<<<<<<< HEAD
=======
  // Maintenance statuses
  reported: { label: "Reported", className: "bg-status-available text-white" },
  acknowledged: { label: "Acknowledged", className: "bg-status-pending text-white" },
  inspected: { label: "Inspected", className: "bg-status-pending text-white" },
  quoted: { label: "Quoted", className: "bg-status-pending text-white" },
  approved: { label: "Approved", className: "bg-status-active text-white" },
  in_progress: { label: "In Progress", className: "bg-status-active text-white" },
  completed: { label: "Completed", className: "bg-secondary text-white" },
  closed: { label: "Closed", className: "bg-status-inactive text-white" },
  cancelled: { label: "Cancelled", className: "bg-status-inactive text-white" },
  // Maintenance priorities
  low: { label: "Low", className: "bg-blue-500 text-white" },
  medium: { label: "Medium", className: "bg-yellow-500 text-white" },
  high: { label: "High", className: "bg-orange-500 text-white" },
  urgent: { label: "Urgent", className: "bg-status-urgent text-white" },
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-muted" };

  return <Badge className={cn(config.className, className)}>{config.label}</Badge>;
}
