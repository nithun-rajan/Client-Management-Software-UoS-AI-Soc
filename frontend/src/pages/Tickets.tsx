import { useState } from "react";
import {
  Wrench,
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Search,
  X,
  Home,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useTickets,
  useCreateTicket,
  useUpdateTicket,
  useDeleteTicket,
} from "@/hooks/useTickets";
import { useProperties } from "@/hooks/useProperties";
import { useApplicants } from "@/hooks/useApplicants";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/shared/EmptyState";
import { Ticket } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Tickets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);

  const filters: { status?: string; urgency?: string; priority?: string } = {};
  if (statusFilter !== "all") filters.status = statusFilter;
  if (urgencyFilter !== "all") filters.urgency = urgencyFilter;
  if (priorityFilter !== "all") filters.priority = priorityFilter;

  const { data: tickets, isLoading } = useTickets(filters);
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: applicants, isLoading: applicantsLoading } = useApplicants();
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  // Form state
  const [formData, setFormData] = useState<Partial<Ticket>>({
    title: "",
    description: "",
    status: "new",
    urgency: "routine",
    ticket_category: "",
    priority: "low",
    reported_date: format(new Date(), "yyyy-MM-dd"),
    property_id: "",
    applicant_id: undefined,
    assigned_contractor_id: undefined,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "new",
      urgency: "routine",
      ticket_category: "",
      priority: "low",
      reported_date: format(new Date(), "yyyy-MM-dd"),
      property_id: "",
      applicant_id: undefined,
      assigned_contractor_id: undefined,
    });
  };

  const handleCreate = () => {
    resetForm();
    setSelectedTicket(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description || "",
      status: ticket.status,
      urgency: ticket.urgency,
      ticket_category: ticket.ticket_category,
      priority: ticket.priority,
      reported_date: ticket.reported_date ? ticket.reported_date.split("T")[0] : format(new Date(), "yyyy-MM-dd"),
      property_id: ticket.property_id,
      applicant_id: ticket.applicant_id,
      assigned_contractor_id: ticket.assigned_contractor_id,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (ticketId: string) => {
    setTicketToDelete(ticketId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (ticketToDelete) {
      deleteTicket.mutate(ticketToDelete);
      setDeleteConfirmOpen(false);
      setTicketToDelete(null);
    }
  };

  const handleSubmitCreate = () => {
    if (!formData.title || !formData.property_id || !formData.ticket_category || !formData.reported_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    createTicket.mutate(formData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        resetForm();
      },
    });
  };

  const handleSubmitUpdate = () => {
    if (!selectedTicket || !formData.title || !formData.property_id || !formData.ticket_category || !formData.reported_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateTicket.mutate(
      { id: selectedTicket.id, ...formData },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedTicket(null);
          resetForm();
        },
      }
    );
  };

  const getStatusColor = (status: Ticket["status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "open":
        return "bg-yellow-500";
      case "in_progress":
        return "bg-purple-500";
      case "resolved":
        return "bg-green-500";
      case "closed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getUrgencyColor = (urgency: Ticket["urgency"]) => {
    switch (urgency) {
      case "emergency":
        return "bg-red-600";
      case "urgent":
        return "bg-orange-500";
      case "normal":
        return "bg-yellow-500";
      case "routine":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-600";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const ticketCategories = [
    "Plumbing",
    "Electrical",
    "Heating",
    "Structural",
    "Appliance",
    "Cleaning",
    "Gardening",
    "Decoration",
    "Emergency",
    "Other",
  ];

  const filteredTickets = tickets?.filter((ticket) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.title.toLowerCase().includes(query) ||
      ticket.description?.toLowerCase().includes(query) ||
      ticket.ticket_category?.toLowerCase().includes(query)
    );
  }) || [];

  if (isLoading) {
    return (
      <div>
        <Header title="Tickets" />
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Tickets" />
      <div className="p-6 space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No tickets found"
            description={
              searchQuery || statusFilter !== "all" || urgencyFilter !== "all" || priorityFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating a new maintenance ticket"
            }
            actionLabel="New Ticket"
            onAction={handleCreate}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTickets.map((ticket) => {
              const property = properties?.find((p) => p.id === ticket.property_id);
              const applicant = applicants?.find((a) => a.id === ticket.applicant_id);
              
              return (
                <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{ticket.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(ticket)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ticket.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                      <Badge className={getUrgencyColor(ticket.urgency)}>
                        {ticket.urgency}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {ticket.description && (
                        <p className="text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Home className="h-4 w-4" />
                        <span className="truncate">
                          {property
                            ? `${property.address_line1 || property.address || ""} ${property.postcode || ""}`.trim()
                            : "Property not found"}
                        </span>
                      </div>
                      {applicant && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>Reported by: {applicant.first_name} {applicant.last_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Reported: {ticket.reported_date ? format(new Date(ticket.reported_date), "dd/MM/yyyy") : "N/A"}
                        </span>
                      </div>
                      {ticket.ticket_category && (
                        <div className="text-xs text-muted-foreground">
                          Category: {ticket.ticket_category}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>
              Create a new maintenance ticket or repair request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter ticket title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter ticket description"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property_id">Property *</Label>
                <Select
                  value={formData.property_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, property_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertiesLoading ? (
                      <SelectItem value="__loading__" disabled>Loading properties...</SelectItem>
                    ) : !properties || properties.length === 0 ? (
                      <SelectItem value="__no_properties__" disabled>No properties available</SelectItem>
                    ) : (
                      properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address_line1 || property.address || "Unknown"} - {property.postcode || ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ticket_category">Category *</Label>
                <Select
                  value={formData.ticket_category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ticket_category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Ticket["status"]) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="urgency">Urgency</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value: Ticket["urgency"]) =>
                    setFormData({ ...formData, urgency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Ticket["priority"]) =>
                    setFormData({ ...formData, priority: value })
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
              <div>
                <Label htmlFor="reported_date">Reported Date *</Label>
                <Input
                  id="reported_date"
                  type="date"
                  value={formData.reported_date}
                  onChange={(e) =>
                    setFormData({ ...formData, reported_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="applicant_id">Reported By (Applicant)</Label>
              <Select
                value={formData.applicant_id || "__none__"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    applicant_id: value === "__none__" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select applicant (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {applicantsLoading ? (
                    <SelectItem value="__loading__" disabled>Loading applicants...</SelectItem>
                  ) : !applicants || applicants.length === 0 ? (
                    <SelectItem value="__no_applicants__" disabled>No applicants available</SelectItem>
                  ) : (
                    applicants.map((applicant) => (
                      <SelectItem key={applicant.id} value={applicant.id}>
                        {applicant.first_name} {applicant.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assigned_contractor_id">Assigned Contractor</Label>
              <Input
                id="assigned_contractor_id"
                value={formData.assigned_contractor_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assigned_contractor_id: e.target.value || undefined,
                  })
                }
                placeholder="Contractor ID or name (optional)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitCreate}>Create Ticket</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>
              Update ticket information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter ticket title"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter ticket description"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-property_id">Property *</Label>
                <Select
                  value={formData.property_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, property_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertiesLoading ? (
                      <SelectItem value="__loading__" disabled>Loading properties...</SelectItem>
                    ) : !properties || properties.length === 0 ? (
                      <SelectItem value="__no_properties__" disabled>No properties available</SelectItem>
                    ) : (
                      properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address_line1 || property.address || "Unknown"} - {property.postcode || ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-ticket_category">Category *</Label>
                <Select
                  value={formData.ticket_category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ticket_category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Ticket["status"]) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-urgency">Urgency</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value: Ticket["urgency"]) =>
                    setFormData({ ...formData, urgency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Ticket["priority"]) =>
                    setFormData({ ...formData, priority: value })
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
              <div>
                <Label htmlFor="edit-reported_date">Reported Date *</Label>
                <Input
                  id="edit-reported_date"
                  type="date"
                  value={formData.reported_date}
                  onChange={(e) =>
                    setFormData({ ...formData, reported_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-applicant_id">Reported By (Applicant)</Label>
              <Select
                value={formData.applicant_id || "__none__"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    applicant_id: value === "__none__" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select applicant (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {applicantsLoading ? (
                    <SelectItem value="__loading__" disabled>Loading applicants...</SelectItem>
                  ) : !applicants || applicants.length === 0 ? (
                    <SelectItem value="__no_applicants__" disabled>No applicants available</SelectItem>
                  ) : (
                    applicants.map((applicant) => (
                      <SelectItem key={applicant.id} value={applicant.id}>
                        {applicant.first_name} {applicant.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-assigned_contractor_id">Assigned Contractor</Label>
              <Input
                id="edit-assigned_contractor_id"
                value={formData.assigned_contractor_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assigned_contractor_id: e.target.value || undefined,
                  })
                }
                placeholder="Contractor ID or name (optional)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedTicket(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitUpdate}>Update Ticket</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ticket.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

