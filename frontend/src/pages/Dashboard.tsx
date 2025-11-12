import { useState } from "react";
import {
  Building2,
  Building,
  UserCheck,
  Users,
  User,
  UserCircle,
  PoundSterling,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Handshake,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useKPIs } from "@/hooks/useKPIs";
import { useEvents } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: kpis, isLoading } = useKPIs();
  const { data: events, isLoading: isLoadingEvents } = useEvents();
  const [complianceOpen, setComplianceOpen] = useState(false);

  if (isLoading) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="space-y-6 p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Properties for Letting",
      icon: Building2,
      value: kpis?.properties_letting?.total || kpis?.properties?.total || 0,
      subtitle: `${kpis?.properties_letting?.available || kpis?.properties?.available || 0} available, ${kpis?.properties_letting?.let_by || kpis?.properties?.let_by || 0} let`,
      gradient: "from-primary to-secondary",
    },
    {
      title: "Properties for Sale",
      icon: Building,
      value: kpis?.properties_sale?.total || 0,
      subtitle: `Avg: £${(kpis?.properties_sale?.avg_selling_price || 0).toLocaleString()}`,
      gradient: "from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600",
    },
    {
      title: "Tenants",
      icon: Users,
      value: kpis?.tenants?.total || kpis?.applicants?.total || 0,
      subtitle: `${(kpis?.tenants?.qualification_rate || kpis?.applicants?.qualification_rate || 0).toFixed(0)}% qualified`,
      gradient: "from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600",
    },
    {
      title: "Buyers",
      icon: User,
      value: kpis?.buyers?.total || 0,
      subtitle: "Active buyers",
      gradient: "from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600",
    },
    {
      title: "Landlords",
      icon: UserCheck,
      value: kpis?.landlords?.total || 0,
      subtitle: `${(kpis?.landlords?.verification_rate || 0).toFixed(0)}% AML verified`,
      gradient: "from-accent to-emerald-500 dark:from-teal-600 dark:to-emerald-600",
    },
    {
      title: "Vendors",
      icon: UserCircle,
      value: kpis?.vendors?.total || 0,
      subtitle: "Active vendors",
      gradient: "from-indigo-500 to-blue-500 dark:from-indigo-600 dark:to-blue-600",
    },
    {
      title: "Average Rent",
      icon: PoundSterling,
      value: `£${(kpis?.properties_letting?.avg_rent || kpis?.properties?.avg_rent || 0).toFixed(0)}`,
      subtitle: "per calendar month",
      gradient: "from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600",
    },
    {
      title: "Average Selling Price",
      icon: PoundSterling,
      value: `£${(kpis?.properties_sale?.avg_selling_price || 0).toLocaleString()}`,
      subtitle: "properties for sale",
      gradient: "from-rose-500 to-pink-500 dark:from-rose-600 dark:to-pink-600",
    },
  ];

  return (
    <div>
      <Header title="Dashboard" />
      <div className="space-y-6 p-6">
        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <Card
              key={card.title}
              className={`bg-gradient-to-br ${card.gradient} border-0 text-white shadow-elevated transition-shadow hover:shadow-xl`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-white/90">
                  <span className="text-sm font-medium">{card.title}</span>
                  <card.icon className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
                <p className="mt-1 text-sm text-white/80">{card.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-card md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across your portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingEvents ? (
                <>
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </>
              ) : events && events.length > 0 ? (
                events.slice(0, 10).map((event) => {
                  // Determine icon component based on entity type
                  let IconComponent = Activity;
                  if (event.entity_type === "property") {
                    IconComponent = Building2;
                  } else if (event.entity_type === "applicant") {
                    IconComponent = Users;
                  } else if (event.entity_type === "landlord") {
                    IconComponent = UserCheck;
                  } else if (event.entity_type === "vendor") {
                    IconComponent = UserCircle;
                  } else if (event.entity_type === "task") {
                    IconComponent = Activity;
                  } else if (event.entity_type === "viewing") {
                    IconComponent = Calendar;
                  } else if (event.entity_type === "offer") {
                    IconComponent = Handshake;
                  } else if (event.entity_type === "communication") {
                    IconComponent = MessageSquare;
                  }

                  // Determine color classes based on entity type (using full class names for Tailwind)
                  let bgColorClass = "bg-muted/10";
                  let iconColorClass = "text-muted-foreground";
                  if (event.entity_type === "property") {
                    bgColorClass = "bg-primary/10";
                    iconColorClass = "text-primary";
                  } else if (event.entity_type === "applicant") {
                    bgColorClass = "bg-blue-500/10";
                    iconColorClass = "text-blue-500";
                  } else if (event.entity_type === "landlord") {
                    bgColorClass = "bg-accent/10";
                    iconColorClass = "text-accent";
                  } else if (event.entity_type === "vendor") {
                    bgColorClass = "bg-indigo-500/10";
                    iconColorClass = "text-indigo-500";
                  } else if (event.entity_type === "task") {
                    bgColorClass = "bg-orange-500/10";
                    iconColorClass = "text-orange-500";
                  } else if (event.entity_type === "viewing") {
                    bgColorClass = "bg-cyan-500/10";
                    iconColorClass = "text-cyan-500";
                  } else if (event.entity_type === "offer") {
                    bgColorClass = "bg-green-500/10";
                    iconColorClass = "text-green-500";
                  } else if (event.entity_type === "communication") {
                    bgColorClass = "bg-purple-500/10";
                    iconColorClass = "text-purple-500";
                  }

                  // Format event title - use description if available, otherwise format event name
                  const eventTitle = event.description 
                    ? event.description
                    : event.event
                        .split(".")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ");

                  const timeAgo = formatDistanceToNow(new Date(event.timestamp), {
                    addSuffix: true,
                  });

                  return (
                    <div key={event.id} className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColorClass}`}>
                        <IconComponent className={`h-5 w-5 ${iconColorClass}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{eventTitle}</p>
                        {event.entity_name && (
                          <p className="text-sm text-muted-foreground">
                            {event.entity_name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">{timeAgo}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <Activity className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>This month's overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Properties for Letting</span>
                <span className="text-2xl font-bold text-accent">
                  {kpis?.properties_letting?.total || kpis?.properties?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Properties for Sale</span>
                <span className="text-2xl font-bold text-primary">
                  {kpis?.properties_sale?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tenants</span>
                <span className="text-2xl font-bold text-secondary">
                  {kpis?.tenants?.total || kpis?.applicants?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Buyers</span>
                <span className="text-2xl font-bold text-blue-500">
                  {kpis?.buyers?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vendors</span>
                <span className="text-2xl font-bold text-indigo-500">
                  {kpis?.vendors?.total || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compliance Alert - Fixed Bottom Corner */}
      <div className="fixed bottom-6 right-6 z-50">
        {complianceOpen && (
          <Card className="mb-2 shadow-lg w-80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                Compliance Alerts
              </CardTitle>
              <CardDescription className="text-xs">Documents requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-muted-foreground">0</div>
                  <div className="text-xs text-muted-foreground">Expiring Soon</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-destructive">0</div>
                  <div className="text-xs text-muted-foreground">Expired</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">
                    {(kpis?.properties_letting?.total || kpis?.properties?.total || 0) + (kpis?.properties_sale?.total || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Compliant</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Button
          variant="outline"
          onClick={() => setComplianceOpen(!complianceOpen)}
          className="shadow-lg"
          size="lg"
        >
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Compliance Alerts</span>
          {complianceOpen ? (
            <ChevronDown className="h-4 w-4 ml-2" />
          ) : (
            <ChevronUp className="h-4 w-4 ml-2" />
          )}
        </Button>
      </div>
    </div>
  );
}
