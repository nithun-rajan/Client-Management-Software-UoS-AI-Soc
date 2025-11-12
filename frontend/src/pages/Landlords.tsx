import { useState } from "react";
import {
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
import { useLandlords, useDeleteLandlord, useUpdateLandlord } from "@/hooks/useLandlords";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/shared/EmptyState";
import { Link } from "react-router-dom";
import { Landlord } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useMyTeamAgents } from "@/hooks/useAgents";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Landlords() {
  const { data: landlords, isLoading } = useLandlords();
  const { user } = useAuth();
  const { data: teamAgents } = useMyTeamAgents();
  const deleteLandlord = useDeleteLandlord();
  const updateLandlord = useUpdateLandlord();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [managedByMe, setManagedByMe] = useState(false);
  const [managedByMyTeam, setManagedByMyTeam] = useState(false);

  const handleEdit = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setEditOpen(true);
  };

  const handleDelete = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedLandlord) return;
    try {
      await deleteLandlord.mutateAsync(selectedLandlord.id);
      setDeleteOpen(false);
      setSelectedLandlord(null);
    } catch (error) {
      // Error toast is handled by the hook
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLandlord) return;
    
    const formData = new FormData(e.currentTarget);
    try {
      await updateLandlord.mutateAsync({
        id: selectedLandlord.id,
        full_name: formData.get("full_name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string || undefined,
        address: formData.get("address") as string || undefined,
      });
      setEditOpen(false);
      setSelectedLandlord(null);
    } catch (error) {
      // Error toast is handled by the hook
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Landlords" />
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get team agent IDs
  const teamAgentIds = teamAgents?.map(a => a.id) || [];
  
  // Apply filters and search
  const filteredLandlords = landlords?.filter((landlord: Landlord) => {
    // Managed by Me filter
    if (managedByMe && landlord.managed_by !== user?.id) return false;
    
    // Managed by My Team filter
    if (managedByMyTeam && (!landlord.managed_by || !teamAgentIds.includes(landlord.managed_by))) return false;
    
    // Search filter
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      landlord.full_name?.toLowerCase().includes(query) ||
      landlord.email?.toLowerCase().includes(query) ||
      landlord.phone?.includes(query) ||
      landlord.address?.toLowerCase().includes(query) ||
      landlord.status?.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div>
      <Header title="Landlords" />
      <div className="p-6">
        {/* Search Bar and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, address, or status..."
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
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="managed-by-me"
                checked={managedByMe}
                onCheckedChange={(checked) => setManagedByMe(checked === true)}
              />
              <Label htmlFor="managed-by-me" className="text-sm font-normal cursor-pointer">
                Managed by Me
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="managed-by-team"
                checked={managedByMyTeam}
                onCheckedChange={(checked) => setManagedByMyTeam(checked === true)}
              />
              <Label htmlFor="managed-by-team" className="text-sm font-normal cursor-pointer">
                Managed by My Team
              </Label>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filteredLandlords.map((landlord) => (
            <Card
              key={landlord.id}
              className="shadow-card transition-shadow hover:shadow-elevated"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-xl font-bold text-white">
                      {getInitials(landlord.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold">
                        {landlord.full_name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        {landlord.aml_verified ? (
                          <Badge className="gap-1 bg-accent text-white">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {landlord.managed_by === user?.id ? (
                      <Badge className="bg-accent text-white text-xs font-semibold px-2 py-0.5">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Managed by Me
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span className="text-right whitespace-nowrap">
                          {landlord.managed_by_name || "Unassigned"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{landlord.email}</span>
                </div>
                {landlord.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{landlord.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Properties owned: {landlord.properties_count ?? 0}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/landlords/${landlord.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredLandlords.length === 0 && (
          <EmptyState
            icon={UserCheck}
            title={managedByMe || managedByMyTeam ? "No landlords found with this filter" : "No landlords yet"}
            description={managedByMe || managedByMyTeam ? "Try adjusting your filters to see more results" : "Start building your network by adding your first landlord"}
            actionLabel={managedByMe || managedByMyTeam ? undefined : "+ Add Landlord"}
            onAction={managedByMe || managedByMyTeam ? undefined : () => {}}
          />
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Landlord</DialogTitle>
            <DialogDescription>
              Update the landlord information below
            </DialogDescription>
          </DialogHeader>
          {selectedLandlord && (
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={selectedLandlord.full_name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={selectedLandlord.email}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={selectedLandlord.phone || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={selectedLandlord.address || ""}
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
            <DialogTitle>Delete Landlord</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedLandlord?.full_name}? This action cannot be undone.
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
