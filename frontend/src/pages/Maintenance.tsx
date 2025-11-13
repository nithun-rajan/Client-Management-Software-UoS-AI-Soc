import { useState } from "react";
import {
  Wrench,
  AlertTriangle,
  Clock,
  Building2,
  Eye,
  Plus,
  Search,
  X,
  Filter,
  Calendar,
  User,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMaintenance,
  useCreateMaintenance,
  useDeleteMaintenance,
  useEmergencyMaintenance,
  useOverdueMaintenance,
} from "@/hooks/useMaintenance";
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { Link } from "react-router-dom";
import { MaintenanceIssue } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFlatOrUnitNumber } from "@/lib/utils";

export default function Maintenance() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<MaintenanceIssue | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: properties } = useProperties();
  const { data: maintenance, isLoading } = useMaintenance({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });
  const { data: emergencies } = useEmergencyMaintenance();
  const { data: overdue } = useOverdueMaintenance();
  const createMaintenance = useCreateMaintenance();
  const deleteMaintenance = useDeleteMaintenance();

  const [createFormData, setCreateFormData] = useState({
    property_id: "",
    issue_type: "repair",
    priority: "medium",
    is_emergency: "false",
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!createFormData.property_id) {
      // Property is required - form validation should handle this, but adding safety check
      return;
    }
    
    try {
      await createMaintenance.mutateAsync({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        property_id: createFormData.property_id,
        issue_type: createFormData.issue_type,
        priority: createFormData.priority,
        is_emergency: createFormData.is_emergency === "true",
        reported_by: formData.get("reported_by") as string || undefined,
        reported_by_email: formData.get("reported_by_email") as string || undefined,
        reported_by_phone: formData.get("reported_by_phone") as string || undefined,
      });
      setCreateOpen(false);
      setCreateFormData({
        property_id: "",
        issue_type: "repair",
        priority: "medium",
        is_emergency: "false",
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = (issue: MaintenanceIssue) => {
    setSelectedIssue(issue);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedIssue) return;
    try {
      await deleteMaintenance.mutateAsync(selectedIssue.id);
      setDeleteOpen(false);
      setSelectedIssue(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Filter maintenance based on active tab and search
  const getFilteredMaintenance = () => {
    let filtered = maintenance || [];

    // Apply tab filter
    if (activeTab === "emergencies") {
      filtered = emergencies || [];
    } else if (activeTab === "overdue") {
      filtered = overdue || [];
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.title?.toLowerCase().includes(query) ||
          issue.description?.toLowerCase().includes(query) ||
          issue.reported_by?.toLowerCase().includes(query) ||
          issue.property_id?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredMaintenance = getFilteredMaintenance();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Maintenance" />
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

  return (
    <div>
      <Header title="Maintenance Issues" />
      <div className="p-6">
        {/* Header Actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search maintenance issues..."
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
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Issue
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All Issues ({maintenance?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="emergencies">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Emergencies ({emergencies?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="overdue">
              <Clock className="mr-2 h-4 w-4" />
              Overdue ({overdue?.length || 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="reported">Reported</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="inspected">Inspected</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter || "all"} onValueChange={(value) => setPriorityFilter(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Maintenance List */}
        {filteredMaintenance.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance issues found"
            description={
              searchQuery || statusFilter || priorityFilter
                ? "Try adjusting your filters"
                : "Create a new maintenance issue to get started"
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMaintenance.map((issue) => (
              <Card
                key={issue.id}
                className={`transition-shadow hover:shadow-lg ${
                  issue.is_emergency ? "border-red-500 border-2" : ""
                } ${issue.is_overdue ? "border-orange-500" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{issue.title}</CardTitle>
                    {issue.is_emergency && (
                      <Badge variant="destructive" className="ml-2">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Emergency
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <StatusBadge status={issue.status} />
                    <StatusBadge status={issue.priority} />
                    {issue.is_overdue && (
                      <Badge variant="outline" className="border-orange-500 text-orange-500">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {issue.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const property = properties?.find(p => p.id === issue.property_id);
                      return (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          {property ? (
                            <Link 
                              to={`/properties/${issue.property_id}`}
                              className="text-muted-foreground hover:text-primary hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {getFlatOrUnitNumber(property.address || property.address_line1 || "", property.property_type)}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground truncate">
                              Property: {issue.property_id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    {issue.reported_by && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">{issue.reported_by}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Reported: {formatDate(issue.reported_date)}
                      </span>
                    </div>
                    {issue.days_open !== undefined && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">
                          {issue.days_open} day{issue.days_open !== 1 ? "s" : ""} open
                        </span>
                      </div>
                    )}
                    {issue.quote_amount && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">
                          Quote: £{issue.quote_amount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/maintenance/${issue.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(issue)}
                    className="text-destructive hover:text-destructive"
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Maintenance Issue</DialogTitle>
              <DialogDescription>
                Report a new maintenance issue for a property
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" name="description" required rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="property_id">Property *</Label>
                    <Select
                      value={createFormData.property_id || undefined}
                      onValueChange={(value) =>
                        setCreateFormData({ ...createFormData, property_id: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties && properties.length > 0 ? (
                          properties.map((prop) => (
                            <SelectItem key={prop.id} value={prop.id}>
                              {prop.address || prop.address_line1 || prop.id}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-properties" disabled>No properties available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue_type">Issue Type *</Label>
                    <Select
                      value={createFormData.issue_type}
                      onValueChange={(value) =>
                        setCreateFormData({ ...createFormData, issue_type: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="heating">Heating</SelectItem>
                        <SelectItem value="structural">Structural</SelectItem>
                        <SelectItem value="appliance">Appliance</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="gardening">Gardening</SelectItem>
                        <SelectItem value="decoration">Decoration</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      value={createFormData.priority}
                      onValueChange={(value) =>
                        setCreateFormData({ ...createFormData, priority: value })
                      }
                      required
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
                  <div className="space-y-2">
                    <Label htmlFor="is_emergency">Emergency</Label>
                    <Select
                      value={createFormData.is_emergency}
                      onValueChange={(value) =>
                        setCreateFormData({ ...createFormData, is_emergency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reported_by">Reported By</Label>
                  <Input id="reported_by" name="reported_by" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reported_by_email">Email</Label>
                    <Input id="reported_by_email" name="reported_by_email" type="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reported_by_phone">Phone</Label>
                    <Input id="reported_by_phone" name="reported_by_phone" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMaintenance.isPending}>
                  Create Issue
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Maintenance Issue</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this maintenance issue? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMaintenance.isPending}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

