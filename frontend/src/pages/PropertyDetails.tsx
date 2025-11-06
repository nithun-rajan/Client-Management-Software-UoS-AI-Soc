import { useParams, useNavigate } from "react-router-dom";
import {
  Building2,
  Bed,
  Bath,
  PoundSterling,
  MapPin,
  ArrowLeft,
  Activity,
  Eye,
  Pencil,
  FileText,
  Upload,
  Mail,
  ArrowRight,
  Workflow,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import {
  useAvailableTransitions,
  useTransitionStatus,
} from "@/hooks/useWorkflows";
import { useState } from "react";

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<string | null>(
    null
  );
  const [transitionNotes, setTransitionNotes] = useState("");

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/properties/${id}/`);
      return response.data;
    },
  });

  const { data: availableTransitions } = useAvailableTransitions(
    "property",
    id || ""
  );
  const transitionMutation = useTransitionStatus();

  const handleSendEmail = () => {
    console.log("📧 Sending email for property:", property?.id);
    toast({
      title: "Email Sent",
      description: `Property details sent to interested parties`,
    });
  };

  const handleTransition = (newStatus: string) => {
    setSelectedTransition(newStatus);
    setTransitionDialogOpen(true);
  };

  const confirmTransition = () => {
    if (!selectedTransition || !id) return;

    transitionMutation.mutate({
      domain: "property",
      entityId: id,
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
      withdrawn: "Withdrawn",
      maintenance: "Maintenance",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Property Details" />
        <div className="p-6">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div>
        <Header title="Property Details" />
        <div className="p-6">
          <div className="py-12 text-center">
            <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Property not found</h3>
            <Button onClick={() => navigate("/properties")}>Back to Properties</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Property Details" />
      <div className="space-y-6 p-6">
        <Button variant="outline" onClick={() => navigate("/properties")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Button>
        <Button onClick={handleSendEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Send Details
        </Button>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{property.address_line1}</CardTitle>
                  {property.address_line2 && (
                    <p className="text-muted-foreground">{property.address_line2}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {property.city}, {property.postcode}
                    </span>
                  </div>
                </div>
                <StatusBadge status={property.status} />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                {/* <img 
                  src={`https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=450&fit=crop&crop=entropy&auto=format&q=75`}
                  alt={property.address_line1}
                  className="w-full h-full object-cover"
                /> */}
                {/* sorry but i have to do this */}
                <img
                  src={`https://picsum.photos/seed/building${property.id}/800/450`}
                  alt={property.address_line1}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-muted p-4 text-center">
                  <Bed className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <div className="text-2xl font-bold">{property.bedrooms}</div>
                  <div className="text-sm text-muted-foreground">Bedrooms</div>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <Bath className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <div className="text-2xl font-bold">{property.bathrooms}</div>
                  <div className="text-sm text-muted-foreground">Bathrooms</div>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <Building2 className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <div className="text-sm font-medium capitalize">
                    {property.property_type}
                  </div>
                  <div className="text-sm text-muted-foreground">Type</div>
                </div>
              </div>

              {property.description && (
                <div>
                  <h3 className="mb-2 font-semibold">Description</h3>
                  <p className="text-muted-foreground">{property.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                {property.rent ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-3xl font-bold text-primary">
                      <PoundSterling className="h-8 w-8" />
                      {property.rent.toLocaleString()}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      per calendar month
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    Price on application
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">
                    {property.status.replace("_", " ")}
                  </span>
                </div>
                {/* Workflow Transitions */}
                {availableTransitions &&
                  availableTransitions.available_transitions.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Workflow className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Actions
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableTransitions.available_transitions.map(
                          (transition) => (
                            <Button
                              key={transition}
                              size="sm"
                              variant="outline"
                              onClick={() => handleTransition(transition)}
                              className="h-7 px-2 text-xs"
                            >
                              <ArrowRight className="mr-1 h-2.5 w-2.5" />
                              {getStatusLabel(transition)}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Type</span>
                  <span className="font-medium capitalize">
                    {property.property_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bedrooms</span>
                  <span className="font-medium">{property.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bathrooms</span>
                  <span className="font-medium">{property.bathrooms}</span>
                </div>
                {/* maybe here???? cuz it kinda makes sense to be here; Activity Timeline */}
              </CardContent>
            </Card>
            {/* Activity Timeline */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                      <Building2 className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Property Created</p>
                      <p className="text-sm text-muted-foreground">
                        {property.created_at
                          ? new Date(property.created_at).toLocaleDateString()
                          : "Recently"}
                      </p>
                    </div>
                  </div>
                  {property.updated_at &&
                    property.updated_at !== property.created_at && (
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Pencil className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Property Updated</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(property.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <Eye className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Viewed Just Now</p>
                      <p className="text-sm text-muted-foreground">
                        You are viewing this property
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Documents Section */}
            <Card className="md:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                  </CardTitle>
                  <Button size="sm" variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Energy Performance Certificate
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valid until Dec 2025
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-green-100">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Gas Safety Certificate</p>
                        <p className="text-xs text-muted-foreground">
                          Valid until Jan 2026
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    + Add more documents
                  </div>
                </div>
              </CardContent>
            </Card>
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
              <strong>{getStatusLabel(property?.status || "")}</strong> to{" "}
              <strong>
                {selectedTransition
                  ? getStatusLabel(selectedTransition)
                  : ""}
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
              availableTransitions.side_effects[selectedTransition].length >
                0 && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium mb-2">
                    Automated actions that will run:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
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
