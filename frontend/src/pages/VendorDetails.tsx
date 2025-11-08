import { useParams, useNavigate } from "react-router-dom";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Building2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Activity,
  FileText,
  PoundSterling,
  Calendar,
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
import StatusBadge from "@/components/shared/StatusBadge";
import { useVerifyVendorAML } from "@/hooks/useVendors";

export default function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const verifyAML = useVerifyVendorAML();

  const { data: vendor, isLoading } = useQuery({
    queryKey: ["vendors", id],
    queryFn: async () => {
      if (!id) {
        throw new Error("Vendor ID is required");
      }
      const response = await api.get(`/api/v1/vendors/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const handleSendEmail = () => {
    toast({
      title: "Email Sent",
      description: `Vendor details sent successfully`,
    });
  };

  const handleVerifyAML = async () => {
    if (!id) return;
    try {
      await verifyAML.mutateAsync(id);
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Vendor Details" />
        <div className="p-6">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div>
        <Header title="Vendor Details" />
        <div className="p-6">
          <div className="py-12 text-center">
            <Store className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Vendor not found</h3>
            <Button onClick={() => navigate("/vendors")}>Back to Vendors</Button>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getFullName = () => {
    const parts = [vendor.title, vendor.first_name, vendor.last_name].filter(Boolean);
    return parts.join(" ");
  };

  return (
    <div>
      <Header title="Vendor Details" />
      <div className="space-y-6 p-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/vendors")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
          <div className="flex items-center gap-2">
            <StatusBadge status={vendor.status} />
            {vendor.aml_status === "verified" ? (
              <Badge className="gap-1 bg-accent text-white">
                <CheckCircle className="h-3 w-3" />
                AML Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                AML Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Vendor Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-3xl font-bold text-white">
                  {getInitials(vendor.first_name, vendor.last_name)}
                </div>
                <div>
                  <CardTitle className="text-2xl">{getFullName()}</CardTitle>
                  {vendor.current_address && (
                    <div className="mt-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{vendor.current_address}</span>
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
            <TabsTrigger value="sales">Sales</TabsTrigger>
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
                        <div className="font-medium">{vendor.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Primary Phone</div>
                        <div className="font-medium">{vendor.primary_phone}</div>
                      </div>
                    </div>
                    {vendor.secondary_phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Secondary Phone</div>
                          <div className="font-medium">{vendor.secondary_phone}</div>
                        </div>
                      </div>
                    )}
                    {vendor.current_address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Current Address</div>
                          <div className="font-medium">{vendor.current_address}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vendor Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {vendor.date_of_birth && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">Date of Birth</div>
                          <div className="font-medium">
                            {new Date(vendor.date_of_birth).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                    {vendor.nationality && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nationality</span>
                        <span className="font-medium">{vendor.nationality}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AML Status</span>
                      <Badge variant={vendor.aml_status === "verified" ? "default" : "outline"}>
                        {vendor.aml_status}
                      </Badge>
                    </div>
                    {vendor.aml_status !== "verified" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVerifyAML}
                        className="w-full"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verify AML
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Instruction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {vendor.instruction_type && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Instruction Type</span>
                        <span className="font-medium">
                          {vendor.instruction_type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    )}
                    {vendor.agreed_commission && (
                      <div className="flex items-center gap-3">
                        <PoundSterling className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">Agreed Commission</div>
                          <div className="font-medium">{vendor.agreed_commission}</div>
                        </div>
                      </div>
                    )}
                    {vendor.minimum_fee && (
                      <div className="flex items-center gap-3">
                        <PoundSterling className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">Minimum Fee</div>
                          <div className="font-medium">{vendor.minimum_fee}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Properties for Sale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="py-12 text-center">
                    <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">No properties yet</h3>
                    <p className="text-muted-foreground">
                      Properties listed for sale by this vendor will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                      <Store className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Vendor Created</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.created_at
                          ? new Date(vendor.created_at).toLocaleDateString()
                          : "Recently"}
                      </p>
                    </div>
                  </div>
                  {vendor.updated_at &&
                    vendor.updated_at !== vendor.created_at && (
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Information Updated</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(vendor.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  {vendor.aml_status === "verified" && (
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">AML Verified</p>
                        <p className="text-sm text-muted-foreground">
                          {vendor.updated_at
                            ? new Date(vendor.updated_at).toLocaleDateString()
                            : "Recently"}
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
                    Upload documents related to this vendor
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

