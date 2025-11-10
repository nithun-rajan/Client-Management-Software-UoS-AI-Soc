import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FileText,
  Calendar,
  MapPin,
  PoundSterling,
  User,
  Building2,
  Sparkles,
  Search,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Home,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendors } from "@/hooks/useVendors";
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/shared/EmptyState";
import { Vendor, Property } from "@/types";
import { toast } from "sonner";
import api from "@/lib/api";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";

export default function Valuations() {
  const navigate = useNavigate();
  const { data: vendors, isLoading: vendorsLoading } = useVendors();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all"); // "all" | "vendors" | "properties" | "completed"
  const [valuationPackOpen, setValuationPackOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [valuationPack, setValuationPack] = useState<any>(null);
  const [generatingPack, setGeneratingPack] = useState(false);

  const isLoading = vendorsLoading || propertiesLoading;

  // Filter vendors who need valuations or have booked them
  const vendorsNeedingValuation = vendors?.filter(
    (v: Vendor) => v.status === "new" || v.status === "valuation_booked"
  ) || [];

  // Filter properties with valuation packs
  const propertiesWithValuations = properties?.filter(
    (p: Property) => p.has_valuation_pack && p.sales_status
  ) || [];

  // Combine all valuations
  const allValuations = [
    ...vendorsNeedingValuation.map((v: Vendor) => ({
      type: "vendor" as const,
      id: v.id,
      vendor: v,
      property: properties?.find((p: Property) => p.id === v.instructed_property_id),
      status: v.status === "valuation_booked" ? "booked" : "pending",
      date: v.created_at,
    })),
    ...propertiesWithValuations.map((p: Property) => ({
      type: "property" as const,
      id: p.id,
      property: p,
      vendor: vendors?.find((v: Vendor) => v.instructed_property_id === p.id),
      status: "completed" as const,
      date: p.updated_at || p.created_at,
    })),
  ];

  // Apply filters
  let filteredValuations = allValuations;
  
  if (filterType === "vendors") {
    filteredValuations = allValuations.filter((v) => v.type === "vendor");
  } else if (filterType === "properties") {
    filteredValuations = allValuations.filter((v) => v.type === "property");
  } else if (filterType === "completed") {
    filteredValuations = allValuations.filter((v) => v.status === "completed");
  }

  // Apply search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredValuations = filteredValuations.filter((v) => {
      const vendorName = v.vendor
        ? `${v.vendor.first_name} ${v.vendor.last_name}`.toLowerCase()
        : "";
      const propertyAddress = v.property
        ? `${v.property.address_line1 || ""} ${v.property.city || ""} ${v.property.postcode || ""}`.toLowerCase()
        : "";
      return (
        vendorName.includes(query) ||
        propertyAddress.includes(query) ||
        v.vendor?.email?.toLowerCase().includes(query) ||
        v.property?.postcode?.toLowerCase().includes(query)
      );
    });
  }

  const handleGenerateValuationPack = async (property: Property) => {
    setSelectedProperty(property);
    setGeneratingPack(true);
    try {
      const response = await api.post("/api/v1/land-registry/valuation-pack", {
        postcode: property.postcode,
        property_type: property.property_type,
        bedrooms: property.bedrooms,
      });
      setValuationPack(response.data.data);
      setValuationPackOpen(true);
      // Update property flag
      await api.patch(`/api/v1/properties/${property.id}`, {
        has_valuation_pack: true,
      });
      toast.success("Valuation pack generated successfully");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Failed to generate valuation pack"
      );
    } finally {
      setGeneratingPack(false);
    }
  };

  const handleViewValuationPack = async (property: Property) => {
    setSelectedProperty(property);
    setGeneratingPack(true);
    try {
      const response = await api.post("/api/v1/land-registry/valuation-pack", {
        postcode: property.postcode,
        property_type: property.property_type,
        bedrooms: property.bedrooms,
      });
      setValuationPack(response.data.data);
      setValuationPackOpen(true);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Failed to load valuation pack"
      );
    } finally {
      setGeneratingPack(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Valuations" />
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

  const stats = {
    pending: filteredValuations.filter((v) => v.status === "pending").length,
    booked: filteredValuations.filter((v) => v.status === "booked").length,
    completed: filteredValuations.filter((v) => v.status === "completed").length,
    total: filteredValuations.length,
  };

  return (
    <div>
      <Header title="Valuations" />
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Valuations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All valuations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting booking</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Booked</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.booked}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Valuation packs ready</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by vendor name, property address, or postcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Valuations</SelectItem>
              <SelectItem value="vendors">Vendors Only</SelectItem>
              <SelectItem value="properties">Properties Only</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Valuations Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredValuations.map((valuation) => (
            <Card
              key={`${valuation.type}-${valuation.id}`}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {valuation.type === "vendor" ? (
                      <User className="h-5 w-5 text-primary" />
                    ) : (
                      <Home className="h-5 w-5 text-primary" />
                    )}
                    <CardTitle className="text-lg">
                      {valuation.type === "vendor" ? "Vendor Valuation" : "Property Valuation"}
                    </CardTitle>
                  </div>
                  {valuation.status === "completed" ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : valuation.status === "booked" ? (
                    <Badge className="bg-blue-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Booked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vendor Info */}
                {valuation.vendor && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/vendors/${valuation.vendor.id}`}
                        className="font-semibold truncate hover:text-primary hover:underline transition-colors block"
                      >
                        {valuation.vendor.first_name} {valuation.vendor.last_name}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate">
                        {valuation.vendor.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {valuation.vendor.primary_phone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Property Info */}
                {valuation.property && (
                  <div className="flex items-start gap-3 pt-2 border-t">
                    <div className="rounded-full bg-blue-500/10 p-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/properties/${valuation.property.id}`}
                        className="font-medium truncate hover:text-primary hover:underline transition-colors block"
                      >
                        {valuation.property.address_line1 || valuation.property.address}
                      </Link>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {valuation.property.city}, {valuation.property.postcode}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {valuation.property.property_type}
                        </Badge>
                        {valuation.property.bedrooms && (
                          <span className="text-xs text-muted-foreground">
                            {valuation.property.bedrooms} bed
                          </span>
                        )}
                        {valuation.property.asking_price && (
                          <div className="flex items-center gap-1 text-sm font-semibold text-primary ml-auto">
                            <PoundSterling className="h-3 w-3" />
                            <span>{valuation.property.asking_price.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Date */}
                {valuation.date && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(valuation.date), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                {valuation.status === "completed" && valuation.property ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewValuationPack(valuation.property!)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Pack
                  </Button>
                ) : valuation.property ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleGenerateValuationPack(valuation.property!)}
                    disabled={generatingPack}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Pack
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredValuations.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No valuations found"
            description={
              searchQuery
                ? "Try adjusting your search criteria"
                : "Valuations will appear here when vendors book appointments or properties have valuation packs"
            }
          />
        )}
      </div>

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
              {valuationPack.valuation_summary && (
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
                          £
                          {valuationPack.valuation_summary?.recommended_range?.min?.toLocaleString()}
                          {" - "}
                          £
                          {Math.round(
                            (valuationPack.valuation_summary?.recommended_range?.min || 0) * 1.05
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-4 border-2 border-primary">
                        <div className="text-sm text-muted-foreground mb-1">Recommended Guide Price</div>
                        <div className="text-xl font-bold text-primary">
                          £
                          {Math.round(
                            ((valuationPack.valuation_summary?.recommended_range?.min || 0) +
                              (valuationPack.valuation_summary?.recommended_range?.max || 0)) /
                              2
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-lg bg-background p-4 border">
                        <div className="text-sm text-muted-foreground mb-1">Aspirational Range</div>
                        <div className="text-lg font-bold text-primary">
                          £{valuationPack.valuation_summary?.recommended_range?.max?.toLocaleString()}+
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground pt-2 border-t">
                      <strong>Average Price:</strong> £
                      {valuationPack.valuation_summary.average_price?.toLocaleString()} |{" "}
                      <strong>Median:</strong> £
                      {valuationPack.valuation_summary.median_price?.toLocaleString()}
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
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-red-500 rotate-180" />
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
                    <CardTitle>Comparative Sales ({valuationPack.comparables.length} found)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {valuationPack.comparables.slice(0, 15).map((comp: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center border-b pb-3 last:border-0"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {comp.address || `${comp.street || ""}, ${comp.town || ""}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {comp.property_type} | Sold {comp.date || comp.sold_date}
                            </div>
                          </div>
                          <div className="font-bold text-primary ml-4">
                            £{comp.price?.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Area Statistics */}
              {valuationPack.area_statistics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Area Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Properties Sold</div>
                        <div className="text-lg font-semibold">
                          {valuationPack.area_statistics.total_sales || "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Average Price</div>
                        <div className="text-lg font-semibold">
                          £{valuationPack.area_statistics.average_price?.toLocaleString() || "N/A"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {generatingPack && !valuationPack && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Sparkles className="h-8 w-8 animate-pulse text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Generating valuation pack...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

