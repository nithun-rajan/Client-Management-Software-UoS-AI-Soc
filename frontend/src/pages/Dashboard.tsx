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
  Sun,
  Moon,
  CloudSun,
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
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import { formatDistanceToNow } from "date-fns";

// Import dashboard widgets
import ActiveListingsWidget from "@/components/dashboard/ActiveListingsWidget";
import NewPropertiesWidget from "@/components/dashboard/NewPropertiesWidget";
import PipelineValueWidget from "@/components/dashboard/PipelineValueWidget";
import ApplicantFunnelWidget from "@/components/dashboard/ApplicantFunnelWidget";
import UpcomingViewingsWidget from "@/components/dashboard/UpcomingViewingsWidget";
import TasksDueTodayWidget from "@/components/dashboard/TasksDueTodayWidget";
import MarketSnapshotWidget from "@/components/dashboard/MarketSnapshotWidget";

export default function Dashboard() {
  const { data: kpis, isLoading } = useKPIs();
  const { data: events, isLoading: isLoadingEvents } = useEvents();
  const { user } = useAuth();
  const [complianceOpen, setComplianceOpen] = useState(false);

  // Get greeting and icon based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", icon: Sun, color: "text-yellow-500 dark:text-yellow-400" };
    if (hour < 17) return { text: "Good Afternoon", icon: CloudSun, color: "text-orange-500 dark:text-orange-400" };
    return { text: "Good Evening", icon: Moon, color: "text-blue-400 dark:text-blue-300" };
  };

  // Get user's first name or email
  const getUserName = () => {
    if (user?.first_name) return user.first_name;
    if (user?.email) return user.email.split("@")[0];
    return "there";
  };

  const greetingData = getGreeting();
  const greeting = greetingData.text;
  const GreetingIcon = greetingData.icon;
  const iconColor = greetingData.color;
  const userName = getUserName();

  if (isLoading) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="space-y-6 p-6">
          {/* Greeting Banner */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-12 w-64" />
            </div>
            <Skeleton className="h-6 w-48 mt-2 ml-[52px]" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Only show average price KPI cards
  const kpiCards = [
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
        {/* Greeting Banner */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <GreetingIcon className={`h-10 w-10 ${iconColor}`} />
            <h1 className="text-4xl font-bold text-foreground">
              {greeting}, {userName}!
            </h1>
          </div>
          <p className="text-muted-foreground mt-2 ml-[52px]">
            Here's your dashboard overview
          </p>
        </div>

        {/* Top KPI Cards - Average Prices Only */}
        <div className="grid gap-6 md:grid-cols-2">
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

        {/* Dashboard Widgets - Top Row (Moved to top) */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <ApplicantFunnelWidget />
          <div className="grid gap-6">
            <UpcomingViewingsWidget />
            <TasksDueTodayWidget />
          </div>
        </div>

        {/* Dashboard Widgets - Row 1 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ActiveListingsWidget />
          <NewPropertiesWidget />
          <PipelineValueWidget />
        </div>

        {/* Dashboard Widgets - Row 2 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MarketSnapshotWidget />
          {/* Coworkers Activity Widget */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Coworkers Activity
              </CardTitle>
              <CardDescription>Recent activities from your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingEvents ? (
                <>
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </>
              ) : events && events.length > 0 ? (
                events.slice(0, 3).map((event) => {
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

                  // Determine color classes based on entity type
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

                  // Format event title
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
                        {event.user && (
                          <p className="text-xs text-muted-foreground">
                            by {event.user}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">{timeAgo}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No team activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Widget */}
          <Card className="shadow-card">
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
                events.slice(0, 3).map((event) => {
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

                  // Determine color classes based on entity type
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

                  // Format event title
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
