import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
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

export default function LandlordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
    </div>
  );
}
