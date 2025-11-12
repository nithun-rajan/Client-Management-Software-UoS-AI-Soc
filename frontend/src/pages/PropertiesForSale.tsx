import { useState } from "react";
import {
  Building2,
  Bed,
  Bath,
  Eye,
  PoundSterling,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Download,
  Search,
  X,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { getFlatOrUnitNumber } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useMyTeamAgents } from "@/hooks/useAgents";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import PhotoGallery from "@/components/property/PhotoGallery";

export default function PropertiesForSale() {
  const { data: properties, isLoading, refetch } = useProperties();
  const { user } = useAuth();
  const { data: teamAgents } = useMyTeamAgents();
  const { toast } = useToast();
  const [valuationPackOpen, setValuationPackOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [valuationPack, setValuationPack] = useState<any>(null);
  const [generatingPack, setGeneratingPack] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [managedByMe, setManagedByMe] = useState(false);
  const [managedByMyTeam, setManagedByMyTeam] = useState(false);

  const handleGenerateValuationPack = async (property: any) => {
    setSelectedProperty(property);
    setGeneratingPack(true);
    try {
      const response = await api.post("/api/v1/land-registry/valuation-pack", {
        postcode: property.postcode,
        property_type: property.property_type,
        bedrooms: property.bedrooms,
        property_id: property.id,
        asking_price: property.asking_price ? parseFloat(property.asking_price.toString()) : null,
      });
      setValuationPack(response.data.data);
      setValuationPackOpen(true);
      // Update property flag
      await api.patch(`/api/v1/properties/${property.id}`, {
        has_valuation_pack: true,
      });
      toast({
        title: "Success",
        description: "Valuation pack generated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to generate valuation pack",
        variant: "destructive",
      });
    } finally {
      setGeneratingPack(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Properties for Sale" />
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

  // Filter properties that are for sale (have sales_status set and vendor_id, no landlord_id)
  const propertiesForSale = properties?.filter(
    (p) => p.sales_status && p.sales_status.trim() !== "" && p.vendor_id && !p.landlord_id
  ) || [];

  // Get team agent IDs
  const teamAgentIds = teamAgents?.map(a => a.id) || [];

  // Apply filters and search
  const filteredProperties = propertiesForSale.filter((property) => {
    // Managed by Me filter
    if (managedByMe && property.managed_by !== user?.id) return false;
    
    // Managed by My Team filter
    if (managedByMyTeam && (!property.managed_by || !teamAgentIds.includes(property.managed_by))) return false;
    
    // Search filter
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      property.address_line1?.toLowerCase().includes(query) ||
      property.city?.toLowerCase().includes(query) ||
      property.postcode?.toLowerCase().includes(query) ||
      property.property_type?.toLowerCase().includes(query) ||
      property.bedrooms?.toString().includes(query) ||
      property.bathrooms?.toString().includes(query) ||
      property.asking_price?.toString().includes(query) ||
      property.sales_status?.toLowerCase().includes(query)
    );
  });

  // Helper function to normalize photo URLs
  const normalizePhotoUrl = (url: string): string => {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    return `${apiBaseUrl}/${url}`;
  };

  // Helper function to get photos array from property
  const getPropertyPhotos = (property: any): string[] => {
    if (property.photo_urls) {
      try {
        const photos = JSON.parse(property.photo_urls);
        if (Array.isArray(photos) && photos.length > 0) {
          return photos.map(normalizePhotoUrl);
        }
      } catch (e) {
        console.error("Failed to parse photo_urls:", e);
      }
    }
    // Fallback to main_photo_url if photo_urls is not available
    if (property.main_photo_url) {
      return [normalizePhotoUrl(property.main_photo_url)];
    }
    return [];
  };

  // Handler for photo updates
  const handlePhotosUpdate = async (propertyId: string, photos: string[]) => {
    refetch();
  };

  // Handler for main photo update
  const handleMainPhotoUpdate = async (propertyId: string, url: string) => {
    refetch();
  };

  return (
    <div>
      <Header title="Properties for Sale" />
      <div className="p-6">
        {/* Search Bar and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by address, city, postcode, property type, bedrooms, bathrooms, or price..."
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
          <Button onClick={() => {}} variant="outline">
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
                <div className="absolute right-4 top-4 z-10">
                  {property.sales_status && (
                    <StatusBadge status={property.sales_status} />
                  )}
                </div>
                <PhotoGallery
                  photos={getPropertyPhotos(property)}
                  propertyId={property.id}
                  onPhotosUpdate={(photos) => handlePhotosUpdate(property.id, photos)}
                  mainPhotoUrl={property.main_photo_url ? normalizePhotoUrl(property.main_photo_url) : undefined}
                  onMainPhotoUpdate={(url) => handleMainPhotoUpdate(property.id, url)}
                  allowEdit={true}
                  className="aspect-video"
                />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold leading-tight">
                        {getFlatOrUnitNumber(property.address_line1, property.address, property.city, property.property_type) || property.city.toUpperCase()}
                      </h3>
                      {property.has_valuation_pack && (
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Valuation Pack
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {property.city}, {property.postcode}
                    </p>
                    {property.vendor && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Owner: {property.vendor.first_name} {property.vendor.last_name}
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
                  {property.asking_price ? (
                    <div className="ml-auto flex items-center gap-1 text-sm font-semibold text-primary">
                      <PoundSterling className="h-4 w-4" />
                      <span>{property.asking_price.toLocaleString()}</span>
                      {property.price_qualifier && (
                        <span className="text-xs font-normal text-muted-foreground">
                          {property.price_qualifier}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="ml-auto text-sm text-muted-foreground">POA</div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleGenerateValuationPack(property)}
                  disabled={generatingPack}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {property.has_valuation_pack ? "View Valuation Pack" : "Generate Valuation Pack"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={`/properties/${property.id}`}>
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <EmptyState
            icon={Building2}
            title={managedByMe || managedByMyTeam ? "No properties found with this filter" : "No properties for sale yet"}
            description={managedByMe || managedByMyTeam ? "Try adjusting your filters to see more results" : "Properties with sales status will appear here"}
            actionLabel={managedByMe || managedByMyTeam ? undefined : "+ Add Property"}
            onAction={managedByMe || managedByMyTeam ? undefined : () => {}}
          />
        )}
      </div>

      {/* Valuation Pack Dialog */}
      <Dialog open={valuationPackOpen} onOpenChange={setValuationPackOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Valuation Pack - {selectedProperty?.address_line1}
            </DialogTitle>
            <DialogDescription>
              Comprehensive property valuation and market analysis
            </DialogDescription>
          </DialogHeader>

          {valuationPack && (
            <div className="space-y-6">
              {/* Recommended Valuation - Highlighted */}
              {valuationPack.valuation_summary && (
                <Card className="border-2 border-primary bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Recommended Valuation & Price Range</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-background p-3">
                        <div className="text-sm text-muted-foreground">Quick Sale Range</div>
                        <div className="text-lg font-bold text-primary">
                          £{valuationPack.valuation_summary?.recommended_range?.min?.toLocaleString()} - 
                          £{Math.round((valuationPack.valuation_summary?.recommended_range?.min || 0) * 1.05).toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-3 border-2 border-primary">
                        <div className="text-sm text-muted-foreground">Recommended Guide Price</div>
                        <div className="text-xl font-bold text-primary">
                          £{Math.round(((valuationPack.valuation_summary?.recommended_range?.min || 0) + (valuationPack.valuation_summary?.recommended_range?.max || 0)) / 2).toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <div className="text-sm text-muted-foreground">Aspirational Range</div>
                        <div className="text-lg font-bold text-primary">
                          £{valuationPack.valuation_summary?.recommended_range?.max?.toLocaleString()}+
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Average Price:</strong> £{valuationPack.valuation_summary.average_price?.toLocaleString()} | 
                      <strong> Median:</strong> £{valuationPack.valuation_summary.median_price?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Market Trend */}
              {valuationPack.market_trend && (
                <Card>
                  <CardHeader>
                    <CardTitle>Market Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {valuationPack.market_trend.percentage_change > 0 ? (
                        <AlertCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span>
                        {valuationPack.market_trend.percentage_change > 0 ? "Increasing" : "Decreasing"} by{" "}
                        {Math.abs(valuationPack.market_trend.percentage_change).toFixed(1)}% over{" "}
                        {valuationPack.market_trend.period}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comparables */}
              {valuationPack.comparables && valuationPack.comparables.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparative Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {valuationPack.comparables.slice(0, 10).map((comp: any, idx: number) => (
                        <div key={idx} className="flex justify-between border-b pb-2">
                          <div>
                            <div className="font-medium">{comp.address || `${comp.street}, ${comp.town}`}</div>
                            <div className="text-sm text-muted-foreground">
                              {comp.property_type} | Sold {comp.date || comp.sold_date}
                            </div>
                          </div>
                          <div className="font-bold">£{comp.price?.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

