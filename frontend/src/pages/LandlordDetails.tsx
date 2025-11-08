import { useParams, useNavigate } from "react-router-dom";
import {
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Building2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Activity,
  FileText,
  Eye,
  Bed,
  Bath,
  PoundSterling,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

// Helper function to extract flat/unit number from address
const getFlatOrUnitNumber = (addressLine1: string | undefined, address: string | undefined, city?: string): string => {
  const addressStr = addressLine1 || address?.split('\n')[0]?.trim() || "";
  
  if (!addressStr) return "";
  
  // Look for flat/unit patterns anywhere in the string (Studio, Flat, Unit, etc.)
  const flatMatch = addressStr.match(/\b(Studio|Flat|Unit|Apartment|Apt|Suite|Room)\s+[\w\d]+/i);
  if (flatMatch) {
    return flatMatch[0];
  }
  
  // If no flat/unit pattern found, check if there are commas
  const parts = addressStr.split(',').map(p => p.trim()).filter(p => p.length > 0);
  
  if (parts.length > 1) {
    // Remove city from parts if it matches
    const filteredParts = city 
      ? parts.filter(p => p.toLowerCase() !== city.toLowerCase())
      : parts;
    
    // Return the last part (likely the flat/unit, or street if no flat/unit found)
    if (filteredParts.length > 0) {
      return filteredParts[filteredParts.length - 1];
    }
  }
  
  // If no comma, return the whole string (but remove city if present)
  if (city && addressStr.toLowerCase().endsWith(city.toLowerCase())) {
    return addressStr.replace(new RegExp(`[, ]*${city}`, 'gi'), '').trim();
  }
  
  return addressStr;
};

// Helper function to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function LandlordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: landlord, isLoading } = useQuery({
    queryKey: ["landlord", id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/landlords/${id}/`);
      return response.data;
    },
  });
  const handleSendEmail = () => {
    console.log("📧 Sending email for property:", landlord.id);
    toast({
      title: "Email Sent",
      description: `Property details sent to interested parties`,
    });
  };
  if (isLoading) {
    return (
      <div>
        <Header title="Landlord Details" />
        <div className="p-6">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!landlord) {
    return (
      <div>
        <Header title="Landlord Details" />
        <div className="p-6">
          <div className="py-12 text-center">
            <UserCheck className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Landlord not found</h3>
            <Button onClick={() => navigate("/landlords")}>Back to Landlords</Button>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div>
      <Header title="Landlord Details" />
      <div className="space-y-6 p-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/landlords")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Landlords
          </Button>
          {landlord.aml_verified ? (
            <Badge className="gap-1 bg-accent text-white">
              <CheckCircle className="h-3 w-3" />
              AML Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Pending Verification
            </Badge>
          )}
        </div>

        {/* Landlord Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-3xl font-bold text-white">
                  {getInitials(landlord.full_name)}
                </div>
                <div>
                  <CardTitle className="text-2xl">{landlord.full_name}</CardTitle>
                  {landlord.address && (
                    <div className="mt-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{landlord.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Contact Information</CardTitle>
                    <Button size="sm" variant="outline" onClick={handleSendEmail}>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="font-medium">{landlord.email}</div>
                      </div>
                    </div>
                    {landlord.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Phone</div>
                          <div className="font-medium">{landlord.phone}</div>
                        </div>
                      </div>
                    )}
                    {landlord.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Address</div>
                          <div className="font-medium">{landlord.address}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {landlord.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="mb-2 font-semibold">Notes</h3>
                      <p className="text-muted-foreground">{landlord.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {landlord.aml_verification_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Verified On</span>
                        <span className="font-medium">
                          {new Date(landlord.aml_verification_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {(landlord.bank_account_name ||
                    landlord.sort_code ||
                    landlord.account_number) && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="mb-3 font-semibold">Banking Details</h3>
                      <div className="space-y-3">
                        {landlord.bank_account_name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Account Name</span>
                            <span className="font-medium">{landlord.bank_account_name}</span>
                          </div>
                        )}
                        {landlord.sort_code && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sort Code</span>
                            <span className="font-medium">{landlord.sort_code}</span>
                          </div>
                        )}
                        {landlord.account_number && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Account Number</span>
                            <span className="font-medium">
                              ****{landlord.account_number.slice(-4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="mt-6">
            <PropertiesListByLandlord 
              landlordId={id || ""} 
              propertiesCount={landlord.properties_count ?? 0}
            />
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
                      <UserCheck className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Landlord Created</p>
                      <p className="text-sm text-muted-foreground">
                        {landlord.created_at
                          ? new Date(landlord.created_at).toLocaleDateString()
                          : "Recently"}
                      </p>
                    </div>
                  </div>
                  {landlord.updated_at &&
                    landlord.updated_at !== landlord.created_at && (
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Information Updated</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(landlord.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  {landlord.aml_verified && landlord.aml_verification_date && (
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">AML Verified</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(landlord.aml_verification_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
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
                    <FileText className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No documents yet</h3>
                  <p className="text-muted-foreground">
                    Upload documents related to this landlord
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Component to display properties owned by a landlord
function PropertiesListByLandlord({ 
  landlordId, 
  propertiesCount 
}: { 
  landlordId: string;
  propertiesCount: number;
}) {
  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties", "landlord", landlordId],
    queryFn: async () => {
      // Use landlord_id query parameter to filter on the backend
      const response = await api.get(`/api/v1/properties/`, {
        params: { landlord_id: landlordId, limit: 1000 } // Increase limit to get all properties for this landlord
      });
      return response.data;
    },
    enabled: !!landlordId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Properties Portfolio ({propertiesCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Properties Portfolio ({propertiesCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Properties owned by this landlord will appear here"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Properties Portfolio ({propertiesCount})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property: any) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold leading-tight">
                      {capitalizeWords(
                        getFlatOrUnitNumber(property.address_line1, property.address, property.city) || property.city
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {property.city}, {property.postcode}
                    </p>
                  </div>
                  <StatusBadge status={property.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Bed className="h-4 w-4" />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Bath className="h-4 w-4" />
                    <span>{property.bathrooms}</span>
                  </div>
                  {property.rent && (
                    <div className="ml-auto flex items-center gap-1 font-semibold text-primary">
                      <PoundSterling className="h-4 w-4" />
                      <span>{property.rent.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/properties/${property.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
