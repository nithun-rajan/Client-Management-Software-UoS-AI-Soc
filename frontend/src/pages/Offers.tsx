import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Handshake,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
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
  useOffers,
  useCreateOffer,
  useUpdateOffer,
  useAcceptOffer,
  useRejectOffer,
  useDeleteOffer,
} from "@/hooks/useOffers";
import { useProperties } from "@/hooks/useProperties";
import { useApplicants } from "@/hooks/useApplicants";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/shared/EmptyState";
import { Offer } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Offers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);

  const filters: { status?: string } = {};
  if (statusFilter !== "all") filters.status = statusFilter;

  const { data: offers, isLoading } = useOffers(filters);
  const { data: properties } = useProperties();
  const { data: applicants } = useApplicants();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const acceptOffer = useAcceptOffer();
  const rejectOffer = useRejectOffer();
  const deleteOffer = useDeleteOffer();

  // Form state
  const [formData, setFormData] = useState({
    property_id: "",
    applicant_id: "",
    offered_rent: "",
    proposed_start_date: "",
    proposed_term_months: "12",
    special_conditions: "",
    applicant_notes: "",
    status: "submitted" as Offer["status"],
  });

  const resetForm = () => {
    setFormData({
      property_id: "",
      applicant_id: "",
      offered_rent: "",
      proposed_start_date: "",
      proposed_term_months: "12",
      special_conditions: "",
      applicant_notes: "",
      status: "submitted",
    });
  };

  const handleCreate = () => {
    resetForm();
    setSelectedOffer(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = (offer: Offer) => {
    setSelectedOffer(offer);
    setFormData({
      property_id: offer.property_id,
      applicant_id: offer.applicant_id,
      offered_rent: offer.offered_rent.toString(),
      proposed_start_date: offer.proposed_start_date
        ? new Date(offer.proposed_start_date).toISOString().split("T")[0]
        : "",
      proposed_term_months: offer.proposed_term_months?.toString() || "12",
      special_conditions: offer.special_conditions || "",
      applicant_notes: offer.applicant_notes || "",
      status: offer.status,
    });
    setEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const offerPayload: Partial<Offer> = {
      property_id: formData.property_id,
      applicant_id: formData.applicant_id,
      offered_rent: parseFloat(formData.offered_rent),
      proposed_start_date: formData.proposed_start_date
        ? new Date(formData.proposed_start_date).toISOString()
        : undefined,
      proposed_term_months: parseInt(formData.proposed_term_months) || 12,
      special_conditions: formData.special_conditions || undefined,
      applicant_notes: formData.applicant_notes || undefined,
      status: formData.status,
    };

    if (selectedOffer) {
      await updateOffer.mutateAsync({ id: selectedOffer.id, ...offerPayload });
      setEditDialogOpen(false);
    } else {
      await createOffer.mutateAsync(offerPayload);
      setCreateDialogOpen(false);
    }
    resetForm();
  };

  const handleDelete = (offerId: string) => {
    setOfferToDelete(offerId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (offerToDelete) {
      await deleteOffer.mutateAsync(offerToDelete);
      setDeleteConfirmOpen(false);
      setOfferToDelete(null);
    }
  };

  const handleAccept = async (offerId: string) => {
    await acceptOffer.mutateAsync(offerId);
  };

  const handleReject = async (offerId: string) => {
    await rejectOffer.mutateAsync({ id: offerId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "countered":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "withdrawn":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOffers = offers?.filter((offer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      offer.property?.address?.toLowerCase().includes(query) ||
      offer.applicant?.name?.toLowerCase().includes(query) ||
      offer.offered_rent.toString().includes(query)
    );
  }) || [];

  if (isLoading) {
    return (
      <div>
        <Header title="Offers" />
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
      <Header title="Offers" />
      <div className="p-6 space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search offers..."
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
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="countered">Countered</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Offer
          </Button>
        </div>

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No offers found"
            description={
              searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first offer to get started"
            }
            action={
              !searchQuery && statusFilter === "all" ? (
                <Button onClick={handleCreate}>Create Offer</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {offer.property_id || offer.property?.id ? (
                        <button
                          onClick={() => navigate(`/properties/${offer.property_id || offer.property?.id}`)}
                          className="text-left text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer font-semibold"
                        >
                          {offer.property?.address || "Unknown Property"}
                        </button>
                      ) : (
                        <span>{offer.property?.address || "Unknown Property"}</span>
                      )}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(offer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(offer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-semibold">
                      £{offer.offered_rent.toLocaleString()}
                    </span>
                    {offer.property?.asking_rent && (
                      <span className="text-sm text-muted-foreground">
                        (asking: £{offer.property.asking_rent.toLocaleString()})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>
                      Applicant:{" "}
                      {offer.applicant_id || offer.applicant?.id ? (
                        <button
                          onClick={() => navigate(`/applicants/${offer.applicant_id || offer.applicant?.id}`)}
                          className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer"
                        >
                          {offer.applicant?.name || "Unknown"}
                        </button>
                      ) : (
                        <span>{offer.applicant?.name || "Unknown"}</span>
                      )}
                    </div>
                    {offer.proposed_term_months && (
                      <div>Term: {offer.proposed_term_months} months</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={getStatusColor(offer.status)}
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(offer.status)}
                        {offer.status.toUpperCase()}
                      </span>
                    </Badge>
                  </div>
                  {offer.proposed_start_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Start: {format(new Date(offer.proposed_start_date), "dd/MM/yyyy")}
                      </span>
                    </div>
                  )}
                  {offer.submitted_at && (
                    <div className="text-xs text-muted-foreground">
                      Submitted: {format(new Date(offer.submitted_at), "dd/MM/yyyy")}
                    </div>
                  )}
                  {offer.status === "submitted" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAccept(offer.id)}
                        disabled={acceptOffer.isPending}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 hover:bg-red-500 hover:text-white hover:border-red-500"
                        onClick={() => handleReject(offer.id)}
                        disabled={rejectOffer.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Offer Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Offer</DialogTitle>
            <DialogDescription>
              Submit a new offer for a property
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="property_id">Property *</Label>
              <Select
                value={formData.property_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, property_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address || property.address_line1 || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="applicant_id">Applicant *</Label>
              <Select
                value={formData.applicant_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, applicant_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select applicant" />
                </SelectTrigger>
                <SelectContent>
                  {applicants?.map((applicant) => (
                    <SelectItem key={applicant.id} value={applicant.id}>
                      {applicant.first_name} {applicant.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="offered_rent">Offered Rent (£) *</Label>
                <Input
                  id="offered_rent"
                  type="number"
                  step="0.01"
                  value={formData.offered_rent}
                  onChange={(e) =>
                    setFormData({ ...formData, offered_rent: e.target.value })
                  }
                  required
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="proposed_term_months">Term (months)</Label>
                <Select
                  value={formData.proposed_term_months}
                  onValueChange={(value) =>
                    setFormData({ ...formData, proposed_term_months: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="18">18 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="proposed_start_date">Proposed Start Date</Label>
              <Input
                id="proposed_start_date"
                type="date"
                value={formData.proposed_start_date}
                onChange={(e) =>
                  setFormData({ ...formData, proposed_start_date: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="special_conditions">Special Conditions</Label>
              <Textarea
                id="special_conditions"
                value={formData.special_conditions}
                onChange={(e) =>
                  setFormData({ ...formData, special_conditions: e.target.value })
                }
                placeholder="e.g., Pet clause, Early move-in"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="applicant_notes">Applicant Notes</Label>
              <Textarea
                id="applicant_notes"
                value={formData.applicant_notes}
                onChange={(e) =>
                  setFormData({ ...formData, applicant_notes: e.target.value })
                }
                placeholder="Why they want this property"
                rows={3}
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
              <Button type="submit" disabled={createOffer.isPending}>
                {createOffer.isPending ? "Creating..." : "Create Offer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Offer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
            <DialogDescription>Update offer details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Offer["status"]) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="countered">Countered</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-offered_rent">Offered Rent (£)</Label>
              <Input
                id="edit-offered_rent"
                type="number"
                step="0.01"
                value={formData.offered_rent}
                onChange={(e) =>
                  setFormData({ ...formData, offered_rent: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-proposed_start_date">Proposed Start Date</Label>
              <Input
                id="edit-proposed_start_date"
                type="date"
                value={formData.proposed_start_date}
                onChange={(e) =>
                  setFormData({ ...formData, proposed_start_date: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-special_conditions">Special Conditions</Label>
              <Textarea
                id="edit-special_conditions"
                value={formData.special_conditions}
                onChange={(e) =>
                  setFormData({ ...formData, special_conditions: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-applicant_notes">Applicant Notes</Label>
              <Textarea
                id="edit-applicant_notes"
                value={formData.applicant_notes}
                onChange={(e) =>
                  setFormData({ ...formData, applicant_notes: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateOffer.isPending}>
                {updateOffer.isPending ? "Updating..." : "Update Offer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Offer</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw this offer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setOfferToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteOffer.isPending}
            >
              {deleteOffer.isPending ? "Withdrawing..." : "Withdraw Offer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

