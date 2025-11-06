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
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLandlords } from "@/hooks/useLandlords";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import { Link } from "react-router-dom";

export default function Landlords() {
  const { data: landlords, isLoading } = useLandlords();

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

  return (
    <div>
      <Header title="Landlords" />
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {landlords?.map((landlord) => (
            <Card
              key={landlord.id}
              className="shadow-card transition-shadow hover:shadow-elevated"
            >
              <CardHeader>
                <div className="flex items-start gap-4">
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
                  <span>Properties owned: 0</span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={`/landlords/${landlord.id}`}>
                    <Eye className="mr-1 h-4 w-4" />
                    View Details
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

        {landlords?.length === 0 && (
          <div className="py-12 text-center">
            <UserCheck className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No landlords yet</h3>
            <p className="mb-4 text-muted-foreground">
              Get started by adding your first landlord
            </p>
            <Button>+ Add Landlord</Button>
          </div>
        )}
      </div>
    </div>
  );
}
