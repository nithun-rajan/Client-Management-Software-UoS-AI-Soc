import { useState, useEffect } from "react";
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
  UserCheck,
  TrendingUp,
  Brain,
  Lightbulb,
  BarChart,
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

export default function PropertiesForSale() {
  const { data: properties, isLoading } = useProperties();
  const { user } = useAuth();
  const { data: teamAgents } = useMyTeamAgents();
  const { toast } = useToast();
  const [valuationPackOpen, setValuationPackOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [valuationPack, setValuationPack] = useState<any>(null);
  const [generatingPack, setGeneratingPack] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading property data...");
  const [searchQuery, setSearchQuery] = useState("");
  const [managedByMe, setManagedByMe] = useState(false);
  const [managedByMyTeam, setManagedByMyTeam] = useState(false);

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

  const handleGenerateValuationPack = async (property: any) => {
    setSelectedProperty(property);
    setValuationPack(null); // Clear previous data
    setGeneratingPack(true);
    setValuationPackOpen(true); // Open dialog immediately to show loading
    try {
      // Extract house number from address_line1 or address
      const addressToUse = property.address_line1 || property.address || "";
      const houseNumber = addressToUse.split(',')[0].trim() || addressToUse.split(' ')[0].trim() || "1";
      
      // Use NEW AI-powered sales valuation endpoint
      const response = await api.get("/api/v1/land-registry/ai-sales-valuation", {
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

      {/* AI-Powered Valuation Pack Dialog */}
      <Dialog open={valuationPackOpen} onOpenChange={setValuationPackOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Valuation - {selectedProperty?.address_line1}
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
                    Sale Price Estimate
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
                        £{valuationPack.ai_estimate.price_range?.minimum?.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg bg-primary p-4 border-2 border-primary">
                      <div className="text-xs text-primary-foreground/80 mb-1">Recommended</div>
                      <div className="text-2xl font-bold text-primary-foreground">
                        £{valuationPack.ai_estimate.sale_price?.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg bg-background p-4 border">
                      <div className="text-xs text-muted-foreground mb-1">Maximum</div>
                      <div className="text-lg font-bold text-primary">
                        £{valuationPack.ai_estimate.price_range?.maximum?.toLocaleString()}
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
    </div>
  );
}

