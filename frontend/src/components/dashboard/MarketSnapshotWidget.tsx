/**
 * Market Snapshot Widget
 * 
 * High-level stats such as average property price, average days on market, and demand level.
 * Uses icons and color indicators for trends (up/down).
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Calendar } from "lucide-react";
import { useKPIs } from "@/hooks/useKPIs";
import { usePropertiesForDashboard } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketSnapshotWidget() {
  const { data: kpis, isLoading: isLoadingKPIs } = useKPIs();
  const { data: properties, isLoading: isLoadingProperties } = usePropertiesForDashboard();

  if (isLoadingKPIs || isLoadingProperties) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Snapshot</CardTitle>
          <CardDescription>Key market indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  // Calculate average days on market
  const propertiesWithDates = properties?.filter((p) => p.created_at) || [];
  const totalDaysOnMarket = propertiesWithDates.reduce((sum, p) => {
    const listedDate = new Date(p.created_at);
    const now = new Date();
    const days = Math.floor((now.getTime() - listedDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);
  const avgDaysOnMarket = propertiesWithDates.length > 0
    ? Math.round(totalDaysOnMarket / propertiesWithDates.length)
    : 0;

  // Calculate demand level (based on available properties vs total)
  const availableProperties = properties?.filter((p) => p.status === "available") || [];
  const totalProperties = properties?.length || 1;
  const demandLevel = totalProperties > 0
    ? Math.round((availableProperties.length / totalProperties) * 100)
    : 0;

  const avgRent = kpis?.properties_letting?.avg_rent || kpis?.properties?.avg_rent || 0;
  const avgSalePrice = kpis?.properties_sale?.avg_selling_price || 0;

  // Determine demand trend (simplified: lower availability = higher demand)
  const demandTrend = demandLevel < 30 ? "high" : demandLevel > 70 ? "low" : "medium";

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          Market Snapshot
        </CardTitle>
        <CardDescription>Key market indicators and trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Average Rent */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm font-medium">Avg Rent (PCM)</div>
                <div className="text-xs text-muted-foreground">Lettings</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">£{avgRent.toFixed(0)}</div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>Stable</span>
              </div>
            </div>
          </div>

          {/* Average Sale Price */}
          {avgSalePrice > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-sm font-medium">Avg Sale Price</div>
                  <div className="text-xs text-muted-foreground">Sales</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">£{avgSalePrice.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-xs text-purple-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>Stable</span>
                </div>
              </div>
            </div>
          )}

          {/* Average Days on Market */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium">Days on Market</div>
                <div className="text-xs text-muted-foreground">Average</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{avgDaysOnMarket}</div>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Calendar className="h-3 w-3" />
                <span>days</span>
              </div>
            </div>
          </div>

          {/* Demand Level */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-sm font-medium">Demand Level</div>
                <div className="text-xs text-muted-foreground">
                  {availableProperties.length} of {totalProperties} available
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold capitalize">{demandTrend}</div>
              <div className="flex items-center gap-1 text-xs">
                {demandTrend === "high" ? (
                  <span className="text-red-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    High
                  </span>
                ) : demandTrend === "low" ? (
                  <span className="text-blue-600 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Low
                  </span>
                ) : (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Medium
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

