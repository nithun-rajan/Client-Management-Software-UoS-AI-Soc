/**
 * Active Listings Count Widget
 * 
 * Displays the total number of properties currently for sale and for letting.
 * Shows separate counts with icons for clarity.
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Building, Home } from "lucide-react";
import { useKPIs } from "@/hooks/useKPIs";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActiveListingsWidget() {
  const { data: kpis, isLoading } = useKPIs();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Listings</CardTitle>
          <CardDescription>Properties currently available</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  const salesCount = kpis?.properties_sale?.total || 0;
  const lettingsCount = kpis?.properties_letting?.total || kpis?.properties?.total || 0;
  const totalCount = salesCount + lettingsCount;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          Active Listings
        </CardTitle>
        <CardDescription>Properties currently available</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-4xl font-bold text-primary">{totalCount}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{lettingsCount}</div>
                <div className="text-sm text-muted-foreground">For Letting</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{salesCount}</div>
                <div className="text-sm text-muted-foreground">For Sale</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

