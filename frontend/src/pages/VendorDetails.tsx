import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { format } from "date-fns";
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
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  Shield,
  FileCheck,
  Pencil,
  Trash2,
  CheckSquare,
  Edit,
  UserCheck,
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
import { useTasks } from "@/hooks/useTasks";
import { useProperties } from "@/hooks/useProperties";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NotesSection from "@/components/shared/NotesSection";

export default function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const verifyAML = useVerifyVendorAML();
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLastContactedDialogOpen, setEditLastContactedDialogOpen] = useState(false);
  const [lastContactedDate, setLastContactedDate] = useState<string>("");

  const { data: vendor, isLoading, refetch } = useQuery({
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

  const updateLastContacted = async () => {
    if (!id) return;
    try {
      await api.put(`/api/v1/vendors/${id}`, {
        last_contacted_at: new Date().toISOString(),
      });
      refetch();
    } catch (error) {
      console.error("Failed to update last contacted:", error);
    }
  };

  // Calculate days since last contacted
  const getDaysSinceLastContacted = () => {
    if (!vendor?.last_contacted_at) return null;
    const lastContacted = new Date(vendor.last_contacted_at);
    const now = new Date();
    // Normalize both dates to midnight to compare only dates, not times
    const lastContactedDate = new Date(lastContacted.getFullYear(), lastContacted.getMonth(), lastContacted.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = todayDate.getTime() - lastContactedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceLastContacted = getDaysSinceLastContacted();

  // Get all tasks to filter by assigned_to
  const { data: allTasks } = useTasks();
  
  // Get vendor's full name for matching tasks
  const getVendorFullName = () => {
    if (!vendor) return "";
    return `${vendor.first_name || ""} ${vendor.last_name || ""}`.trim();
  };
  
  // Filter tasks assigned to this vendor
  const assignedTasks = allTasks?.filter(
    (task) => task.assigned_to === getVendorFullName()
  ) || [];

  // Get all properties to filter by vendor_id
  const { data: allProperties } = useProperties();
  
  // Filter properties owned by this vendor
  const vendorProperties = allProperties?.filter(
    (property) => property.vendor_id === vendor?.id
  ) || [];

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.delete(`/api/v1/vendors/${id}`);
      toast({ title: "Success", description: "Vendor deleted successfully" });
      navigate("/vendors");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const formData = new FormData(e.currentTarget);
    try {
      await api.put(`/api/v1/vendors/${id}`, {
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        email: formData.get("email"),
        primary_phone: formData.get("primary_phone"),
      });
      toast({ title: "Success", description: "Vendor updated successfully" });
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    }
  };

  const handleEditLastContacted = async () => {
    if (!id || !lastContactedDate) return;
    try {
      const date = new Date(lastContactedDate);
      await api.put(`/api/v1/vendors/${id}`, {
        last_contacted_at: date.toISOString(),
      });
      toast({ title: "Success", description: "Last contacted date updated successfully" });
      setEditLastContactedDialogOpen(false);
      setLastContactedDate("");
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update last contacted date",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    await updateLastContacted();
    toast({
      title: "Email Sent",
      description: `Email sent to ${vendor?.email || "vendor"}`,
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
    return `${vendor.first_name} ${vendor.last_name}`;
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
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)} className="text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Vendor Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-3xl font-bold text-white">
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
              {vendor.managed_by === user?.id ? (
                <Badge className="bg-accent text-white text-sm font-semibold px-2 py-1">
                  <UserCheck className="h-4 w-4 mr-1" />
                  Managed by Me
                </Badge>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-right whitespace-nowrap">
                    Managed by: {vendor.managed_by_name || "Unassigned"}
                  </span>
                </div>
              )}
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
              <div className="space-y-6">
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
                          <div className="text-sm text-muted-foreground">Phone</div>
                          <div className="font-medium">{vendor.primary_phone}</div>
                        </div>
                      </div>
                      {vendor.current_address && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">Current Address</div>
                            <div className="font-medium">{vendor.current_address}</div>
                          </div>
                        </div>
                      )}
                      {/* Last Contacted */}
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">Last Contacted</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                if (vendor.last_contacted_at) {
                                  const date = new Date(vendor.last_contacted_at);
                                  setLastContactedDate(date.toISOString().split('T')[0]);
                                }
                                setEditLastContactedDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            {vendor.last_contacted_at ? (
                              <>
                                <div className="font-medium">
                                  {format(new Date(vendor.last_contacted_at), "dd/MM/yyyy")}
                                </div>
                                {daysSinceLastContacted !== null && (
                                  <div className="text-sm">
                                    (<span style={{ color: `hsl(var(--accent))`, fontWeight: 600 }}>
                                      {daysSinceLastContacted}
                                    </span>{" "}
                                    {daysSinceLastContacted === 1 ? "day" : "days"} ago)
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-sm text-muted-foreground">Never contacted</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Complete Vendor Information Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Complete Vendor Information</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedInfo(!expandedInfo)}
                      >
                        {expandedInfo ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Expand
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  {expandedInfo && (
                    <CardContent className="space-y-6">
                      {/* Check if all data is filled */}
                      {(() => {
                        const hasAllData = vendor.date_of_birth && vendor.nationality && 
                          vendor.aml_verification_date && vendor.conveyancer_name && 
                          vendor.instruction_date && vendor.agreed_commission;
                        
                        return !hasAllData && (
                          <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 text-center">
                            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              Some vendor information is missing
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                await updateLastContacted();
                                toast({
                                  title: "Request Sent",
                                  description: "A request has been sent to the vendor to complete their profile information",
                                });
                              }}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Request Vendor to Complete Profile
                            </Button>
                          </div>
                        );
                      })()}

                      {/* Compliance & Verification Section */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 font-semibold">
                          <Shield className="h-5 w-5 text-primary" />
                          Compliance & Verification
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-sm text-muted-foreground">ID Document Type</div>
                            <div className="font-medium">
                              {vendor.id_document_type || "Not provided"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Proof of Address Type</div>
                            <div className="font-medium">
                              {vendor.proof_of_address_type || "Not provided"}
                            </div>
                          </div>
                          {vendor.aml_verification_date && (
                            <div>
                              <div className="text-sm text-muted-foreground">AML Completed Date</div>
                              <div className="font-medium">
                                {format(new Date(vendor.aml_verification_date), "dd/MM/yyyy")}
                              </div>
                            </div>
                          )}
                          {vendor.aml_verification_expiry && (
                            <div>
                              <div className="text-sm text-muted-foreground">AML Expiry Date</div>
                              <div className="font-medium">
                                {format(new Date(vendor.aml_verification_expiry), "dd/MM/yyyy")}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-muted-foreground">PEP Check</div>
                            <div className="font-medium">
                              {vendor.pep_check ? "Completed" : "Not completed"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Proof of Ownership</div>
                            <div className="font-medium">
                              {vendor.proof_of_ownership_uploaded ? "Uploaded" : "Not uploaded"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sales Instruction Details */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 font-semibold">
                          <Briefcase className="h-5 w-5 text-primary" />
                          Sales Instruction & Terms
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {vendor.instruction_date && (
                            <div>
                              <div className="text-sm text-muted-foreground">Instruction Date</div>
                              <div className="font-medium">
                                {format(new Date(vendor.instruction_date), "dd/MM/yyyy")}
                              </div>
                            </div>
                          )}
                          {vendor.contract_expiry_date && (
                            <div>
                              <div className="text-sm text-muted-foreground">Contract Expiry Date</div>
                              <div className="font-medium">
                                {format(new Date(vendor.contract_expiry_date), "dd/MM/yyyy")}
                              </div>
                            </div>
                          )}
                          {vendor.contract_length_weeks && (
                            <div>
                              <div className="text-sm text-muted-foreground">Contract Length</div>
                              <div className="font-medium">{vendor.contract_length_weeks} weeks</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Conveyancer Information */}
                      {(vendor.conveyancer_name || vendor.conveyancer_firm || vendor.conveyancer_contact) && (
                        <div className="space-y-4">
                          <h3 className="flex items-center gap-2 font-semibold">
                            <FileCheck className="h-5 w-5 text-primary" />
                            Conveyancer Information
                          </h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            {vendor.conveyancer_name && (
                              <div>
                                <div className="text-sm text-muted-foreground">Conveyancer Name</div>
                                <div className="font-medium">{vendor.conveyancer_name}</div>
                              </div>
                            )}
                            {vendor.conveyancer_firm && (
                              <div>
                                <div className="text-sm text-muted-foreground">Law Firm</div>
                                <div className="font-medium">{vendor.conveyancer_firm}</div>
                              </div>
                            )}
                            {vendor.conveyancer_contact && (
                              <div>
                                <div className="text-sm text-muted-foreground">Contact</div>
                                <div className="font-medium">{vendor.conveyancer_contact}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Relationship Tracking */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 font-semibold">
                          <User className="h-5 w-5 text-primary" />
                          Relationship & Tracking
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {vendor.source_of_lead && (
                            <div>
                              <div className="text-sm text-muted-foreground">Source of Lead</div>
                              <div className="font-medium capitalize">
                                {vendor.source_of_lead.replace("_", " ")}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-muted-foreground">Marketing Consent</div>
                            <div className="font-medium">
                              {vendor.marketing_consent ? "Yes" : "No"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {vendor.date_of_birth && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="text-sm text-muted-foreground">Date of Birth</div>
                            <div className="font-medium">
                              {format(new Date(vendor.date_of_birth), "dd/MM/yyyy")}
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

              <div className="h-full">
                {/* Notes Section - matches height of Contact Info + Details */}
                <NotesSection
                  entityType="vendor"
                  entityId={id || ""}
                  initialNotes={vendor?.notes || ""}
                  className="h-full"
                />
              </div>
            </div>

            {/* Assigned Tasks Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Assigned Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assigned tasks</p>
                ) : (
                  <div className="space-y-2">
                    {assignedTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => navigate("/tasks")}
                        className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{task.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Properties Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vendorProperties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No properties</p>
                ) : (
                  <div className="space-y-2">
                    {vendorProperties.map((property) => (
                      <Link
                        key={property.id}
                        to={`/properties/${property.id}`}
                        className="block w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {property.address_line1 || property.address || property.city}
                            </span>
                            {property.postcode && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {property.city}, {property.postcode}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {property.sales_status || property.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Properties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vendorProperties.length === 0 ? (
                    <div className="py-12 text-center">
                      <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold">No properties yet</h3>
                      <p className="text-muted-foreground">
                        Properties listed for sale by this vendor will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {vendorProperties.map((property) => (
                        <Link
                          key={property.id}
                          to={`/properties/${property.id}`}
                          className="block w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <span className="text-sm font-medium">
                                {property.address_line1 || property.address || property.city}
                              </span>
                              {property.postcode && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {property.city}, {property.postcode}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {property.sales_status || property.status}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
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
                          ? format(new Date(vendor.created_at), "dd/MM/yyyy")
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
                            {format(new Date(vendor.updated_at), "dd/MM/yyyy")}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" name="first_name" defaultValue={vendor?.first_name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" name="last_name" defaultValue={vendor?.last_name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={vendor?.email} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="primary_phone">Phone</Label>
                <Input id="primary_phone" name="primary_phone" defaultValue={vendor?.primary_phone} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vendor
              "{vendor?.first_name} {vendor?.last_name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Last Contacted Dialog */}
      <Dialog open={editLastContactedDialogOpen} onOpenChange={setEditLastContactedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Last Contacted Date</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="last_contacted_date">Last Contacted Date</Label>
              <Input
                id="last_contacted_date"
                type="date"
                value={lastContactedDate}
                onChange={(e) => setLastContactedDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditLastContactedDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleEditLastContacted}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

