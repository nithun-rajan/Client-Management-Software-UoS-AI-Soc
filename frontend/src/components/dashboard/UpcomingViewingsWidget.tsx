/**
 * Upcoming Viewings Widget
 * 
 * List of scheduled property viewings (next 7 days).
 * Includes property address, applicant name, date/time, and assigned agent.
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, MapPin, User, Clock } from "lucide-react";
import { useUpcomingViewings } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";

export default function UpcomingViewingsWidget() {
  const { data: viewings, isLoading } = useUpcomingViewings();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Viewings</CardTitle>
          <CardDescription>Next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  const upcomingViewings = viewings || [];

  if (upcomingViewings.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-500" />
            Upcoming Viewings
          </CardTitle>
          <CardDescription>Next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No upcoming viewings</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-500" />
          Upcoming Viewings
        </CardTitle>
        <CardDescription>Next 7 days ({upcomingViewings.length} scheduled)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {upcomingViewings.map((viewing) => {
            const viewingDate = new Date(viewing.scheduled_date);
            const propertyAddress = viewing.property?.address || "Unknown Property";
            const applicantName = viewing.applicant?.name || "Unknown Applicant";
            const agentName = viewing.assigned_agent || "Unassigned";

            return (
              <div
                key={viewing.id}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{propertyAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">{applicantName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {format(viewingDate, "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-muted-foreground mb-1">
                      {formatDistanceToNow(viewingDate, { addSuffix: true })}
                    </div>
                    {agentName !== "Unassigned" && (
                      <div className="text-xs text-primary">{agentName}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

