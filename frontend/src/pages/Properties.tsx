import {
  Building2,
  Bed,
  Bath,
  Eye,
  Pencil,
  Trash2,
  PoundSterling,
  Download,
  Upload,
  Search,
  X,
  Sparkles,
  FileText,
  CheckCircle,
  AlertCircle,
  User,
  UserCheck,
  TrendingUp,
  Brain,
  Lightbulb,
  BarChart,
  Users,
  Mail,
  Send,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { getFlatOrUnitNumber } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useMyTeamAgents } from "@/hooks/useAgents";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useApplicantMatching, useSendPropertyToApplicants, type MatchedApplicant } from "@/hooks/useApplicantMatching";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Properties() {
  const { data: properties, isLoading, refetch } = useProperties();
  const { user } = useAuth();
  const { data: teamAgents } = useMyTeamAgents();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [valuationPackOpen, setValuationPackOpen] = useState(false);
  const [valuationPack, setValuationPack] = useState<any>(null);
  const [generatingPack, setGeneratingPack] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading property data...");
  const [activeTab, setActiveTab] = useState("all");
  const [managedByMe, setManagedByMe] = useState(false);
  const [managedByMyTeam, setManagedByMyTeam] = useState(false);
  
  // Applicant matching state
  const [matchingDialogOpen, setMatchingDialogOpen] = useState(false);
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [sendingToApplicants, setSendingToApplicants] = useState(false);
  const applicantMatchingMutation = useApplicantMatching(50, 50);
  const sendPropertyMutation = useSendPropertyToApplicants();

  // Animated loading messages
  useEffect(() => {
    if (!generatingPack) return;

    const messages = [
      "Loading property data...",
      "Fetching market information...",
      "Thinking...",
      "Analyzing property characteristics...",
      "Comparing with similar properties...",
      "Evaluating location factors...",
      "Calculating optimal price...",
      "Generating recommendations...",
      "Almost done...",
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setLoadingMessage(messages[currentIndex]);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [generatingPack]);

  const handleEdit = (property: any) => {
    setSelectedProperty(property);
    setEditOpen(true);
  };

  const handleDelete = (property: any) => {
    setSelectedProperty(property);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/v1/properties/${selectedProperty.id}/`);
      toast({ title: "Success", description: "Property deleted successfully" });
      setDeleteOpen(false);
      refetch();
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
    const formData = new FormData(e.currentTarget);
    try {
      await api.put(`/api/v1/properties/${selectedProperty.id}/`, {
        address_line1: formData.get("address"),
        city: formData.get("city"),
        postcode: formData.get("postcode"),
        property_type: formData.get("property_type"),
        bedrooms: parseInt(formData.get("bedrooms") as string),
        bathrooms: parseInt(formData.get("bathrooms") as string),
        rent: parseFloat(formData.get("rent") as string),
        status: formData.get("status"),
      });
      toast({ title: "Success", description: "Property updated successfully" });
      setEditOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update property",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Properties for Letting" />
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleRequestPhoto = (property: any) => {
    toast({
      title: "Request Sent",
      description: `Photo upload request sent to landlord for ${property.address_line1}`,
    });
  };

  const handleGenerateValuationPack = async (property: any) => {
    setSelectedProperty(property);
    setValuationPack(null); // Clear previous data
    setGeneratingPack(true);
    setValuationPackOpen(true); // Open dialog immediately to show loading
    try {
      // Extract house number from address_line1 or address
      const addressToUse = property.address_line1 || property.address || "";
      const houseNumber = addressToUse.split(',')[0].trim() || addressToUse.split(' ')[0].trim() || "1";
      
      // Use NEW AI-powered lettings valuation endpoint
      const response = await api.get("/api/v1/land-registry/ai-lettings-valuation", {
        params: {
          postcode: property.postcode,
          house_number: houseNumber,
        }
      });
      setValuationPack(response.data);
      // Update property flag
      await api.patch(`/api/v1/properties/${property.id}`, {
        has_valuation_pack: true,
      });
      toast({
        title: "Success",
        description: "AI-powered valuation generated successfully",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to generate AI valuation",
        variant: "destructive",
      });
      setValuationPackOpen(false); // Close dialog on error
    } finally {
      setGeneratingPack(false);
    }
  };

  const handleFindMatchingApplicants = async (property: any) => {
    setSelectedProperty(property);
    setSelectedApplicants([]); // Clear previous selections
    try {
      const result = await applicantMatchingMutation.mutateAsync(property.id);
      if (result.matches.length > 0) {
        // Pre-select top matches (score >= 75) up to 10 applicants
        const topMatches = result.matches
          .filter((m: MatchedApplicant) => m.score >= 75 && !m.already_sent)
          .slice(0, 10)
          .map((m: MatchedApplicant) => m.applicant_id);
        setSelectedApplicants(topMatches);
        setMatchingDialogOpen(true);
      }
    } catch (error) {
      // Error is already handled by the mutation's onError
    }
  };

  const handleSendToApplicants = async () => {
    if (selectedApplicants.length === 0) {
      toast({
        title: "No Applicants Selected",
        description: "Please select at least one applicant to send to.",
        variant: "destructive",
      });
      return;
    }

    if (selectedApplicants.length > 20) {
      if (!confirm(`You're about to send to ${selectedApplicants.length} applicants. Sending to many applicants at once may reduce response rates. Consider targeting your top matches. Continue anyway?`)) {
        return;
      }
    }

    setSendingToApplicants(true);
    try {
      await sendPropertyMutation.mutateAsync({
        propertyId: selectedProperty.id,
        applicantIds: selectedApplicants,
        sendMethod: 'email'
      });
      setMatchingDialogOpen(false);
      setSelectedApplicants([]);
    } catch (error) {
      // Error is already handled by the mutation's onError
    } finally {
      setSendingToApplicants(false);
    }
  };

  const toggleApplicantSelection = (applicantId: string) => {
    setSelectedApplicants(prev => 
      prev.includes(applicantId)
        ? prev.filter(id => id !== applicantId)
        : [...prev, applicantId]
    );
  };

  const selectAllApplicants = () => {
    if (applicantMatchingMutation.data) {
      const allIds = applicantMatchingMutation.data.matches
        .filter((m: MatchedApplicant) => !m.already_sent)
        .map((m: MatchedApplicant) => m.applicant_id);
      setSelectedApplicants(allIds);
    }
  };

  const deselectAllApplicants = () => {
    setSelectedApplicants([]);
  };

  const handleExportCSV = () => {
    if (!properties || properties.length === 0) return;

    const csvContent = [
      [
        "Address",
        "City",
        "Postcode",
        "Type",
        "Bedrooms",
        "Bathrooms",
        "Rent",
        "Status",
      ].join(","),
      ...properties.map((p) =>
        [
          p.address_line1,
          p.city,
          p.postcode,
          p.property_type,
          p.bedrooms,
          p.bathrooms,
          p.rent || "POA",
          p.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `properties-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Properties exported to CSV" });
  };

  // Filter properties for letting (have landlord_id, no vendor_id, no sales_status)
  const propertiesForLetting = useMemo(() => {
    return properties?.filter(
      (p) => p.landlord_id && !p.vendor_id && (!p.sales_status || p.sales_status.trim() === "")
    ) || [];
  }, [properties]);

  // Filter properties based on active tab
  const filteredByTab = useMemo(() => {
    if (activeTab === "my-properties") {
      // Filter by current user's managed properties
      return propertiesForLetting.filter((p) => p.managed_by === user?.id);
    } else if (activeTab === "available") {
      // Filter by available status
      return propertiesForLetting.filter((p) => p.status === "available");
    }
    // "all" tab - return all properties
    return propertiesForLetting;
  }, [propertiesForLetting, activeTab, user?.id]);

  // Get team agent IDs
  const teamAgentIds = teamAgents?.map(a => a.id) || [];

  // Apply filters and search
  const filteredProperties = useMemo(() => {
    let filtered = filteredByTab;
    
    // Managed by Me filter
    if (managedByMe) {
      filtered = filtered.filter((p) => p.managed_by === user?.id);
    }
    
    // Managed by My Team filter
    if (managedByMyTeam) {
      filtered = filtered.filter((p) => p.managed_by && teamAgentIds.includes(p.managed_by));
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((property) => {
        return (
          property.address_line1?.toLowerCase().includes(query) ||
          property.city?.toLowerCase().includes(query) ||
          property.postcode?.toLowerCase().includes(query) ||
          property.property_type?.toLowerCase().includes(query) ||
          property.bedrooms?.toString().includes(query) ||
          property.bathrooms?.toString().includes(query) ||
          property.rent?.toString().includes(query)
        );
      });
    }
    
    return filtered;
  }, [filteredByTab, managedByMe, managedByMyTeam, searchQuery, user?.id, teamAgentIds]);

  // Calculate counts for each tab
  const allCount = propertiesForLetting.length;
  const myPropertiesCount = propertiesForLetting.filter((p) => p.managed_by === user?.id).length;
  const availableCount = propertiesForLetting.filter((p) => p.status === "available").length;

  return (
    <div>
      <Header title="Properties for Letting" />
      <div className="p-6">
        {/* Filter Tabs */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All Properties ({allCount})
              </TabsTrigger>
              <TabsTrigger value="my-properties">
                <User className="mr-2 h-4 w-4" />
                My Properties ({myPropertiesCount})
              </TabsTrigger>
              <TabsTrigger value="available">
                <CheckCircle className="mr-2 h-4 w-4" />
                Available ({availableCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search Bar and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by address, city, postcode, property type, bedrooms, bathrooms, or rent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="managed-by-me"
                checked={managedByMe}
                onCheckedChange={(checked) => setManagedByMe(checked === true)}
              />
              <Label htmlFor="managed-by-me" className="text-sm font-normal cursor-pointer">
                Managed by Me
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="managed-by-team"
                checked={managedByMyTeam}
                onCheckedChange={(checked) => setManagedByMyTeam(checked === true)}
              />
              <Label htmlFor="managed-by-team" className="text-sm font-normal cursor-pointer">
                Managed by My Team
              </Label>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-end">
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <Card
              key={property.id}
              className="group shadow-card transition-shadow hover:shadow-elevated"
            >
              <CardHeader className="relative">
                <div className="absolute right-4 top-4 z-10 flex flex-col gap-2 items-end">
                  <StatusBadge status={property.status} />
                  {property.has_valuation_pack && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Valuation Pack
                    </Badge>
                  )}
                </div>
                <div className="flex aspect-video items-center justify-center rounded-lg bg-muted overflow-hidden relative">
                  {property.main_photo_url ? (
                    <img
                      src={property.main_photo_url}
                      alt={property.address_line1}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <img
                        src={`https://picsum.photos/seed/building${property.id}/800/450`}
                        alt={property.address_line1 || property.city}
                        className="h-full w-full object-cover"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white hover:text-white"
                        onClick={() => handleRequestPhoto(property)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Request Photo
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">
                      {getFlatOrUnitNumber(property.address_line1, property.address, property.city, property.property_type) || property.city.toUpperCase()}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {property.city}, {property.postcode}
                    </p>
                    {(property.landlord || property.vendor) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Owner: {property.landlord?.full_name || `${property.vendor?.first_name} ${property.vendor?.last_name}`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                      {property.property_type}
                    </span>
                    {property.managed_by === user?.id ? (
                      <Badge className="bg-accent text-white text-xs font-semibold px-2 py-0.5">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Managed by Me
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span className="text-right whitespace-nowrap">
                          {property.managed_by_name || "Unassigned"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Bed className="h-4 w-4" />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Bath className="h-4 w-4" />
                    <span>{property.bathrooms}</span>
                  </div>
                  {property.rent ? (
                    <div className="ml-auto flex items-center gap-1 text-sm font-semibold text-primary">
                      <PoundSterling className="h-4 w-4" />
                      <span>{property.rent.toLocaleString()}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        pcm
                      </span>
                    </div>
                  ) : (
                    <div className="ml-auto text-sm text-muted-foreground">POA</div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleGenerateValuationPack(property)}
                    disabled={generatingPack}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {property.has_valuation_pack ? "View Valuation" : "Generate Valuation"}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/properties/${property.id}`}>
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => handleFindMatchingApplicants(property)}
                  disabled={applicantMatchingMutation.isPending}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Find Matching Applicants
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <EmptyState
            icon={Building2}
            title={managedByMe || managedByMyTeam ? "No properties found with this filter" : "No properties for letting yet"}
            description={managedByMe || managedByMyTeam ? "Try adjusting your filters to see more results" : "Get started by adding your first property for letting to begin managing your portfolio"}
            actionLabel={managedByMe || managedByMyTeam ? undefined : "+ Add Property"}
            onAction={managedByMe || managedByMyTeam ? undefined : () => {}}
          />
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>Update property details</DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={selectedProperty.address_line1}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={selectedProperty.city}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    name="postcode"
                    defaultValue={selectedProperty.postcode}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="property_type">Type</Label>
                  <Select
                    name="property_type"
                    defaultValue={selectedProperty.property_type}
                  >
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
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      defaultValue={selectedProperty.bedrooms}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      defaultValue={selectedProperty.bathrooms}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rent">Rent (£)</Label>
                  <Input
                    id="rent"
                    name="rent"
                    type="number"
                    step="0.01"
                    defaultValue={selectedProperty.rent}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={selectedProperty.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="let_agreed">Let Agreed</SelectItem>
                      <SelectItem value="let_by">Let By</SelectItem>
                      <SelectItem value="tenanted">Tenanted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI-Powered Valuation Pack Dialog */}
      <Dialog open={valuationPackOpen} onOpenChange={setValuationPackOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Valuation - {selectedProperty?.address_line1 || selectedProperty?.address}
            </DialogTitle>
            <DialogDescription>
              Intelligent property valuation powered by AI
            </DialogDescription>
          </DialogHeader>

          {/* Loading State */}
          {generatingPack && !valuationPack && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium animate-pulse">{loadingMessage}</p>
                <p className="text-sm text-muted-foreground">AI is working its magic ✨</p>
              </div>
            </div>
          )}

          {/* AI Valuation Results */}
          {valuationPack && valuationPack.ai_estimate && (
            <div className="space-y-6">
              {/* Price Estimate - Highlighted */}
              <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {valuationPack.valuation_type === 'lettings' ? 'Monthly Rent Estimate' : 'Sale Price Estimate'}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={valuationPack.ai_estimate.confidence === 'high' ? 'default' : 'secondary'}>
                      {valuationPack.ai_estimate.confidence.toUpperCase()} CONFIDENCE
                    </Badge>
                    <span className="text-xs text-muted-foreground">Powered by AI</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-background p-4 border">
                      <div className="text-xs text-muted-foreground mb-1">Minimum</div>
                      <div className="text-lg font-bold text-primary">
                        £{valuationPack.ai_estimate.rent_range?.minimum?.toLocaleString() || valuationPack.ai_estimate.price_range?.minimum?.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg bg-primary p-4 border-2 border-primary">
                      <div className="text-xs text-primary-foreground/80 mb-1">Recommended</div>
                      <div className="text-2xl font-bold text-primary-foreground">
                        £{valuationPack.ai_estimate.monthly_rent?.toLocaleString() || valuationPack.ai_estimate.sale_price?.toLocaleString()}
                      </div>
                      {valuationPack.valuation_type === 'lettings' && <div className="text-xs text-primary-foreground/80 mt-1">per month</div>}
                    </div>
                    <div className="rounded-lg bg-background p-4 border">
                      <div className="text-xs text-muted-foreground mb-1">Maximum</div>
                      <div className="text-lg font-bold text-primary">
                        £{valuationPack.ai_estimate.rent_range?.maximum?.toLocaleString() || valuationPack.ai_estimate.price_range?.maximum?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {valuationPack.ai_estimate.price_per_sqm && (
                    <div className="text-sm text-muted-foreground pt-2 border-t">
                      <strong>Price per m²:</strong> £{valuationPack.ai_estimate.price_per_sqm.toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Reasoning */}
              {valuationPack.ai_estimate.reasoning && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Analysis & Reasoning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{valuationPack.ai_estimate.reasoning}</p>
                  </CardContent>
                </Card>
              )}

              {/* Factors */}
              {valuationPack.ai_estimate.factors && (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Positive Factors */}
                  {valuationPack.ai_estimate.factors.positive?.length > 0 && (
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Positive Factors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {valuationPack.ai_estimate.factors.positive.map((factor: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-green-600 mt-1">✓</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Negative Factors */}
                  {valuationPack.ai_estimate.factors.negative?.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                          <AlertCircle className="h-4 w-4" />
                          Considerations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {valuationPack.ai_estimate.factors.negative.map((factor: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-amber-600 mt-1">⚠</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Market Comparison */}
              {valuationPack.ai_estimate.market_comparison && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Market Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{valuationPack.ai_estimate.market_comparison}</p>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {valuationPack.ai_estimate.recommendations?.length > 0 && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Lightbulb className="h-5 w-5" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {valuationPack.ai_estimate.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-blue-600 font-bold mt-0.5">{idx + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Property Details */}
              {valuationPack.property && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Property Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Address:</span>
                        <div className="font-medium">{valuationPack.property.address}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <div className="font-medium">{valuationPack.property.property_type}</div>
                      </div>
                      {valuationPack.property.bedrooms && (
                        <div>
                          <span className="text-muted-foreground">Bedrooms:</span>
                          <div className="font-medium">{valuationPack.property.bedrooms}</div>
                        </div>
                      )}
                      {valuationPack.property.floor_area_sqm && (
                        <div>
                          <span className="text-muted-foreground">Floor Area:</span>
                          <div className="font-medium">{valuationPack.property.floor_area_sqm} m²</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data Source */}
              <div className="text-xs text-center text-muted-foreground pt-4 border-t">
                {valuationPack.data_source} • Model: {valuationPack.ai_estimate.model_used}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Matching Applicants Dialog */}
      <Dialog open={matchingDialogOpen} onOpenChange={setMatchingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Matching Applicants for {selectedProperty?.address_line1}
            </DialogTitle>
            <DialogDescription>
              Select applicants to send personalized property details via email
            </DialogDescription>
          </DialogHeader>

          {applicantMatchingMutation.isPending && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Finding matching applicants...</p>
              </div>
            </div>
          )}

          {applicantMatchingMutation.data && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Matches</p>
                  <p className="text-2xl font-bold">{applicantMatchingMutation.data.total_matches}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Selected</p>
                  <p className="text-2xl font-bold text-primary">{selectedApplicants.length}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllApplicants}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllApplicants}>
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Warning for bulk sending */}
              {selectedApplicants.length > 20 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">Large recipient list</p>
                    <p className="text-amber-700">
                      Sending to many applicants at once may reduce response rates. Consider targeting your top matches.
                    </p>
                  </div>
                </div>
              )}

              {/* Applicant List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {applicantMatchingMutation.data.matches.map((match: MatchedApplicant) => {
                  const isSelected = selectedApplicants.includes(match.applicant_id);
                  const isAlreadySent = match.already_sent;
                  const scoreColor = match.score >= 90 ? "text-green-600 bg-green-100" : 
                                     match.score >= 75 ? "text-blue-600 bg-blue-100" : 
                                     "text-gray-600 bg-gray-100";

                  return (
                    <Card 
                      key={match.applicant_id} 
                      className={`${isSelected ? "border-primary ring-2 ring-primary/20" : ""} ${isAlreadySent ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-muted/50"} transition-colors`}
                      onClick={() => !isAlreadySent && toggleApplicantSelection(match.applicant_id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <Checkbox
                            checked={isSelected}
                            disabled={isAlreadySent}
                            onCheckedChange={() => toggleApplicantSelection(match.applicant_id)}
                            className="mt-1 pointer-events-none"
                          />

                          {/* Avatar */}
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {match.applicant.first_name[0]}{match.applicant.last_name[0]}
                            </AvatarFallback>
                          </Avatar>

                          {/* Applicant Details */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">
                                  {match.applicant.first_name} {match.applicant.last_name}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {match.applicant.email}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={scoreColor}>
                                  {match.score}% Match
                                </Badge>
                                {isAlreadySent && (
                                  <Badge variant="outline" className="bg-gray-100">
                                    Sent {new Date(match.sent_date!).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Match Criteria */}
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline" className="font-normal">
                                <Bed className="h-3 w-3 mr-1" />
                                {match.applicant.desired_bedrooms} beds
                              </Badge>
                              <Badge variant="outline" className="font-normal">
                                <PoundSterling className="h-3 w-3 mr-1" />
                                {match.applicant.budget}
                              </Badge>
                              {match.applicant.move_in_date && (
                                <Badge variant="outline" className="font-normal">
                                  Move-in: {new Date(match.applicant.move_in_date).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>

                            {/* Match Reasons */}
                            {match.match_reasons.length > 0 && (
                              <div className="text-xs space-y-1">
                                {match.match_reasons.map((reason, idx) => (
                                  <div key={idx} className="flex items-center gap-1 text-muted-foreground">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    {reason}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Personalized Message Preview */}
                            <details className="text-sm" onClick={(e) => e.stopPropagation()}>
                              <summary className="cursor-pointer text-primary hover:underline">
                                View personalized message
                              </summary>
                              <div className="mt-2 p-3 bg-muted/50 rounded text-xs whitespace-pre-wrap">
                                {match.personalized_message}
                              </div>
                            </details>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Empty State */}
              {applicantMatchingMutation.data.matches.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">No Matching Applicants</p>
                  <p className="text-sm text-muted-foreground">
                    No active applicants match this property's criteria at the moment.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendToApplicants}
              disabled={selectedApplicants.length === 0 || sendingToApplicants}
            >
              {sendingToApplicants ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {selectedApplicants.length} Applicant{selectedApplicants.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

