/**
 * New Properties This Week Widget
 * 
 * Displays the number of new listings added within the last 7 days.
 * Helps agents track new opportunities.
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, TrendingUp } from "lucide-react";
import { useNewPropertiesThisWeek } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewPropertiesWidget() {
  const { data: newProperties, isLoading } = useNewPropertiesThisWeek();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>New Properties This Week</CardTitle>
          <CardDescription>Listings added in last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  const count = newProperties?.length || 0;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          New Properties This Week
        </CardTitle>
        <CardDescription>Listings added in last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-500">
              {count}
            </div>
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {count === 0
              ? "No new properties this week"
              : count === 1
              ? "1 new property added"
              : `${count} new properties added`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

