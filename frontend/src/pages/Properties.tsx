import {
  Building2,
  Bed,
  Bath,
  Eye,
  Pencil,
  Trash2,
  PoundSterling,
  Download,
  Upload,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Link } from "react-router-dom";
import api from "@/lib/api";

// Helper function to extract flat/unit number from address
const getFlatOrUnitNumber = (addressLine1: string | undefined, address: string | undefined, city?: string): string => {
  const addressStr = addressLine1 || address?.split('\n')[0]?.trim() || "";
  
  if (!addressStr) return "";
  
  // Look for flat/unit patterns anywhere in the string (Studio, Flat, Unit, etc.)
  const flatMatch = addressStr.match(/\b(Studio|Flat|Unit|Apartment|Apt|Suite|Room)\s+[\w\d]+/i);
  if (flatMatch) {
    return flatMatch[0];
  }
  
  // If no flat/unit pattern found, check if there are commas
  const parts = addressStr.split(',').map(p => p.trim()).filter(p => p.length > 0);
  
  if (parts.length > 1) {
    // Remove city from parts if it matches
    const filteredParts = city 
      ? parts.filter(p => p.toLowerCase() !== city.toLowerCase())
      : parts;
    
    // Return the last part (likely the flat/unit, or street if no flat/unit found)
    if (filteredParts.length > 0) {
      return filteredParts[filteredParts.length - 1];
    }
  }
  
  // If no comma, return the whole string (but remove city if present)
  if (city && addressStr.toLowerCase().endsWith(city.toLowerCase())) {
    return addressStr.replace(new RegExp(`[, ]*${city}`, 'gi'), '').trim();
  }
  
  return addressStr;
};

// Helper function to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function Properties() {
  const { data: properties, isLoading, refetch } = useProperties();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (property: any) => {
    setSelectedProperty(property);
    setEditOpen(true);
  };

  const handleDelete = (property: any) => {
    setSelectedProperty(property);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/v1/properties/${selectedProperty.id}/`);
      toast({ title: "Success", description: "Property deleted successfully" });
      setDeleteOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.put(`/api/v1/properties/${selectedProperty.id}/`, {
        address_line1: formData.get("address"),
        city: formData.get("city"),
        postcode: formData.get("postcode"),
        property_type: formData.get("property_type"),
        bedrooms: parseInt(formData.get("bedrooms") as string),
        bathrooms: parseInt(formData.get("bathrooms") as string),
        rent: parseFloat(formData.get("rent") as string),
        status: formData.get("status"),
      });
      toast({ title: "Success", description: "Property updated successfully" });
      setEditOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update property",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Properties for Letting" />
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

  const handleRequestPhoto = (property: any) => {
    toast({
      title: "Request Sent",
      description: `Photo upload request sent to landlord for ${property.address_line1}`,
    });
  };

  const handleExportCSV = () => {
    if (!properties || properties.length === 0) return;

    const csvContent = [
      [
        "Address",
        "City",
        "Postcode",
        "Type",
        "Bedrooms",
        "Bathrooms",
        "Rent",
        "Status",
      ].join(","),
      ...properties.map((p) =>
        [
          p.address_line1,
          p.city,
          p.postcode,
          p.property_type,
          p.bedrooms,
          p.bathrooms,
          p.rent || "POA",
          p.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `properties-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Properties exported to CSV" });
  };

  // Filter properties based on search query
  const filteredProperties = properties?.filter((property) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      property.address_line1?.toLowerCase().includes(query) ||
      property.city?.toLowerCase().includes(query) ||
      property.postcode?.toLowerCase().includes(query) ||
      property.property_type?.toLowerCase().includes(query) ||
      property.bedrooms?.toString().includes(query) ||
      property.bathrooms?.toString().includes(query) ||
      property.rent?.toString().includes(query)
    );
  }) || [];

  return (
    <div>
      <Header title="Properties for Letting" />
      <div className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by address, city, postcode, property type, bedrooms, bathrooms, or rent..."
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

        <div className="mb-6 flex justify-end">
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <Card
              key={property.id}
              className="group shadow-card transition-shadow hover:shadow-elevated"
            >
              <CardHeader className="relative">
                <div className="absolute right-4 top-4 z-10">
                  <StatusBadge status={property.status} />
                </div>
                <div className="flex aspect-video items-center justify-center rounded-lg bg-muted overflow-hidden relative">
                  {property.main_photo_url ? (
                    <img
                      src={property.main_photo_url}
                      alt={property.address_line1}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <Building2 className="h-16 w-16 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={() => handleRequestPhoto(property)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Request Photo
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">
                      {capitalizeWords(
                        getFlatOrUnitNumber(property.address_line1, property.address, property.city) || property.city
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {property.city}, {property.postcode}
                    </p>
                  </div>
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                    {property.property_type}
                  </span>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Bed className="h-4 w-4" />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Bath className="h-4 w-4" />
                    <span>{property.bathrooms}</span>
                  </div>
                  {property.rent ? (
                    <div className="ml-auto flex items-center gap-1 text-sm font-semibold text-primary">
                      <PoundSterling className="h-4 w-4" />
                      <span>{property.rent.toLocaleString()}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        pcm
                      </span>
                    </div>
                  ) : (
                    <div className="ml-auto text-sm text-muted-foreground">POA</div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/properties/${property.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <EmptyState
            icon={Building2}
            title="No properties for letting yet"
            description="Get started by adding your first property for letting to begin managing your portfolio"
            actionLabel="+ Add Property"
            onAction={() => {}}
          />
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>Update property details</DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={selectedProperty.address_line1}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={selectedProperty.city}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    name="postcode"
                    defaultValue={selectedProperty.postcode}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="property_type">Type</Label>
                  <Select
                    name="property_type"
                    defaultValue={selectedProperty.property_type}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      defaultValue={selectedProperty.bedrooms}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      defaultValue={selectedProperty.bathrooms}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rent">Rent (£)</Label>
                  <Input
                    id="rent"
                    name="rent"
                    type="number"
                    step="0.01"
                    defaultValue={selectedProperty.rent}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={selectedProperty.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="let_agreed">Let Agreed</SelectItem>
                      <SelectItem value="let_by">Let By</SelectItem>
                      <SelectItem value="tenanted">Tenanted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
