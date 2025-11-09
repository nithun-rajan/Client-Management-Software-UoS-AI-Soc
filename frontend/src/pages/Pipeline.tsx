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

export default function Pipeline() {
  const navigate = useNavigate();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await api.get("/api/v1/properties/");
      return response.data;
    },
  });

  const { data: tenancies, isLoading: tenanciesLoading } = useQuery({
    queryKey: ["tenancies"],
    queryFn: async () => {
      const response = await api.get("/api/v1/tenancies/");
      return response.data;
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

  if (isLoading || tenanciesLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
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
                      {pipelineStages.available.slice(0, 5).map((property: any) => (
                        <div
                          key={property.id}
                          className="p-2 rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          <div className="text-sm font-medium truncate">
                            {property.address_line1}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            £{property.rent?.toLocaleString()}/month
                          </div>
                        </div>
                      ))}
                      {pipelineStages.available.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          +{pipelineStages.available.length - 5} more
                        </div>
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
                      {pipelineStages.under_offer.slice(0, 5).map((property: any) => (
                        <div
                          key={property.id}
                          className="p-2 rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          <div className="text-sm font-medium truncate">
                            {property.address_line1}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            £{property.rent?.toLocaleString()}/month
                          </div>
                        </div>
                      ))}
                      {pipelineStages.under_offer.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          +{pipelineStages.under_offer.length - 5} more
                        </div>
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
                      {pipelineStages.let_agreed.slice(0, 5).map((property: any) => (
                        <div
                          key={property.id}
                          className="p-2 rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          <div className="text-sm font-medium truncate">
                            {property.address_line1}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            £{property.rent?.toLocaleString()}/month
                          </div>
                        </div>
                      ))}
                      {pipelineStages.let_agreed.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          +{pipelineStages.let_agreed.length - 5} more
                        </div>
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
                      {pipelineStages.tenanted.slice(0, 5).map((property: any) => (
                        <div
                          key={property.id}
                          className="p-2 rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          <div className="text-sm font-medium truncate">
                            {property.address_line1}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            £{property.rent?.toLocaleString()}/month
                          </div>
                        </div>
                      ))}
                      {pipelineStages.tenanted.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          +{pipelineStages.tenanted.length - 5} more
                        </div>
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
                      {pipelineStages.managed.slice(0, 5).map((property: any) => (
                        <div
                          key={property.id}
                          className="p-2 rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          <div className="text-sm font-medium truncate">
                            {property.address_line1}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            £{property.rent?.toLocaleString()}/month
                          </div>
                        </div>
                      ))}
                      {pipelineStages.managed.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          +{pipelineStages.managed.length - 5} more
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="property" className="space-y-6">
            <div className="mb-4">
              <label className="text-sm font-medium">Select Property:</label>
              <select
                className="mt-2 w-full rounded-md border p-2"
                value={selectedPropertyId || ""}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                <option value="">-- Select a property --</option>
                {properties?.map((property: any) => (
                  <option key={property.id} value={property.id}>
                    {property.address_line1} - {property.status}
                  </option>
                ))}
              </select>
            </div>
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
                {tenancies && tenancies.length > 0 ? (
                  <div className="space-y-4">
                    {tenancies.map((tenancy: any) => (
                      <div
                        key={tenancy.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/properties/${tenancy.property_id}`)}
                      >
                        <div>
                          <div className="font-medium">
                            Tenancy #{tenancy.id.slice(0, 8)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            £{tenancy.rent_amount}/month • {tenancy.status}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(tenancy.start_date).toLocaleDateString()} -{" "}
                            {new Date(tenancy.end_date).toLocaleDateString()}
                          </div>
                        </div>
                        <StatusBadge status={tenancy.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No active tenancies"
                    description="When tenancies are created, they will appear here"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}

