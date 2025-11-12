import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Building2,
  Bed,
  Bath,
  PoundSterling,
  MapPin,
  ArrowLeft,
  Activity,
  Eye,
  FileText,
  Upload,
  Mail,
  ArrowRight,
  Workflow,
  Pencil,
  Trash2,
  Wrench,
  Handshake,
  AlertTriangle,
  Plus,
  UserCheck,
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import {
  useAvailableTransitions,
  useTransitionStatus,
} from "@/hooks/useWorkflows";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import PropertyPipeline from "@/components/pipeline/PropertyPipeline";
import { useTickets } from "@/hooks/useTickets";
import { useOffers } from "@/hooks/useOffers";
import { Badge } from "@/components/ui/badge";
import NotesSection from "@/components/shared/NotesSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMaintenanceByProperty } from "@/hooks/useMaintenance";
import { MaintenanceIssue } from "@/types";
import EmptyState from "@/components/shared/EmptyState";

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<string | null>(
    null
  );
  const [transitionNotes, setTransitionNotes] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: property, isLoading, refetch } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/properties/${id}/`);
      return response.data;
    },
  });

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.delete(`/api/v1/properties/${id}/`);
      toast({ title: "Success", description: "Property deleted successfully" });
      const backRoute = property?.sales_status && property.sales_status.trim() !== "" && property.vendor_id && !property.landlord_id
        ? "/properties-for-sale"
        : "/properties";
      navigate(backRoute);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const formData = new FormData(e.currentTarget);
    try {
      await api.put(`/api/v1/properties/${id}/`, {
        address_line1: formData.get("address_line1"),
        city: formData.get("city"),
        postcode: formData.get("postcode"),
        property_type: formData.get("property_type"),
        bedrooms: parseInt(formData.get("bedrooms") as string),
        bathrooms: parseInt(formData.get("bathrooms") as string),
        rent: formData.get("rent") ? parseFloat(formData.get("rent") as string) : null,
        asking_price: formData.get("asking_price") ? parseFloat(formData.get("asking_price") as string) : null,
        status: formData.get("status"),
      });
      toast({ title: "Success", description: "Property updated successfully" });
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update property",
        variant: "destructive",
      });
    }
  };

  const { data: availableTransitions } = useAvailableTransitions(
    "property",
    id || ""
  );
  const transitionMutation = useTransitionStatus();

  // Get all tickets to filter by property_id
  const { data: allTickets } = useTickets();
  
  // Filter tickets for this property
  const propertyTickets = allTickets?.filter(
    (ticket) => ticket.property_id === id
  ) || [];

  // Get all offers to filter by property_id
  const { data: allOffers } = useOffers();
  
  // Filter offers for this property
  const propertyOffers = allOffers?.filter(
    (offer) => offer.property_id === id
  ) || [];

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
      managed: "Managed",
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
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              const isForSale = property.sales_status && property.sales_status.trim() !== "" && property.vendor_id && !property.landlord_id;
              navigate(isForSale ? "/properties-for-sale" : "/properties");
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {property.sales_status && property.sales_status.trim() !== "" && property.vendor_id && !property.landlord_id
              ? "Back to Properties for Sale"
              : "Back to Properties for Letting"}
          </Button>
          <div className="flex items-center gap-2">
            <StatusBadge status={property.status} />
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)} className="text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Property Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{property.address || property.address_line1 || property.city}</CardTitle>
                {property.address_line2 && (
                  <p className="text-muted-foreground">{property.address_line2}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {property.city}, {property.postcode}
                  </span>
                </div>
                {(property.landlord || property.vendor) && (
                  <div className="mt-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Owner:{" "}
                      {property.landlord ? (
                        <Link 
                          to={`/landlords/${property.landlord.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {property.landlord.full_name}
                        </Link>
                      ) : property.vendor ? (
                        <Link 
                          to={`/vendors/${property.vendor.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {property.vendor.first_name} {property.vendor.last_name}
                        </Link>
                      ) : null}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {property.rent && (
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-3xl font-bold text-primary">
                      <PoundSterling className="h-8 w-8" />
                      {property.rent.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">per calendar month</p>
                  </div>
                )}
                {property.managed_by === user?.id ? (
                  <Badge className="bg-accent text-white text-sm font-semibold px-2 py-1">
                    <UserCheck className="h-4 w-4 mr-1" />
                    Managed by Me
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                    <UserCheck className="h-4 w-4" />
                    <span className="text-right whitespace-nowrap">
                      Managed by: {property.managed_by_name || "Unassigned"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                    <img
                      src={`https://picsum.photos/seed/building${property.id}/800/450`}
                      alt={property.address || property.address_line1 || property.city}
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

              <div className="flex flex-col gap-6">
                <Card className="flex-shrink">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Details</CardTitle>
                      <Button size="sm" variant="outline" onClick={handleSendEmail}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {property.landlord && (
                        <div className="flex justify-between items-center pb-3 border-b">
                          <span className="text-muted-foreground">Landlord</span>
                          <Link 
                            to={`/landlords/${property.landlord.id}`}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            {property.landlord.full_name}
                            <Eye className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                      {property.vendor && (
                        <div className="flex justify-between items-center pb-3 border-b">
                          <span className="text-muted-foreground">Vendor</span>
                          <Link 
                            to={`/vendors/${property.vendor.id}`}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            {property.vendor.first_name} {property.vendor.last_name}
                            <Eye className="h-3 w-3" />
                          </Link>
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
                      {property.rent && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rent</span>
                          <span className="font-medium">£{property.rent.toLocaleString()}/month</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes Section - matches remaining height to Property Information */}
                <div className="flex-1">
                  <NotesSection
                    entityType="property"
                    entityId={id || ""}
                    initialNotes={property?.management_notes || ""}
                    className="h-full"
                  />
                </div>
              </div>
            </div>

            {/* Tickets Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {propertyTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tickets</p>
                ) : (
                  <div className="space-y-2">
                    {propertyTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => navigate("/tickets")}
                        className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{ticket.title}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {ticket.status.replace("_", " ")}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {ticket.urgency}
                            </Badge>
                          </div>
                        </div>
                        {ticket.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {ticket.description}
                          </p>
                        )}
                        {ticket.ticket_category && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Category: {ticket.ticket_category}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Offers Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Handshake className="h-5 w-5" />
                  Offers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {propertyOffers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No offers</p>
                ) : (
                  <div className="space-y-2">
                    {propertyOffers.map((offer) => (
                      <button
                        key={offer.id}
                        onClick={() => navigate("/offers")}
                        className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">£{offer.offered_rent.toLocaleString()}</span>
                              {offer.applicant_id && (
                                <span className="text-xs text-muted-foreground">
                                  by{" "}
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/applicants/${offer.applicant_id}`);
                                    }}
                                    className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer"
                                  >
                                    {offer.applicant?.name || "Unknown"}
                                  </span>
                                </span>
                              )}
                            </div>
                            {offer.proposed_term_months && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Term: {offer.proposed_term_months} months
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {offer.status}
                          </Badge>
                        </div>
                        {offer.special_conditions && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {offer.special_conditions}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="mt-6">
            <PropertyPipeline propertyId={property.id} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card>
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
                          ? format(new Date(property.created_at), "dd/MM/yyyy")
                          : "Recently"}
                      </p>
                    </div>
                  </div>
                  {property.updated_at &&
                    property.updated_at !== property.created_at && (
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Eye className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Property Updated</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(property.updated_at), "dd/MM/yyyy")}
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
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <Card>
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
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="mt-6">
            <PropertyMaintenanceTab propertyId={id || ""} />
          </TabsContent>
        </Tabs>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="address_line1">Address</Label>
                <Input id="address_line1" name="address_line1" defaultValue={property?.address_line1} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={property?.city} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" name="postcode" defaultValue={property?.postcode} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="property_type">Property Type</Label>
                <Select name="property_type" defaultValue={property?.property_type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="maisonette">Maisonette</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" name="bedrooms" type="number" defaultValue={property?.bedrooms} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" name="bathrooms" type="number" defaultValue={property?.bathrooms} required />
                </div>
              </div>
              {property?.rent !== undefined && (
                <div className="grid gap-2">
                  <Label htmlFor="rent">Monthly Rent (£)</Label>
                  <Input id="rent" name="rent" type="number" step="0.01" defaultValue={property?.rent} />
                </div>
              )}
              {property?.asking_price !== undefined && (
                <div className="grid gap-2">
                  <Label htmlFor="asking_price">Asking Price (£)</Label>
                  <Input id="asking_price" name="asking_price" type="number" step="0.01" defaultValue={property?.asking_price} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the property
              "{property?.address_line1}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Maintenance Tab Component
function PropertyMaintenanceTab({ propertyId }: { propertyId: string }) {
  const { data: maintenance, isLoading } = useMaintenanceByProperty(propertyId);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!maintenance || maintenance.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="No maintenance issues"
        description="No maintenance issues have been reported for this property."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Maintenance Issues ({maintenance.length})</h3>
        <Button asChild size="sm">
          <Link to="/maintenance">
            <Plus className="mr-2 h-4 w-4" />
            New Issue
          </Link>
        </Button>
      </div>
      <div className="grid gap-4">
        {maintenance.map((issue: MaintenanceIssue) => (
          <Card
            key={issue.id}
            className={`transition-shadow hover:shadow-lg ${
              issue.is_emergency ? "border-red-500 border-2" : ""
            } ${issue.is_overdue ? "border-orange-500" : ""}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    <Link
                      to={`/maintenance/${issue.id}`}
                      className="hover:underline"
                    >
                      {issue.title}
                    </Link>
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {issue.description}
                  </p>
                </div>
                {issue.is_emergency && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Emergency
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={issue.status} />
                <StatusBadge status={issue.priority} />
                {issue.is_overdue && (
                  <Badge variant="outline" className="border-orange-500 text-orange-500">
                    Overdue
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Reported:</span>{" "}
                  <span className="font-medium">{formatDate(issue.reported_date)}</span>
                </div>
                {issue.days_open !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Days Open:</span>{" "}
                    <span className="font-medium">{issue.days_open} days</span>
                  </div>
                )}
                {issue.quote_amount && (
                  <div>
                    <span className="text-muted-foreground">Quote:</span>{" "}
                    <span className="font-medium">£{issue.quote_amount.toFixed(2)}</span>
                  </div>
                )}
                {issue.reported_by && (
                  <div>
                    <span className="text-muted-foreground">Reported By:</span>{" "}
                    <span className="font-medium">{issue.reported_by}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/maintenance/${issue.id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
