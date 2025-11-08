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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Property Pipeline</h2>
          <p className="text-muted-foreground">
            Track property through the complete lifecycle
          </p>
        </div>
        {availableTransitions &&
          availableTransitions.available_transitions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableTransitions.available_transitions.map((transition) => (
                <Button
                  key={transition}
                  size="sm"
                  variant="outline"
                  onClick={() => handleTransition(transition)}
                  className="text-xs sm:text-sm"
                >
                  <Workflow className="mr-2 h-4 w-4" />
                  Move to {getStatusLabel(transition)}
                </Button>
              ))}
            </div>
          )}
      </div>

      <div className="relative w-full max-w-full">
        <div className="overflow-x-auto pb-4 pt-4 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.2) transparent' }}>
          <style>{`
            .pipeline-scroll::-webkit-scrollbar {
              height: 6px;
            }
            .pipeline-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .pipeline-scroll::-webkit-scrollbar-thumb {
              background: rgba(0,0,0,0.2);
              border-radius: 3px;
            }
            .pipeline-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(0,0,0,0.3);
            }
            .dark .pipeline-scroll::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.2);
            }
            .dark .pipeline-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(255,255,255,0.3);
            }
          `}</style>
          <div className="pipeline-scroll relative flex gap-1.5 min-w-max px-1 sm:gap-2 sm:px-2">
            {stages.map((stage, index) => {
              const prevStage = index > 0 ? stages[index - 1] : null;
              const shouldShowCompletedLine = prevStage && (prevStage.status === "completed" || prevStage.status === "current");
              
              // Ultra compact widths - reduced significantly to fit on screen
              const stageWidth = "w-[140px] sm:w-[150px] md:w-[155px]";
              
              return (
                <div key={stage.id} className={`relative flex-shrink-0 ${stageWidth}`}>
                  {/* Connecting line - only show on larger screens */}
                  {index > 0 && (
                    <>
                      {/* Base connecting line - icon is now h-8 w-8 (32px), so center is at 16px from top */}
                      <div
                        className="absolute top-4 h-0.5 bg-border z-0 hidden sm:block"
                        style={{
                          left: '-77.5px', // Adjusted for 155px width: -77.5px (half of prev) - 8px (gap-2)
                          width: '155px' // Spans from prev center to current center
                        }}
                      />
                      {/* Completed/current line overlay (green) */}
                      {shouldShowCompletedLine && (
                        <div
                          className="absolute top-4 h-0.5 bg-green-500 z-[1] hidden sm:block"
                          style={{
                            left: '-77.5px',
                            width: '155px'
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

