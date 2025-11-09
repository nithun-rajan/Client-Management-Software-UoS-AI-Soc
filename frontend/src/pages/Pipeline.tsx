import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import PropertyPipeline from "@/components/pipeline/PropertyPipeline";
import { Building2, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getFlatOrUnitNumber } from "@/lib/utils";

export default function Pipeline() {
  const navigate = useNavigate();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>("overview");

  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await api.get("/api/v1/properties/");
      return response.data;
    },
  });

  const { data: tenancies, isLoading: tenanciesLoading, error: tenanciesError } = useQuery({
    queryKey: ["tenancies", "active"],
    queryFn: async () => {
      try {
        // First, get ALL tenancies to see what we have
        const allResponse = await api.get("/api/v1/tenancies/", {
          params: { limit: 100 }
        });
        console.log("All tenancies from API:", allResponse.data);
        console.log("Total tenancies found:", allResponse.data?.length || 0);
        
        // Filter for active tenancies (status can be "active" or "ACTIVE" depending on enum)
        const activeTenancies = (allResponse.data || []).filter((t: any) => {
          const status = t.status?.toLowerCase();
          return status === "active";
        });
        
        console.log(`Found ${activeTenancies.length} active tenancies (filtered from ${allResponse.data?.length || 0} total)`);
        if (activeTenancies.length === 0 && (allResponse.data?.length || 0) > 0) {
          console.log("Available tenancy statuses:", [...new Set(allResponse.data.map((t: any) => t.status))]);
        }
        
        return activeTenancies;
      } catch (error: any) {
        console.error("Error fetching tenancies:", error);
        console.error("Error details:", error.response?.data || error.message);
        return [];
      }
    },
  });

  // Group properties by status for pipeline view
  const pipelineStages = {
    available: properties?.filter((p: any) => p.status === "available") || [],
    under_offer: properties?.filter((p: any) => p.status === "under_offer") || [],
    let_agreed: properties?.filter((p: any) => p.status === "let_agreed") || [],
    tenanted: properties?.filter((p: any) => p.status === "tenanted") || [],
    managed: properties?.filter((p: any) => p.status === "managed") || [],
  };

  const toggleStage = (stageKey: string) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageKey]: !prev[stageKey]
    }));
  };

  const handlePropertyClick = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setActiveTab("property");
  };

  if (isLoading || tenanciesLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Pipeline Overview</TabsTrigger>
            <TabsTrigger value="property">Property Pipeline</TabsTrigger>
            <TabsTrigger value="tenancies">Tenancy Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Available Stage */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Available ({pipelineStages.available.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pipelineStages.available.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No properties available
                    </div>
                  ) : (
                    <>
                      {(expandedStages.available 
                        ? pipelineStages.available 
                        : pipelineStages.available.slice(0, 5)
                      ).map((property: any) => {
                        const displayName = getFlatOrUnitNumber(
                          property.address_line1,
                          property.address,
                          property.city,
                          property.property_type
                        ) || property.city?.toUpperCase() || property.address_line1 || "Unknown";
                        return (
                          <div
                            key={property.id}
                            className="p-2 rounded border hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all active:scale-[0.98]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePropertyClick(property.id);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handlePropertyClick(property.id);
                              }
                            }}
                          >
                            <div className="text-sm font-medium truncate">
                              {displayName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {property.rent ? `£${property.rent.toLocaleString()}/month` : "POA"}
                            </div>
                          </div>
                        );
                      })}
                      {pipelineStages.available.length > 5 && (
                        <button
                          onClick={() => toggleStage("available")}
                          className="text-xs text-primary hover:text-primary/80 font-medium text-center pt-2 w-full transition-colors"
                        >
                          {expandedStages.available 
                            ? `Show less (${pipelineStages.available.length - 5} hidden)`
                            : `+${pipelineStages.available.length - 5} more`
                          }
                        </button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Under Offer Stage */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Under Offer ({pipelineStages.under_offer.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pipelineStages.under_offer.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No properties under offer
                    </div>
                  ) : (
                    <>
                      {(expandedStages.under_offer 
                        ? pipelineStages.under_offer 
                        : pipelineStages.under_offer.slice(0, 5)
                      ).map((property: any) => {
                        const displayName = getFlatOrUnitNumber(
                          property.address_line1,
                          property.address,
                          property.city,
                          property.property_type
                        ) || property.city?.toUpperCase() || property.address_line1 || "Unknown";
                        return (
                          <div
                            key={property.id}
                            className="p-2 rounded border hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all active:scale-[0.98]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePropertyClick(property.id);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handlePropertyClick(property.id);
                              }
                            }}
                          >
                            <div className="text-sm font-medium truncate">
                              {displayName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {property.rent ? `£${property.rent.toLocaleString()}/month` : "POA"}
                            </div>
                          </div>
                        );
                      })}
                      {pipelineStages.under_offer.length > 5 && (
                        <button
                          onClick={() => toggleStage("under_offer")}
                          className="text-xs text-primary hover:text-primary/80 font-medium text-center pt-2 w-full transition-colors"
                        >
                          {expandedStages.under_offer 
                            ? `Show less (${pipelineStages.under_offer.length - 5} hidden)`
                            : `+${pipelineStages.under_offer.length - 5} more`
                          }
                        </button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Let Agreed Stage */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Let Agreed ({pipelineStages.let_agreed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pipelineStages.let_agreed.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No properties let agreed
                    </div>
                  ) : (
                    <>
                      {(expandedStages.let_agreed 
                        ? pipelineStages.let_agreed 
                        : pipelineStages.let_agreed.slice(0, 5)
                      ).map((property: any) => {
                        const displayName = getFlatOrUnitNumber(
                          property.address_line1,
                          property.address,
                          property.city,
                          property.property_type
                        ) || property.city?.toUpperCase() || property.address_line1 || "Unknown";
                        return (
                          <div
                            key={property.id}
                            className="p-2 rounded border hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all active:scale-[0.98]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePropertyClick(property.id);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handlePropertyClick(property.id);
                              }
                            }}
                          >
                            <div className="text-sm font-medium truncate">
                              {displayName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {property.rent ? `£${property.rent.toLocaleString()}/month` : "POA"}
                            </div>
                          </div>
                        );
                      })}
                      {pipelineStages.let_agreed.length > 5 && (
                        <button
                          onClick={() => toggleStage("let_agreed")}
                          className="text-xs text-primary hover:text-primary/80 font-medium text-center pt-2 w-full transition-colors"
                        >
                          {expandedStages.let_agreed 
                            ? `Show less (${pipelineStages.let_agreed.length - 5} hidden)`
                            : `+${pipelineStages.let_agreed.length - 5} more`
                          }
                        </button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Tenanted Stage */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Tenanted ({pipelineStages.tenanted.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pipelineStages.tenanted.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No tenanted properties
                    </div>
                  ) : (
                    <>
                      {(expandedStages.tenanted 
                        ? pipelineStages.tenanted 
                        : pipelineStages.tenanted.slice(0, 5)
                      ).map((property: any) => {
                        const displayName = getFlatOrUnitNumber(
                          property.address_line1,
                          property.address,
                          property.city,
                          property.property_type
                        ) || property.city?.toUpperCase() || property.address_line1 || "Unknown";
                        return (
                          <div
                            key={property.id}
                            className="p-2 rounded border hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all active:scale-[0.98]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePropertyClick(property.id);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handlePropertyClick(property.id);
                              }
                            }}
                          >
                            <div className="text-sm font-medium truncate">
                              {displayName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {property.rent ? `£${property.rent.toLocaleString()}/month` : "POA"}
                            </div>
                          </div>
                        );
                      })}
                      {pipelineStages.tenanted.length > 5 && (
                        <button
                          onClick={() => toggleStage("tenanted")}
                          className="text-xs text-primary hover:text-primary/80 font-medium text-center pt-2 w-full transition-colors"
                        >
                          {expandedStages.tenanted 
                            ? `Show less (${pipelineStages.tenanted.length - 5} hidden)`
                            : `+${pipelineStages.tenanted.length - 5} more`
                          }
                        </button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Managed Stage */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Managed ({pipelineStages.managed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pipelineStages.managed.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No managed properties
                    </div>
                  ) : (
                    <>
                      {(expandedStages.managed 
                        ? pipelineStages.managed 
                        : pipelineStages.managed.slice(0, 5)
                      ).map((property: any) => {
                        const displayName = getFlatOrUnitNumber(
                          property.address_line1,
                          property.address,
                          property.city,
                          property.property_type
                        ) || property.city?.toUpperCase() || property.address_line1 || "Unknown";
                        return (
                          <div
                            key={property.id}
                            className="p-2 rounded border hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all active:scale-[0.98]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePropertyClick(property.id);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handlePropertyClick(property.id);
                              }
                            }}
                          >
                            <div className="text-sm font-medium truncate">
                              {displayName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {property.rent ? `£${property.rent.toLocaleString()}/month` : "POA"}
                            </div>
                          </div>
                        );
                      })}
                      {pipelineStages.managed.length > 5 && (
                        <button
                          onClick={() => toggleStage("managed")}
                          className="text-xs text-primary hover:text-primary/80 font-medium text-center pt-2 w-full transition-colors"
                        >
                          {expandedStages.managed 
                            ? `Show less (${pipelineStages.managed.length - 5} hidden)`
                            : `+${pipelineStages.managed.length - 5} more`
                          }
                        </button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="property" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="property-select" className="text-sm font-medium">
                    Select Property
                  </Label>
                  <Select
                    value={selectedPropertyId || ""}
                    onValueChange={(value) => setSelectedPropertyId(value)}
                  >
                    <SelectTrigger id="property-select" className="w-full">
                      <SelectValue placeholder="Select a property to view pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties && properties.length > 0 ? (
                        properties.map((property: any) => {
                          const displayName = getFlatOrUnitNumber(
                            property.address_line1,
                            property.address,
                            property.city,
                            property.property_type
                          ) || property.city?.toUpperCase() || property.address_line1 || "Unknown Property";
                          // Format status: "let_by" -> "Let By", "tenanted" -> "Tenanted"
                          const statusLabel = property.status
                            ? property.status
                                .split("_")
                                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ")
                            : "";
                          return (
                            <SelectItem key={property.id} value={property.id}>
                              {displayName}{statusLabel ? ` • ${statusLabel}` : ""}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="" disabled>No properties available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {selectedPropertyId ? (
              <PropertyPipeline propertyId={selectedPropertyId} />
            ) : (
              <EmptyState
                icon={Building2}
                title="Select a property"
                description="Choose a property from the dropdown above to view its pipeline stages and workflow"
              />
            )}
          </TabsContent>

          <TabsContent value="tenancies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Tenancies</CardTitle>
              </CardHeader>
              <CardContent>
                {tenanciesError && (
                  <div className="py-4 text-center text-sm text-destructive">
                    Error loading tenancies: {tenanciesError instanceof Error ? tenanciesError.message : "Unknown error"}
                  </div>
                )}
                {tenanciesLoading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Loading tenancies...
                  </div>
                ) : tenancies && tenancies.length > 0 ? (
                  <div className="space-y-4">
                    {tenancies.map((tenancy: any) => {
                      // Use property from API response if available, otherwise fallback to properties list
                      const property = tenancy.property || properties?.find((p: any) => p.id === tenancy.property_id);
                      const propertyAddress = property?.address_line1 || property?.address || `Tenancy #${tenancy.id.slice(0, 8)}`;
                      
                      return (
                        <div
                          key={tenancy.id}
                          className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/properties/${tenancy.property_id}`)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {propertyAddress}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              £{tenancy.rent_amount?.toLocaleString() || tenancy.rent_amount}/month
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {tenancy.start_date && new Date(tenancy.start_date).toLocaleDateString()} -{" "}
                              {tenancy.end_date ? new Date(tenancy.end_date).toLocaleDateString() : "Ongoing"}
                            </div>
                            {tenancy.applicant && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Tenant: {tenancy.applicant.first_name} {tenancy.applicant.last_name}
                              </div>
                            )}
                          </div>
                          <StatusBadge status={tenancy.status || "active"} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No active tenancies"
                    description="When tenancies are created with status 'active', they will appear here. Check the browser console for debugging information about available tenancies."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}

