import { useState } from "react";
import {
  Store,
  User,
  UserCheck,
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
import { Label } from "@/components/ui/label";
import { useVendors, useDeleteVendor, useUpdateVendor } from "@/hooks/useVendors";
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/shared/EmptyState";
import { Link } from "react-router-dom";
import { Vendor } from "@/types";
import StatusBadge from "@/components/shared/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useMyTeamAgents } from "@/hooks/useAgents";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";

export default function Vendors() {
  const { data: vendors, isLoading } = useVendors();
  const { data: properties } = useProperties();
  const { user } = useAuth();
  const { data: teamAgents } = useMyTeamAgents();
  const deleteVendor = useDeleteVendor();
  const updateVendor = useUpdateVendor();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Helper functions
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getFullName = (vendor: Vendor) => {
    const parts = [vendor.first_name, vendor.last_name].filter(Boolean);
    return parts.join(" ");
  };

  // Get team agent IDs
  const teamAgentIds = teamAgents?.map(a => a.id) || [];
  
  // Filter by tab
  const filteredByTab = useMemo(() => {
    if (activeTab === "managed-by-me") {
      return vendors?.filter((vendor: Vendor) => vendor.managed_by === user?.id) || [];
    } else if (activeTab === "managed-by-team") {
      return vendors?.filter((vendor: Vendor) => vendor.managed_by && teamAgentIds.includes(vendor.managed_by)) || [];
    }
    return vendors || [];
  }, [vendors, activeTab, user?.id, teamAgentIds]);

  // Calculate counts
  const allCount = vendors?.length || 0;
  const managedByMeCount = vendors?.filter((v: Vendor) => v.managed_by === user?.id).length || 0;
  const managedByTeamCount = vendors?.filter((v: Vendor) => v.managed_by && teamAgentIds.includes(v.managed_by)).length || 0;

  // Apply search filter
  const filteredVendors = useMemo(() => {
    if (!searchQuery) return filteredByTab;
    
    const query = searchQuery.toLowerCase();
    return filteredByTab.filter((vendor: Vendor) => (
      vendor.first_name?.toLowerCase().includes(query) ||
      vendor.last_name?.toLowerCase().includes(query) ||
      vendor.email?.toLowerCase().includes(query) ||
      vendor.primary_phone?.includes(query) ||
      vendor.current_address?.toLowerCase().includes(query) ||
      vendor.status?.toLowerCase().includes(query) ||
      vendor.aml_status?.toLowerCase().includes(query) ||
      (vendor.vendor_complete_info ? "complete info" : "incomplete info").includes(query)
    ));
  }, [filteredByTab, searchQuery]);

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

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All Vendors ({allCount})
            </TabsTrigger>
            <TabsTrigger value="managed-by-me">
              <User className="mr-2 h-4 w-4" />
              Managed by Me ({managedByMeCount})
            </TabsTrigger>
            <TabsTrigger value="managed-by-team">
              <UserCheck className="mr-2 h-4 w-4" />
              Managed by My Team ({managedByTeamCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-6 md:grid-cols-2">
          {filteredVendors.map((vendor) => (
            <Card
              key={vendor.id}
              className="shadow-card transition-shadow hover:shadow-elevated"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-xl font-bold text-white">
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    {vendor.managed_by === user?.id ? (
                      <Badge className="bg-accent text-white text-xs font-semibold px-2 py-0.5">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Managed by Me
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span className="text-right whitespace-nowrap">
                          {vendor.managed_by_name || "Unassigned"}
                        </span>
                      </div>
                    )}
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
            title={searchQuery || activeTab !== "all" ? "No vendors found" : "No vendors yet"}
            description={searchQuery || activeTab !== "all" ? "Try adjusting your search or filters to see more results" : "Start building your sales network by adding your first vendor"}
            actionLabel={searchQuery || activeTab !== "all" ? undefined : "+ Add Vendor"}
            onAction={searchQuery || activeTab !== "all" ? undefined : () => {}}
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

