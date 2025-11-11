import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import PipelineStage, { PipelineStageData } from "./PipelineStage";
import api from "@/lib/api";
import { useAvailableTransitions, useTransitionStatus } from "@/hooks/useWorkflows";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Workflow, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PropertyPipelineProps {
  propertyId: string;
}

export default function PropertyPipeline({ propertyId }: PropertyPipelineProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
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
  // Default to compact for better laptop screen fit
  const [viewMode, setViewMode] = useState<"horizontal" | "vertical" | "compact">("compact");
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-detect view mode based on screen size
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setScreenWidth(window.innerWidth);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-select best view mode based on screen size on initial load only
  useEffect(() => {
    if (!hasInitialized && typeof window !== 'undefined') {
      const width = window.innerWidth;
      // Default to compact for most screen sizes (better fit)
      // Only use horizontal on very wide screens (1920px+)
      if (width >= 1920) {
        setViewMode("horizontal");
      }
      // compact is already the default, no need to set it
      setHasInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleViewModeChange = (mode: "horizontal" | "vertical" | "compact") => {
    setViewMode(mode);
    setHasInitialized(true);
  };

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

  // NOW we can have conditional returns AFTER all hooks
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!property) {
    return <div>Property not found</div>;
  }

  // Screen size breakpoints - calculated after property is loaded
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isLaptop = screenWidth >= 1024 && screenWidth < 1440;
  const isDesktop = screenWidth >= 1440;
  
  // On mobile, always use vertical. On desktop, use user's preference
  const currentView = isMobile ? "vertical" : viewMode;
  const isHorizontal = currentView === "horizontal";
  const isVertical = currentView === "vertical";
  const isCompact = currentView === "compact";

  // Map property status to pipeline stages
  const currentStatus = property.status;
  
  // Ensure all stages are always included - no filtering based on property type
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

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Property Pipeline</h2>
          <p className="text-muted-foreground">
            Track property through the complete lifecycle
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle - hidden on mobile, auto vertical */}
          <div className="hidden md:flex items-center gap-2 border rounded-lg p-1 bg-muted/50">
            <Button
              variant={viewMode === "horizontal" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("horizontal")}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              <span className="text-xs">Horizontal</span>
            </Button>
            <Button
              variant={viewMode === "compact" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("compact")}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1" />
              <span className="text-xs">Compact</span>
            </Button>
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
      </div>

      {/* Vertical View (Mobile/Tablet) */}
      {isVertical && (
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const isExpanded = expandedStage === stage.id;
            return (
              <div
                key={stage.id}
                className="relative"
              >
                {/* Vertical connector line */}
                {index > 0 && (
                  <div className="absolute left-4 top-0 bottom-full w-0.5 bg-border -mb-4" />
                )}
                {/* Completed line */}
                {index > 0 && (stages[index - 1].status === "completed" || stages[index - 1].status === "current") && (
                  <div className="absolute left-4 top-0 bottom-full w-0.5 bg-green-500 -mb-4 z-10" />
                )}
                
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isExpanded ? "ring-2 ring-primary" : ""
                  } ${stage.status === "current" ? "ring-1 ring-blue-500" : ""}`}
                  onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Status icon */}
                      <div className="flex-shrink-0 mt-1">
                        <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${
                          stage.status === "completed" ? "bg-green-500 border-green-600" :
                          stage.status === "current" ? "bg-blue-500 border-blue-600" :
                          stage.status === "blocked" ? "bg-red-500 border-red-600" :
                          "bg-muted border-border"
                        }`}>
                          {stage.status === "completed" ? (
                            <span className="text-white text-sm">✓</span>
                          ) : stage.status === "current" ? (
                            <span className="text-white text-sm">→</span>
                          ) : stage.status === "blocked" ? (
                            <span className="text-white text-sm">!</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">{index + 1}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{stage.name}</h3>
                          <Badge
                            variant={
                              stage.status === "completed" ? "default" :
                              stage.status === "current" ? "secondary" :
                              "outline"
                            }
                            className="text-xs"
                          >
                            {stage.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {stage.description}
                        </p>
                        
                        {/* Expanded content */}
                        {isExpanded && stage.items && stage.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            {stage.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2 text-sm">
                                {item.status === "completed" ? (
                                  <span className="text-green-600">✓</span>
                                ) : (
                                  <span className="text-muted-foreground">○</span>
                                )}
                                <span className={item.status === "completed" ? "line-through text-muted-foreground" : ""}>
                                  {item.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Collapsed preview */}
                        {!isExpanded && stage.items && stage.items.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {stage.items.filter(i => i.status === "completed").length} / {stage.items.length} tasks completed
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Horizontal View (Desktop) - Responsive and adaptive */}
      {isHorizontal && (
        <div className="relative w-full max-w-full">
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto pb-4 pt-4 scroll-smooth scrollbar-thin"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,0,0,0.2) transparent',
            }}
          >
            {/* Responsive grid that fits within viewport */}
            <div 
              className="grid gap-2 md:gap-3 lg:gap-4"
              style={{
                gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`,
                width: '100%',
                maxWidth: '100%'
              }}
            >
              {stages.map((stage, index) => {
                const nextStage = index < stages.length - 1 ? stages[index + 1] : null;
                const shouldShowNextCompletedLine =
                  stage.status === "completed" || stage.status === "current";

                return (
                  <div key={stage.id} className="relative flex flex-col items-center min-w-0">
                    {/* Stage container */}
                    <div className="w-full flex flex-col items-center">
                      <PipelineStage
                        stage={stage}
                        isFirst={index === 0}
                        isLast={index === stages.length - 1}
                        index={index}
                        isCompact={false}
                        isHorizontal={true}
                      />
                    </div>
                    
                    {/* Connecting line between stages - positioned between columns */}
                    {nextStage && (
                      <div 
                        className="absolute -right-2 md:-right-3 lg:-right-4 top-5 h-0.5 w-4 md:w-6 lg:w-8 z-0 pointer-events-none"
                      >
                        <div className="w-full h-full bg-border/50 dark:bg-border/30" />
                        {shouldShowNextCompletedLine && (
                          <div className="absolute inset-0 h-full bg-green-500 dark:bg-green-600 rounded-full" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Compact View (Desktop Grid) - Adaptive columns */}
      {isCompact && (
        <div className="w-full">
          <div className={cn(
            "grid gap-4",
            // Responsive grid: 2 columns on tablet, 3 on laptop, up to 6 on very wide screens
            "grid-cols-1",
            "sm:grid-cols-2",
            "lg:grid-cols-3",
            "xl:grid-cols-3",
            isDesktop && stages.length <= 6 && "2xl:grid-cols-6" // All 6 stages in one row on very wide screens
          )}>
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex flex-col items-stretch min-h-0">
                <PipelineStage
                  stage={stage}
                  isFirst={index === 0}
                  isLast={index === stages.length - 1}
                  index={index}
                  isCompact={true}
                  isHorizontal={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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

