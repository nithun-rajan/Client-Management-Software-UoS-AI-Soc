import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import PipelineStage, { PipelineStageData } from "./PipelineStage";
import api from "@/lib/api";
import { useAvailableTransitions, useTransitionStatus } from "@/hooks/useWorkflows";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Workflow } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PropertyPipelineProps {
  propertyId: string;
}

export default function PropertyPipeline({ propertyId }: PropertyPipelineProps) {
  const { data: property, isLoading } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/properties/${propertyId}/`);
      return response.data;
    },
  });

  // Pipeline history can be added later for testing
  // const { data: pipelineHistory } = useQuery({
  //   queryKey: ["pipeline", "property", propertyId, "history"],
  //   queryFn: async () => {
  //     const response = await api.get(`/api/v1/workflows/${propertyId}/history`);
  //     return response.data;
  //   },
  //   enabled: !!propertyId,
  // });

  const { data: availableTransitions } = useAvailableTransitions(
    "property",
    propertyId
  );
  const transitionMutation = useTransitionStatus();

  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<string | null>(null);
  const [transitionNotes, setTransitionNotes] = useState("");

  const handleTransition = (newStatus: string) => {
    setSelectedTransition(newStatus);
    setTransitionDialogOpen(true);
  };

  const confirmTransition = () => {
    if (!selectedTransition || !propertyId) return;

    transitionMutation.mutate({
      domain: "property",
      entityId: propertyId,
      new_status: selectedTransition,
      notes: transitionNotes || undefined,
    });

    setTransitionDialogOpen(false);
    setSelectedTransition(null);
    setTransitionNotes("");
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: "Available",
      under_offer: "Under Offer",
      let_agreed: "Let Agreed",
      tenanted: "Tenanted",
      managed: "Managed",
      withdrawn: "Withdrawn",
      maintenance: "Maintenance",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!property) {
    return <div>Property not found</div>;
  }

  // Map property status to pipeline stages
  const currentStatus = property.status;
  const stages: PipelineStageData[] = [
    {
      id: "available",
      name: "Property Listing",
      description: "Property listed on portals",
      status:
        currentStatus === "available"
          ? "current"
          : ["under_offer", "let_agreed", "tenanted", "managed"].includes(
              currentStatus
            )
          ? "completed"
          : "pending",
      date: property.listed_date,
      items: [
        { id: "portal_listing", name: "Listed on Rightmove/Zoopla", status: "completed" },
        { id: "marketing", name: "Marketing materials ready", status: "completed" },
      ],
    },
    {
      id: "under_offer",
      name: "Applicant Matching",
      description: "Viewings and offers received",
      status:
        currentStatus === "under_offer"
          ? "current"
          : ["let_agreed", "tenanted", "managed"].includes(currentStatus)
          ? "completed"
          : currentStatus === "available"
          ? "pending"
          : "blocked",
      items: [
        { id: "viewings", name: "Viewings scheduled", status: currentStatus !== "available" ? "completed" : "pending" },
        { id: "offers", name: "Offers received", status: ["under_offer", "let_agreed", "tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
      ],
    },
    {
      id: "let_agreed",
      name: "Offer Accepted",
      description: "Offer accepted, let agreed",
      status:
        currentStatus === "let_agreed"
          ? "current"
          : ["tenanted", "managed"].includes(currentStatus)
          ? "completed"
          : ["available", "under_offer"].includes(currentStatus)
          ? "pending"
          : "blocked",
      date: property.let_agreed_date,
      items: [
        { id: "deposit", name: "Holding deposit collected", status: ["let_agreed", "tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
        { id: "portal_update", name: "Removed from portals", status: ["let_agreed", "tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
        { id: "confirmation", name: "Offer confirmation sent", status: ["let_agreed", "tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
      ],
    },
    {
      id: "tenancy_setup",
      name: "Tenancy Setup",
      description: "Referencing and legal documents",
      status:
        currentStatus === "tenanted" || currentStatus === "managed"
          ? "completed"
          : currentStatus === "let_agreed"
          ? "current"
          : "pending",
      items: [
        { id: "referencing", name: "Referencing complete", status: ["tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
        { id: "right_to_rent", name: "Right to Rent check", status: ["tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
        { id: "legal_docs", name: "Legal documents signed", status: ["tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
        { id: "deposit_reg", name: "Deposit registered", status: ["tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
      ],
    },
    {
      id: "move_in",
      name: "Move-In",
      description: "Tenancy activated",
      status:
        currentStatus === "tenanted" || currentStatus === "managed"
          ? "completed"
          : "pending",
      date: property.let_date,
      items: [
        { id: "monies", name: "Move-in monies received", status: ["tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
        { id: "inventory", name: "Inventory completed", status: ["tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
        { id: "keys", name: "Keys handed over", status: ["tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
      ],
    },
    {
      id: "active_management",
      name: "Active Management",
      description: "Ongoing tenancy management",
      status:
        currentStatus === "managed"
          ? "current"
          : currentStatus === "tenanted"
          ? "current"
          : "pending",
      items: [
        { id: "rent", name: "Rent collection", status: ["tenanted", "managed"].includes(currentStatus) ? "completed" : "pending" },
        { id: "maintenance", name: "Maintenance requests", status: "pending" },
        { id: "inspections", name: "Property inspections", status: "pending" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Property Pipeline</h2>
          <p className="text-muted-foreground">
            Track property through the complete lifecycle
          </p>
        </div>
        {availableTransitions &&
          availableTransitions.available_transitions.length > 0 && (
            <div className="flex gap-2">
              {availableTransitions.available_transitions.map((transition) => (
                <Button
                  key={transition}
                  size="sm"
                  variant="outline"
                  onClick={() => handleTransition(transition)}
                >
                  <Workflow className="mr-2 h-4 w-4" />
                  Move to {getStatusLabel(transition)}
                </Button>
              ))}
            </div>
          )}
      </div>

      <div className="relative overflow-x-auto pb-8 pt-8">
        <div className="relative flex gap-8 min-w-max px-8">
          {stages.map((stage, index) => {
            const prevStage = index > 0 ? stages[index - 1] : null;
            const shouldShowCompletedLine = prevStage && (prevStage.status === "completed" || prevStage.status === "current");
            
            return (
              <div key={stage.id} className="relative flex-shrink-0 w-[280px]">
                {/* Connecting line - spans the gap between icons
                    Icon centers are at 140px from left of each 280px container
                    Gap is 32px (gap-8)
                    Line spans: 140px (to prev icon center) + 32px (gap) + 140px (from current icon center) = 312px */}
                {index > 0 && (
                  <>
                    {/* Base connecting line */}
                    <div
                      className="absolute top-6 h-0.5 bg-border z-0"
                      style={{
                        left: '-172px', // Positioned to connect icon centers: -140px (to prev center) - 32px (gap)
                        width: '312px' // Spans from previous icon center to current icon center
                      }}
                    />
                    {/* Completed/current line overlay (green) */}
                    {shouldShowCompletedLine && (
                      <div
                        className="absolute top-6 h-0.5 bg-green-500 z-[1]"
                        style={{
                          left: '-172px',
                          width: '312px'
                        }}
                      />
                    )}
                  </>
                )}
                <PipelineStage
                  stage={stage}
                  isFirst={index === 0}
                  isLast={index === stages.length - 1}
                  index={index}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Transition Dialog */}
      <Dialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Property Status</DialogTitle>
            <DialogDescription>
              Transition property from{" "}
              <strong>{getStatusLabel(property.status)}</strong> to{" "}
              <strong>
                {selectedTransition ? getStatusLabel(selectedTransition) : ""}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status change..."
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                rows={3}
              />
            </div>
            {selectedTransition &&
              availableTransitions?.side_effects[selectedTransition] &&
              availableTransitions.side_effects[selectedTransition].length > 0 && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="mb-2 text-sm font-medium">
                    Automated actions that will run:
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {availableTransitions.side_effects[selectedTransition].map(
                      (effect, idx) => (
                        <li key={idx}>• {effect.replace(/_/g, " ")}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransitionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmTransition}
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

