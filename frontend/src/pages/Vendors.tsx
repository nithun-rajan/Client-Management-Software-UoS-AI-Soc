import { useState } from "react";
import {
  Store,
  Mail,
  Phone,
  Building2,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useVendors, useDeleteVendor, useUpdateVendor } from "@/hooks/useVendors";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/shared/EmptyState";
import { Link } from "react-router-dom";
import { Vendor } from "@/types";
import StatusBadge from "@/components/shared/StatusBadge";

export default function Vendors() {
  const { data: vendors, isLoading } = useVendors();
  const deleteVendor = useDeleteVendor();
  const updateVendor = useUpdateVendor();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setEditOpen(true);
  };

  const handleDelete = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedVendor) return;
    try {
      await deleteVendor.mutateAsync(selectedVendor.id);
      setDeleteOpen(false);
      setSelectedVendor(null);
    } catch (error) {
      // Error toast is handled by the hook
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedVendor) return;
    
    const formData = new FormData(e.currentTarget);
    try {
      await updateVendor.mutateAsync({
        id: selectedVendor.id,
        title: formData.get("title") as string || undefined,
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
        email: formData.get("email") as string,
        primary_phone: formData.get("primary_phone") as string,
        secondary_phone: formData.get("secondary_phone") as string || undefined,
        current_address: formData.get("current_address") as string || undefined,
      });
      setEditOpen(false);
      setSelectedVendor(null);
    } catch (error) {
      // Error toast is handled by the hook
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Vendors" />
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getFullName = (vendor: Vendor) => {
    const parts = [vendor.title, vendor.first_name, vendor.last_name].filter(Boolean);
    return parts.join(" ");
  };

  return (
    <div>
      <Header title="Vendors" />
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {vendors?.map((vendor) => (
            <Card
              key={vendor.id}
              className="shadow-card transition-shadow hover:shadow-elevated"
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-xl font-bold text-white">
                    {getInitials(vendor.first_name, vendor.last_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold">
                      {getFullName(vendor)}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
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
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{vendor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{vendor.primary_phone}</span>
                </div>
                {vendor.instruction_type && (
                  <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>Instruction: {vendor.instruction_type.replace("_", " ")}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={`/vendors/${vendor.id}`}>
                    <Eye className="mr-1 h-4 w-4" />
                    View Details
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(vendor)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(vendor)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {vendors?.length === 0 && (
          <EmptyState
            icon={Store}
            title="No vendors yet"
            description="Start building your sales network by adding your first vendor"
            actionLabel="+ Add Vendor"
            onAction={() => {}}
          />
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>
              Update the vendor information below
            </DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={selectedVendor.title || ""}
                    placeholder="Mr, Mrs, Ms, Dr, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      defaultValue={selectedVendor.first_name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      defaultValue={selectedVendor.last_name}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={selectedVendor.email}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_phone">Primary Phone</Label>
                    <Input
                      id="primary_phone"
                      name="primary_phone"
                      type="tel"
                      defaultValue={selectedVendor.primary_phone}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_phone">Secondary Phone</Label>
                    <Input
                      id="secondary_phone"
                      name="secondary_phone"
                      type="tel"
                      defaultValue={selectedVendor.secondary_phone || ""}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_address">Current Address</Label>
                  <Input
                    id="current_address"
                    name="current_address"
                    defaultValue={selectedVendor.current_address || ""}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedVendor && getFullName(selectedVendor)}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

