import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import {
  Wrench,
  ArrowLeft,
  AlertTriangle,
  Clock,
  Building2,
  User,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  X,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  UserCheck,
  Tag,
  UserCircle,
  Briefcase,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMaintenanceIssue,
  useUpdateMaintenance,
  useDeleteMaintenance,
} from "@/hooks/useMaintenance";
import { useProperty } from "@/hooks/useProperties";
import { useLandlord } from "@/hooks/useLandlords";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import { getFlatOrUnitNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function MaintenanceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    status: "",
    priority: "",
    assigned_to: "",
    contractor_name: "",
    quote_amount: "",
    actual_cost: "",
    resolution_notes: "",
    internal_notes: "",
  });

  const { data: issue, isLoading, refetch } = useMaintenanceIssue(id || "");
  const { data: property } = useProperty(issue?.property_id || "");
  const { data: landlord } = useLandlord(property?.landlord_id || property?.landlord?.id || "");
  const updateMaintenance = useUpdateMaintenance();
  const deleteMaintenance = useDeleteMaintenance();

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    try {
      const updateData: any = {};
      if (updateFormData.status) updateData.status = updateFormData.status;
      if (updateFormData.priority) updateData.priority = updateFormData.priority;
      if (updateFormData.assigned_to) updateData.assigned_to = updateFormData.assigned_to;
      if (updateFormData.contractor_name) updateData.contractor_name = updateFormData.contractor_name;
      if (updateFormData.quote_amount) updateData.quote_amount = parseFloat(updateFormData.quote_amount);
      if (updateFormData.actual_cost) updateData.actual_cost = parseFloat(updateFormData.actual_cost);
      if (updateFormData.resolution_notes) updateData.resolution_notes = updateFormData.resolution_notes;
      if (updateFormData.internal_notes) updateData.internal_notes = updateFormData.internal_notes;

      await updateMaintenance.mutateAsync({ id, ...updateData });
      setEditOpen(false);
      setUpdateFormData({
        status: "",
        priority: "",
        assigned_to: "",
        contractor_name: "",
        quote_amount: "",
        actual_cost: "",
        resolution_notes: "",
        internal_notes: "",
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMaintenance.mutateAsync(id);
      navigate("/maintenance");
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Maintenance Issue" />
        <div className="p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div>
        <Header title="Maintenance Issue" />
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <p>Maintenance issue not found</p>
              <Button asChild className="mt-4">
                <Link to="/maintenance">Back to Maintenance</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Maintenance Issue" />
      <div className="p-6">
        {/* Header Bar */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link to="/maintenance">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Maintenance
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Maintenance Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Wrench className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-2xl mb-2">{issue.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <StatusBadge status={issue.status} />
                    <StatusBadge status={issue.priority} />
                    {issue.is_emergency && (
                      <Badge variant="destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Emergency
                      </Badge>
                    )}
                    {issue.is_overdue && (
                      <Badge variant="outline" className="border-orange-500 text-orange-500">
                        Overdue
                      </Badge>
                    )}
                    {issue.requires_attention && (
                      <Badge variant="outline" className="border-red-500 text-red-500">
                        Requires Attention
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs break-all">{issue.id}</span>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(issue.id);
                            setCopiedId(true);
                            toast({
                              title: "Copied!",
                              description: "Maintenance issue ID copied to clipboard",
                            });
                            setTimeout(() => setCopiedId(false), 2000);
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to copy ID",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        title="Copy ID"
                      >
                        {copiedId ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    {issue.days_open !== undefined && (
                      <>
                        <span>•</span>
                        <span>{issue.days_open} day{issue.days_open !== 1 ? "s" : ""} open</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Info Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {property && (
            <Card className="group hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <Link to={`/properties/${issue.property_id}`} className="block">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Property</p>
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {getFlatOrUnitNumber(property.address || property.address_line1 || "", property.property_type)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {property.city}, {property.postcode}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
          {landlord && (
            <Card className="group hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <Link to={`/landlords/${landlord.id}`} className="block">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Landlord</p>
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {landlord.full_name}
                      </p>
                      {landlord.email && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{landlord.email}</p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Days Open</p>
                  <p className="text-2xl font-bold">{issue.days_open || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Since {formatDate(issue.reported_date).split(',')[0]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{issue.description || "No description provided."}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 space-y-6">
                  {/* Vertical line */}
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                  
                  {/* Timeline items */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background z-10" />
                    <div className="flex-1 pt-0.5">
                      <p className="text-xs text-muted-foreground mb-1">Reported</p>
                      <p className="text-sm font-medium">{formatDate(issue.reported_date)}</p>
                    </div>
                  </div>
                  
                  {issue.acknowledged_date && (
                    <div className="relative flex items-start gap-4">
                      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background z-10" />
                      <div className="flex-1 pt-0.5">
                        <p className="text-xs text-muted-foreground mb-1">Acknowledged</p>
                        <p className="text-sm font-medium">{formatDate(issue.acknowledged_date)}</p>
                      </div>
                    </div>
                  )}
                  
                  {issue.inspection_date && (
                    <div className="relative flex items-start gap-4">
                      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-blue-500 border-2 border-background z-10" />
                      <div className="flex-1 pt-0.5">
                        <p className="text-xs text-muted-foreground mb-1">Inspected</p>
                        <p className="text-sm font-medium">{formatDate(issue.inspection_date)}</p>
                      </div>
                    </div>
                  )}
                  
                  {issue.started_date && (
                    <div className="relative flex items-start gap-4">
                      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-yellow-500 border-2 border-background z-10" />
                      <div className="flex-1 pt-0.5">
                        <p className="text-xs text-muted-foreground mb-1">Started</p>
                        <p className="text-sm font-medium">{formatDate(issue.started_date)}</p>
                      </div>
                    </div>
                  )}
                  
                  {issue.completed_date && (
                    <div className="relative flex items-start gap-4">
                      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-green-600 border-2 border-background z-10" />
                      <div className="flex-1 pt-0.5">
                        <p className="text-xs text-muted-foreground mb-1">Completed</p>
                        <p className="text-sm font-medium">{formatDate(issue.completed_date)}</p>
                      </div>
                    </div>
                  )}
                  
                  {issue.closed_date && (
                    <div className="relative flex items-start gap-4">
                      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-gray-500 border-2 border-background z-10" />
                      <div className="flex-1 pt-0.5">
                        <p className="text-xs text-muted-foreground mb-1">Closed</p>
                        <p className="text-sm font-medium">{formatDate(issue.closed_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {issue.resolution_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Resolution Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{issue.resolution_notes}</p>
                </CardContent>
              </Card>
            )}

            {issue.internal_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{issue.internal_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Issue Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Issue Type</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {issue.issue_type}
                  </Badge>
                </div>
                
                {issue.reported_by && (
                  <div className="space-y-2 pb-3 border-b">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserCircle className="h-3.5 w-3.5" />
                      <span>Reported By</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{issue.reported_by}</p>
                      {issue.reported_by_email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <a href={`mailto:${issue.reported_by_email}`} className="hover:text-primary hover:underline">
                            {issue.reported_by_email}
                          </a>
                        </div>
                      )}
                      {issue.reported_by_phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${issue.reported_by_phone}`} className="hover:text-primary hover:underline">
                            {issue.reported_by_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {issue.assigned_to && (
                  <div className="space-y-2 pb-3 border-b">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span>Assigned To</span>
                    </div>
                    <p className="text-sm font-medium">{issue.assigned_to}</p>
                  </div>
                )}
                
                {issue.contractor_name && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>Contractor</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{issue.contractor_name}</p>
                      {issue.contractor_contact && (
                        <p className="text-xs text-muted-foreground">{issue.contractor_contact}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {issue.estimated_cost || issue.quote_amount || issue.actual_cost ? (
                  <>
                    {issue.estimated_cost && (
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm text-muted-foreground">Estimated</span>
                        <span className="text-sm font-medium">£{issue.estimated_cost.toFixed(2)}</span>
                      </div>
                    )}
                    {issue.quote_amount && (
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm text-muted-foreground">Quote</span>
                        <span className="text-sm font-semibold text-primary">£{issue.quote_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {issue.actual_cost && (
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm text-muted-foreground">Actual</span>
                        <span className="text-sm font-bold">£{issue.actual_cost.toFixed(2)}</span>
                      </div>
                    )}
                    {issue.actual_cost && issue.estimated_cost && (
                      <div className="pt-2 mt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Variance</span>
                          <span className={`text-xs font-medium ${
                            issue.actual_cost > issue.estimated_cost ? 'text-red-500' : 'text-green-500'
                          }`}>
                            {issue.actual_cost > issue.estimated_cost ? '+' : ''}
                            £{(issue.actual_cost - issue.estimated_cost).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No financial information</p>
                  </div>
                )}
                {issue.landlord_approved && (
                  <div className="flex items-center gap-2 pt-2 mt-2 border-t">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Landlord Approved</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Maintenance Issue</DialogTitle>
              <DialogDescription>Update the maintenance issue details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={updateFormData.status || issue.status}
                      onValueChange={(value) =>
                        setUpdateFormData({ ...updateFormData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reported">Reported</SelectItem>
                        <SelectItem value="acknowledged">Acknowledged</SelectItem>
                        <SelectItem value="inspected">Inspected</SelectItem>
                        <SelectItem value="quoted">Quoted</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={updateFormData.priority || issue.priority}
                      onValueChange={(value) =>
                        setUpdateFormData({ ...updateFormData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assigned To</Label>
                  <Input
                    id="assigned_to"
                    value={updateFormData.assigned_to || issue.assigned_to || ""}
                    onChange={(e) =>
                      setUpdateFormData({ ...updateFormData, assigned_to: e.target.value })
                    }
                    placeholder="Contractor or staff member"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractor_name">Contractor Name</Label>
                  <Input
                    id="contractor_name"
                    value={updateFormData.contractor_name || issue.contractor_name || ""}
                    onChange={(e) =>
                      setUpdateFormData({ ...updateFormData, contractor_name: e.target.value })
                    }
                    placeholder="Contractor company name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quote_amount">Quote Amount</Label>
                    <Input
                      id="quote_amount"
                      type="number"
                      step="0.01"
                      value={updateFormData.quote_amount || issue.quote_amount || ""}
                      onChange={(e) =>
                        setUpdateFormData({ ...updateFormData, quote_amount: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual_cost">Actual Cost</Label>
                    <Input
                      id="actual_cost"
                      type="number"
                      step="0.01"
                      value={updateFormData.actual_cost || issue.actual_cost || ""}
                      onChange={(e) =>
                        setUpdateFormData({ ...updateFormData, actual_cost: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolution_notes">Resolution Notes</Label>
                  <Textarea
                    id="resolution_notes"
                    value={updateFormData.resolution_notes || issue.resolution_notes || ""}
                    onChange={(e) =>
                      setUpdateFormData({ ...updateFormData, resolution_notes: e.target.value })
                    }
                    rows={4}
                    placeholder="Describe the resolution..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internal_notes">Internal Notes</Label>
                  <Textarea
                    id="internal_notes"
                    value={updateFormData.internal_notes || issue.internal_notes || ""}
                    onChange={(e) =>
                      setUpdateFormData({ ...updateFormData, internal_notes: e.target.value })
                    }
                    rows={4}
                    placeholder="Internal notes (staff only)..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMaintenance.isPending}>
                  Update
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Maintenance Issue</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this maintenance issue? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

