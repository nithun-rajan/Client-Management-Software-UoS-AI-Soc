import { Building2, Bed, Bath, Eye, Pencil, Trash2, PoundSterling } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import { Link } from "react-router-dom";

export default function Properties() {
  const { data: properties, isLoading } = useProperties();

  if (isLoading) {
    return (
      <div>
        <Header title="Properties" />
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
      <Header title="Properties" />
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties?.map((property) => (
            <Card
              key={property.id}
              className="group shadow-card transition-shadow hover:shadow-elevated"
            >
              <CardHeader className="relative">
                <div className="absolute right-4 top-4 z-10">
                  <StatusBadge status={property.status} />
                </div>
                <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-16 w-16 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">
                      {property.address_line1}
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
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={`/properties/${property.id}`}>
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {properties?.length === 0 && (
          <div className="py-12 text-center">
            <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No properties yet</h3>
            <p className="mb-4 text-muted-foreground">
              Get started by adding your first property
            </p>
            <Button>+ Add Property</Button>
          </div>
        )}
      </div>
    </div>
  );
}
