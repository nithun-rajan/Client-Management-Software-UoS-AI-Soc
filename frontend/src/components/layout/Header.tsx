import { Bell, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useNotifications, useMarkAllNotificationsRead, useDeleteAllNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
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

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [landlordOpen, setLandlordOpen] = useState(false);
  const [applicantOpen, setApplicantOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteAllNotifications = useDeleteAllNotifications();
  const markNotificationRead = useMarkNotificationRead();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications.mutateAsync();
      setDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "All notifications deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive",
      });
    }
  };

  const handlePropertySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const address = formData.get("address") as string;
      const city = formData.get("city") as string;
      await api.post("/api/v1/properties/", {
        address: address ? `${address}, ${city}` : city,
        city: city,
        postcode: formData.get("postcode"),
        property_type: formData.get("property_type"),
        bedrooms: parseInt(formData.get("bedrooms") as string),
        bathrooms: parseInt(formData.get("bathrooms") as string),
        rent: parseFloat(formData.get("rent") as string),
        status: "available",
      });
      toast({ title: "Success", description: "Property added successfully" });
      setPropertyOpen(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add property",
        variant: "destructive",
      });
    }
  };

  const handleLandlordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post("/api/v1/landlords/", {
        full_name: formData.get("full_name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
      });
      toast({ title: "Success", description: "Landlord added successfully" });
      setLandlordOpen(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add landlord",
        variant: "destructive",
      });
    }
  };

  const handleApplicantSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post("/api/v1/applicants/", {
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        rent_budget_min: parseFloat(formData.get("rent_budget_min") as string),
        rent_budget_max: parseFloat(formData.get("rent_budget_max") as string),
      });
      toast({ title: "Success", description: "Applicant added successfully" });
      setApplicantOpen(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add applicant",
        variant: "destructive",
      });
    }
  };

  const handleVendorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post("/api/v1/vendors/", {
        title: formData.get("title") as string || undefined,
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        email: formData.get("email"),
        primary_phone: formData.get("primary_phone"),
        secondary_phone: formData.get("secondary_phone") as string || undefined,
        current_address: formData.get("current_address") as string || undefined,
      });
      toast({ title: "Success", description: "Vendor added successfully" });
      setVendorOpen(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add vendor",
        variant: "destructive",
      });
    }
  };

 return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <h1 className="text-2xl font-bold">{title}</h1>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="gap-2">
                <Plus className="h-4 w-4" />
                Quick Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setPropertyOpen(true)}>
                + New Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLandlordOpen(true)}>
                + New Landlord
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setApplicantOpen(true)}>
                + New Applicant
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setVendorOpen(true)}>
                + New Vendor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

                  {/* Live Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending}
                >
                  {markAllRead.isPending ? "Marking..." : "Mark all read"}
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <DropdownMenuItem className="text-center opacity-70">
                No notifications
              </DropdownMenuItem>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <DropdownMenuItem 
                  key={n.id} 
                  className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                  onClick={() => {
                    if (!n.body) return;
                    
                    const entityId = n.body.trim();
                    
                    // Check if it's the old format (contains "Email:" or "Phone:")
                    // Old notifications had body like "Email: ... | Phone: ..."
                    if (entityId.includes("Email:") || entityId.includes("Phone:")) {
                      // Old notification format - don't navigate
                      return;
                    }
                    
                    // UUID validation
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(entityId)) return;
                    
                    // Mark notification as read
                    if (!n.is_read) {
                      markNotificationRead.mutate(n.id);
                    }
                    
                    // Navigate based on notification type
                    if (n.type === "applicant") {
                      navigate(`/applicants/${entityId}`);
                    } else if (n.type === "landlord") {
                      navigate(`/landlords/${entityId}`);
                    } else if (n.type === "vendor") {
                      navigate(`/vendors/${entityId}`);
                    } else if (n.type === "property") {
                      navigate(`/properties/${entityId}`);
                    }
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{n.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Priority badge */}
                      {(n.priority || "medium") === "high" && (
                        <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-destructive/20 text-destructive">
                          High
                        </span>
                      )}
                      {(n.priority || "medium") === "medium" && (
                        <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                          Med
                        </span>
                      )}
                      {(n.priority || "medium") === "low" && (
                        <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-muted text-muted-foreground">
                          Low
                        </span>
                      )}
                      {!n.is_read && <div className="h-2 w-2 rounded-full bg-destructive" />}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </DropdownMenuItem>
              ))
            )}
            
            {/* Clear all button - only show when there are notifications */}
            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={deleteAllNotifications.isPending}
                  >
                    {deleteAllNotifications.isPending ? "Deleting..." : "Clear all"}
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all notifications. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </header>

      {/* Property Dialog */}
      <Dialog open={propertyOpen} onOpenChange={setPropertyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>Enter the property details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePropertySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" name="postcode" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="property_type">Type</Label>
                <Select name="property_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="maisonette">Maisonette</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" name="bedrooms" type="number" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" name="bathrooms" type="number" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rent">Monthly Rent (£)</Label>
                <Input id="rent" name="rent" type="number" step="0.01" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Property</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Landlord Dialog */}
      <Dialog open={landlordOpen} onOpenChange={setLandlordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Landlord</DialogTitle>
            <DialogDescription>Enter the landlord details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLandlordSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Landlord</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Applicant Dialog */}
      <Dialog open={applicantOpen} onOpenChange={setApplicantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Applicant</DialogTitle>
            <DialogDescription>Enter the applicant details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApplicantSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" name="first_name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" name="last_name" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="rent_budget_min">Min Budget (£)</Label>
                  <Input id="rent_budget_min" name="rent_budget_min" type="number" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rent_budget_max">Max Budget (£)</Label>
                  <Input id="rent_budget_max" name="rent_budget_max" type="number" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Applicant</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vendor Dialog */}
      <Dialog open={vendorOpen} onOpenChange={setVendorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
            <DialogDescription>Enter the vendor (seller) details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVendorSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Select name="title">
                  <SelectTrigger>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                    <SelectItem value="Miss">Miss</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" name="first_name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" name="last_name" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="primary_phone">Primary Phone</Label>
                  <Input id="primary_phone" name="primary_phone" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="secondary_phone">Secondary Phone</Label>
                  <Input id="secondary_phone" name="secondary_phone" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current_address">Current Address</Label>
                <Input id="current_address" name="current_address" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Vendor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
