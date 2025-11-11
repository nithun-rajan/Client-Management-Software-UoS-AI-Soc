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
  Search,
  X,
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
import { useVendors, useDeleteVendor, useUpdateVendor } from "@/hooks/useVendors";
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/shared/EmptyState";
import { Link } from "react-router-dom";
import { Vendor } from "@/types";
import StatusBadge from "@/components/shared/StatusBadge";

export default function Vendors() {
  const { data: vendors, isLoading } = useVendors();
  const { data: properties } = useProperties();
  const deleteVendor = useDeleteVendor();
  const updateVendor = useUpdateVendor();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
        email: formData.get("email") as string,
        primary_phone: formData.get("primary_phone") as string,
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
    const parts = [vendor.first_name, vendor.last_name].filter(Boolean);
    return parts.join(" ");
  };

  // Apply search
  const filteredVendors = vendors?.filter((vendor: Vendor) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      vendor.first_name?.toLowerCase().includes(query) ||
      vendor.last_name?.toLowerCase().includes(query) ||
      vendor.email?.toLowerCase().includes(query) ||
      vendor.primary_phone?.includes(query) ||
      vendor.current_address?.toLowerCase().includes(query) ||
      vendor.status?.toLowerCase().includes(query) ||
      vendor.aml_status?.toLowerCase().includes(query) ||
      (vendor.vendor_complete_info ? "complete info" : "incomplete info").includes(query)
    );
  }) || [];

  return (
    <div>
      <Header title="Vendors" />
      <div className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, address, status, AML status, or complete info..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
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

        <div className="grid gap-6 md:grid-cols-2">
          {filteredVendors.map((vendor) => (
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
                    <div className="mt-1 flex flex-wrap items-center gap-2">
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
                      {vendor.vendor_complete_info ? (
                        <Badge className="gap-1 bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3" />
                          Complete Info
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Incomplete Info
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
                <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>
                    Properties owned: {properties?.filter((p) => p.vendor_id === vendor.id).length || 0}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/vendors/${vendor.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredVendors.length === 0 && (
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
                <div className="space-y-2">
                  <Label htmlFor="primary_phone">Phone</Label>
                  <Input
                    id="primary_phone"
                    name="primary_phone"
                    type="tel"
                    defaultValue={selectedVendor.primary_phone}
                    required
                  />
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

