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
  Upload,
  Download,
  Search,
  X,
  TrendingUp,
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

export default function PropertiesForSale() {
  const { data: properties, isLoading } = useProperties();
  const { toast } = useToast();
  const [valuationPackOpen, setValuationPackOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [valuationPack, setValuationPack] = useState<any>(null);
  const [generatingPack, setGeneratingPack] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    } catch (error: any) {
      console.error("Valuation pack generation error:", error);
      console.error("Error response:", error?.response?.data);
      
      // Show detailed error message
      let errorMessage = "Failed to generate valuation pack";
      if (error?.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => 
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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

  // Apply search
  const filteredProperties = propertiesForSale.filter((property) => {
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

  const handleRequestPhoto = (property: any) => {
    toast({
      title: "Request Sent",
      description: `Photo upload request sent to vendor for ${property.address_line1}`,
    });
  };

  return (
    <div>
      <Header title="Properties for Sale" />
      <div className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
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
            title="No properties for sale yet"
            description="Properties with sales status will appear here"
            actionLabel="+ Add Property"
            onAction={() => {}}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

