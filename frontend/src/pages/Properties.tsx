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
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { getFlatOrUnitNumber } from "@/lib/utils";

export default function Properties() {
  const { data: properties, isLoading, refetch } = useProperties();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [valuationPackOpen, setValuationPackOpen] = useState(false);
  const [valuationPack, setValuationPack] = useState<any>(null);
  const [generatingPack, setGeneratingPack] = useState(false);

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
    setGeneratingPack(true);
    try {
      const response = await api.post("/api/v1/valuations/generate", {
        property_id: property.id,
        valuation_type: "sales",
        include_comparables: true,
        market_analysis_depth: "comprehensive",
        radius_km: 5.0,
        max_comparables: 10,
      });
      setValuationPack(response.data.valuation);
      setValuationPackOpen(true);
      // Update property flag
      await api.patch(`/api/v1/properties/${property.id}`, {
        has_valuation_pack: true,
      });
      toast({
        title: "Success",
        description: "Valuation pack generated successfully",
      });
      refetch();
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
  const propertiesForLetting = properties?.filter(
    (p) => p.landlord_id && !p.vendor_id && (!p.sales_status || p.sales_status.trim() === "")
  ) || [];

  // Filter properties based on search query
  const filteredProperties = propertiesForLetting.filter((property) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      property.address_line1?.toLowerCase().includes(query) ||
      property.city?.toLowerCase().includes(query) ||
      property.postcode?.toLowerCase().includes(query) ||
      property.property_type?.toLowerCase().includes(query) ||
      property.bedrooms?.toString().includes(query) ||
      property.bathrooms?.toString().includes(query) ||
      property.rent?.toString().includes(query)
    );
  }) || [];

  return (
    <div>
      <Header title="Properties for Letting" />
      <div className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
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
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                    {property.property_type}
                  </span>
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
            title="No properties for letting yet"
            description="Get started by adding your first property for letting to begin managing your portfolio"
            actionLabel="+ Add Property"
            onAction={() => {}}
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

      {/* Valuation Pack Dialog */}
      <Dialog open={valuationPackOpen} onOpenChange={setValuationPackOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Valuation Pack - {selectedProperty?.address_line1 || selectedProperty?.address}
            </DialogTitle>
            <DialogDescription>
              Comprehensive property valuation and market analysis
            </DialogDescription>
          </DialogHeader>

          {valuationPack && (
            <div className="space-y-6">
              {/* Recommended Valuation - Highlighted */}
              {valuationPack.recommended_price && (
                <Card className="border-2 border-primary bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Recommended Valuation & Price Range
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-background p-4 border">
                        <div className="text-sm text-muted-foreground mb-1">Quick Sale Range</div>
                        <div className="text-lg font-bold text-primary">
                          £{valuationPack.value_range_min?.toLocaleString() || "N/A"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-4 border-2 border-primary">
                        <div className="text-sm text-muted-foreground mb-1">Recommended Guide Price</div>
                        <div className="text-xl font-bold text-primary">
                          £{valuationPack.recommended_price?.toLocaleString() || valuationPack.estimated_value?.toLocaleString() || "N/A"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-background p-4 border">
                        <div className="text-sm text-muted-foreground mb-1">Aspirational Range</div>
                        <div className="text-lg font-bold text-primary">
                          £{valuationPack.value_range_max?.toLocaleString() || "N/A"}+
                        </div>
                      </div>
                    </div>
                    {valuationPack.pricing_strategy && (
                      <div className="text-sm text-muted-foreground pt-2 border-t">
                        <strong>Pricing Strategy:</strong> {valuationPack.pricing_strategy} |{" "}
                        <strong>Confidence:</strong> {valuationPack.confidence || "Medium"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Market Conditions */}
              {valuationPack.market_conditions && (
                <Card>
                  <CardHeader>
                    <CardTitle>Market Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{valuationPack.market_conditions}</p>
                  </CardContent>
                </Card>
              )}

              {/* Comparables */}
              {valuationPack.comparable_properties && valuationPack.comparable_properties.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparative Sales ({valuationPack.comparable_properties.length} found)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {valuationPack.comparable_properties.slice(0, 15).map((comp: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center border-b pb-3 last:border-0"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {comp.address || comp.sale_address || "Unknown address"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {comp.property_type || "Unknown"} | Sold {comp.sale_date || comp.date || "N/A"}
                              {comp.bedrooms && ` | ${comp.bedrooms} bed${comp.bedrooms > 1 ? 's' : ''}`}
                            </div>
                          </div>
                          <div className="font-bold text-primary ml-4">
                            £{comp.sale_price?.toLocaleString() || comp.price?.toLocaleString() || "N/A"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Factors */}
              {valuationPack.key_factors && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Factors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {valuationPack.key_factors.positive && valuationPack.key_factors.positive.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-green-600 mb-2">Positive Factors</div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {valuationPack.key_factors.positive.map((factor: string, idx: number) => (
                            <li key={idx}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {valuationPack.key_factors.negative && valuationPack.key_factors.negative.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-red-600 mb-2">Negative Factors</div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {valuationPack.key_factors.negative.map((factor: string, idx: number) => (
                            <li key={idx}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Location Analysis */}
              {valuationPack.location_analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle>Location Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{valuationPack.location_analysis}</p>
                  </CardContent>
                </Card>
              )}

              {/* Valuation Logic */}
              {valuationPack.valuation_logic && (
                <Card>
                  <CardHeader>
                    <CardTitle>Valuation Logic & Reasoning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{valuationPack.valuation_logic}</p>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {valuationPack.recommendations && valuationPack.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {valuationPack.recommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {generatingPack && !valuationPack && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="mb-2">Generating valuation pack...</div>
                <p className="text-sm text-muted-foreground">This may take a few moments</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

