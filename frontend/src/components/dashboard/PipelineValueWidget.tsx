/**
 * Pipeline Value Widget
 * 
 * Shows the total estimated value (£) of all active listings.
 * Separates totals for sales and lettings.
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PoundSterling, TrendingUp } from "lucide-react";
import { useKPIs } from "@/hooks/useKPIs";
import { usePropertiesForDashboard } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineValueWidget() {
  const { data: kpis, isLoading: isLoadingKPIs } = useKPIs();
  const { data: properties, isLoading: isLoadingProperties } = usePropertiesForDashboard();

  if (isLoadingKPIs || isLoadingProperties) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Value</CardTitle>
          <CardDescription>Total value of active listings</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  // Calculate sales pipeline value
  const salesProperties = properties?.filter((p) => p.asking_price && p.sales_status !== "completed") || [];
  const salesValue = salesProperties.reduce((sum, p) => sum + (p.asking_price || 0), 0);

  // Calculate lettings pipeline value (annual rent for available properties)
  const lettingsProperties = properties?.filter(
    (p) => p.rent && (p.status === "available" || p.status === "let_agreed")
  ) || [];
  const lettingsAnnualValue = lettingsProperties.reduce((sum, p) => sum + (p.rent || 0) * 12, 0);

  const totalValue = salesValue + lettingsAnnualValue;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PoundSterling className="h-5 w-5 text-green-600" />
          Pipeline Value
        </CardTitle>
        <CardDescription>Total value of active listings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-3xl font-bold text-green-600 dark:text-green-500">
            £{totalValue.toLocaleString()}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Sales Pipeline:</span>
              <span className="font-semibold">£{salesValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Lettings (Annual):</span>
              <span className="font-semibold">£{lettingsAnnualValue.toLocaleString()}</span>
            </div>
          </div>
          <div className="pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>
              {salesProperties.length} sales • {lettingsProperties.length} lettings
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

