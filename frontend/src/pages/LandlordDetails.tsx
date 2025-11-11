import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { format } from "date-fns";
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
  Pencil,
  Trash2,
  CheckSquare,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
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
import { useTasks } from "@/hooks/useTasks";
import { useProperties } from "@/hooks/useProperties";
import { Link } from "react-router-dom";
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

export default function LandlordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLastContactedDialogOpen, setEditLastContactedDialogOpen] = useState(false);
  const [lastContactedDate, setLastContactedDate] = useState<string>("");

  const { data: landlord, isLoading, refetch } = useQuery({
    queryKey: ["landlord", id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/landlords/${id}/`);
      return response.data;
    },
  });

  // Get all tasks to filter by assigned_to
  const { data: allTasks } = useTasks();
  
  // Filter tasks assigned to this landlord (landlords use full_name)
  const assignedTasks = allTasks?.filter(
    (task) => task.assigned_to === landlord?.full_name
  ) || [];

  // Get all properties to filter by landlord_id
  const { data: allProperties } = useProperties();
  
  // Filter properties owned by this landlord
  const landlordProperties = allProperties?.filter(
    (property) => property.landlord_id === landlord?.id
  ) || [];

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.delete(`/api/v1/landlords/${id}/`);
      toast({ title: "Success", description: "Landlord deleted successfully" });
      navigate("/landlords");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete landlord",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const formData = new FormData(e.currentTarget);
    try {
      await api.put(`/api/v1/landlords/${id}/`, {
        full_name: formData.get("full_name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
      });
      toast({ title: "Success", description: "Landlord updated successfully" });
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update landlord",
        variant: "destructive",
      });
    }
  };
  const updateLastContacted = async () => {
    if (!id) return;
    try {
      await api.put(`/api/v1/landlords/${id}/`, {
        last_contacted_at: new Date().toISOString(),
      });
      refetch();
    } catch (error) {
      console.error("Failed to update last contacted:", error);
    }
  };

  const handleEditLastContacted = async () => {
    if (!id || !lastContactedDate) return;
    try {
      const date = new Date(lastContactedDate);
      await api.put(`/api/v1/landlords/${id}/`, {
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
      description: `Email sent to ${landlord?.email || "landlord"}`,
    });
  };

  // Calculate days since last contacted
  const getDaysSinceLastContacted = () => {
    if (!landlord?.last_contacted_at) return null;
    const lastContacted = new Date(landlord.last_contacted_at);
    const now = new Date();
    // Normalize both dates to midnight to compare only dates, not times
    const lastContactedDate = new Date(lastContacted.getFullYear(), lastContacted.getMonth(), lastContacted.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = todayDate.getTime() - lastContactedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceLastContacted = getDaysSinceLastContacted();
  const [expandedInfo, setExpandedInfo] = useState(false);
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
          <div className="flex items-center gap-2">
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
                                if (landlord.last_contacted_at) {
                                  const date = new Date(landlord.last_contacted_at);
                                  setLastContactedDate(date.toISOString().split('T')[0]);
                                }
                                setEditLastContactedDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            {landlord.last_contacted_at ? (
                              <>
                                <div className="font-medium">
                                  {format(new Date(landlord.last_contacted_at), "dd/MM/yyyy")}
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

                {/* Complete Landlord Information Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Complete Landlord Information</CardTitle>
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
                        const hasAllData = landlord.bank_account_name && landlord.sort_code && 
                          landlord.account_number && landlord.aml_verified;
                        
                        return !hasAllData && (
                          <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 text-center">
                            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              Some landlord information is missing
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                await updateLastContacted();
                                toast({
                                  title: "Request Sent",
                                  description: "A request has been sent to the landlord to complete their profile information",
                                });
                              }}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Request Landlord to Complete Profile
                            </Button>
                          </div>
                        );
                      })()}

                      {/* Banking & Compliance Section */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 font-semibold">
                          <FileText className="h-5 w-5 text-primary" />
                          Banking & Compliance
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-sm text-muted-foreground">Bank Account Name</div>
                            <div className="font-medium">
                              {landlord.bank_account_name || "Not provided"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Sort Code</div>
                            <div className="font-medium">
                              {landlord.sort_code || "Not provided"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Account Number</div>
                            <div className="font-medium">
                              {landlord.account_number || "Not provided"}
                            </div>
                          </div>
                          {landlord.aml_verification_date && (
                            <div>
                              <div className="text-sm text-muted-foreground">AML Verification Date</div>
                              <div className="font-medium">
                                {format(new Date(landlord.aml_verification_date), "dd/MM/yyyy")}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-muted-foreground">AML Status</div>
                            <div className="font-medium">
                              {landlord.aml_verified ? (
                                <Badge className="bg-green-500">Verified</Badge>
                              ) : (
                                <Badge variant="outline">Pending</Badge>
                              )}
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

              <div className="h-full">
                {/* Notes Section - matches height of Contact Info + Details */}
                <NotesSection
                  entityType="landlord"
                  entityId={id || ""}
                  initialNotes={landlord?.notes || ""}
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
                {landlordProperties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No properties</p>
                ) : (
                  <div className="space-y-2">
                    {landlordProperties.map((property) => (
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
                            {property.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Properties Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-12 text-center">
                  <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No properties yet</h3>
                  <p className="text-muted-foreground">
                    Properties associated with this landlord will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
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
                          ? format(new Date(landlord.created_at), "dd/MM/yyyy")
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
                            {format(new Date(landlord.updated_at), "dd/MM/yyyy")}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Landlord</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" defaultValue={landlord?.full_name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={landlord?.email} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={landlord?.phone} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={landlord?.address} />
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
              This action cannot be undone. This will permanently delete the landlord
              "{landlord?.full_name}" and all associated data.
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
