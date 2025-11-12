import { useState, useMemo } from "react";
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
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Clock,
  Home,
  BarChart3,
  Sun,
  Moon,
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
import { useProperties } from "@/hooks/useProperties";
import { useApplicants } from "@/hooks/useApplicants";
import { useUpcomingViewings } from "@/hooks/useViewings";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import { formatDistanceToNow, format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: kpis, isLoading } = useKPIs();
  const { data: events, isLoading: isLoadingEvents } = useEvents();
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { data: applicants, isLoading: isLoadingApplicants } = useApplicants();
  const { data: upcomingViewings, isLoading: isLoadingViewings } = useUpcomingViewings(7);
  const { data: tasks, isLoading: isLoadingTasks } = useTasks();
  const [complianceOpen, setComplianceOpen] = useState(false);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good Morning";
    } else if (hour < 18) {
      return "Good Afternoon";
    } else {
      return "Good Evening";
    }
  };

  // Get icon based on time of day
  const getTimeIcon = () => {
    const hour = new Date().getHours();
    // Show sun during day (6 AM - 6 PM), moon during night
    if (hour >= 6 && hour < 18) {
      return <Sun className="h-8 w-8 text-yellow-500" />;
    } else {
      return <Moon className="h-8 w-8 text-blue-400" />;
    }
  };

  // Get user's first name or email
  const getUserName = () => {
    if (user?.first_name) {
      return user.first_name;
    } else if (user?.email) {
      return user.email.split("@")[0];
    }
    return "";
  };

  // Calculate new properties this week
  const newPropertiesThisWeek = useMemo(() => {
    if (!properties) return 0;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return properties.filter((p) => {
      const createdDate = new Date(p.created_at);
      return createdDate >= weekAgo;
    }).length;
  }, [properties]);

  // Calculate pipeline value
  const pipelineValue = useMemo(() => {
    if (!properties) return { sales: 0, lettings: 0, total: 0 };
    const salesValue = properties
      .filter((p) => p.asking_price && p.sales_status && p.sales_status !== "completed" && p.sales_status !== "withdrawn")
      .reduce((sum, p) => sum + (p.asking_price || 0), 0);
    const lettingsValue = properties
      .filter((p) => p.rent && (p.status === "available" || p.status === "let_agreed"))
      .reduce((sum, p) => sum + (p.rent || 0) * 12, 0); // Annual rent value
    return {
      sales: salesValue,
      lettings: lettingsValue,
      total: salesValue + lettingsValue,
    };
  }, [properties]);

  // Calculate market snapshot
  const marketSnapshot = useMemo(() => {
    if (!properties || properties.length === 0) {
      return {
        avgPrice: 0,
        avgDaysOnMarket: 0,
        demandLevel: "Low",
      };
    }
    
    // Average property price (sales)
    const salesProperties = properties.filter((p) => p.asking_price);
    const avgPrice = salesProperties.length > 0
      ? salesProperties.reduce((sum, p) => sum + (p.asking_price || 0), 0) / salesProperties.length
      : 0;

    // Average days on market (simplified - using created_at as listed date)
    const now = new Date();
    const daysOnMarket = properties
      .filter((p) => p.created_at && (p.status === "available" || p.status === "under_offer"))
      .map((p) => {
        const listedDate = new Date(p.created_at);
        return Math.floor((now.getTime() - listedDate.getTime()) / (1000 * 60 * 60 * 24));
      });
    const avgDaysOnMarket = daysOnMarket.length > 0
      ? daysOnMarket.reduce((sum, days) => sum + days, 0) / daysOnMarket.length
      : 0;

    // Demand level (based on available properties vs total)
    const availableCount = properties.filter((p) => p.status === "available").length;
    const demandLevel = availableCount < properties.length * 0.3 ? "High" : 
                        availableCount < properties.length * 0.6 ? "Medium" : "Low";

    return {
      avgPrice,
      avgDaysOnMarket: Math.round(avgDaysOnMarket),
      demandLevel,
    };
  }, [properties]);

  // Calculate applicant funnel
  const applicantFunnel = useMemo(() => {
    if (!applicants) return [];
    const statusCounts: Record<string, number> = {};
    applicants.forEach((app) => {
      const status = app.status || "new";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

      // Map statuses to funnel stages
      const funnelStages = [
        { name: "Lead", count: statusCounts["new"] || 0 },
        { name: "Viewing", count: statusCounts["viewing_booked"] || 0 },
        { name: "Offer", count: (statusCounts["offer_submitted"] || 0) + (statusCounts["offer_accepted"] || 0) },
        { name: "Completed", count: statusCounts["tenancy_started"] || 0 },
      ];

    return funnelStages;
  }, [applicants]);

  // Tasks due today
  const tasksDueToday = useMemo(() => {
    if (!tasks) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate < tomorrow && 
             task.status !== "completed" && 
             task.status !== "cancelled" &&
             (!user || task.assigned_to === user.id || !task.assigned_to);
    }).slice(0, 5);
  }, [tasks, user]);

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
  ];

  return (
    <div>
      <Header title="Dashboard" />
      <div className="space-y-6 p-6">
        {/* Greeting Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            {getTimeIcon()}
            <h1 className="text-4xl font-bold text-foreground">
              {getGreeting()}{getUserName() ? `, ${getUserName()}` : ""}
            </h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your properties today.
          </p>
        </div>

        {/* Top Priority Widgets */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Applicant Funnel Chart Widget */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Applicant Funnel
              </CardTitle>
              <CardDescription>Applicants moving through stages</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingApplicants ? (
                <Skeleton className="h-64" />
              ) : applicantFunnel.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={applicantFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#667eea" radius={[0, 4, 4, 0]}>
                      {applicantFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          index === 0 ? "#667eea" :
                          index === 1 ? "#10b981" :
                          index === 2 ? "#f59e0b" :
                          "#ef4444"
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  No applicant data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Viewings Widget */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Viewings
              </CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingViewings ? (
                <Skeleton className="h-64" />
              ) : upcomingViewings && upcomingViewings.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {upcomingViewings.slice(0, 5).map((viewing) => (
                    <div key={viewing.id} className="flex items-start justify-between gap-2 p-2 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {viewing.property?.address || "Property"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {viewing.applicant?.name || "Applicant"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(viewing.scheduled_date), "MMM d, h:mm a")}
                        </p>
                      </div>
                      {viewing.assigned_agent && (
                        <UserCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  No upcoming viewings
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks Due Today Widget */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks Due Today
              </CardTitle>
              <CardDescription>Pending tasks for you</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <Skeleton className="h-64" />
              ) : tasksDueToday.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {tasksDueToday.map((task) => (
                    <div key={task.id} className="flex items-start justify-between gap-2 p-2 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            task.priority === "urgent" ? "bg-red-100 text-red-700" :
                            task.priority === "high" ? "bg-orange-100 text-orange-700" :
                            task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {task.priority}
                          </span>
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(task.due_date), "h:mm a")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  No tasks due today
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top KPI Cards */}
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

        {/* New Widgets Row 1 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Active Listings Count Widget */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Home className="h-4 w-4" />
                Active Listings
              </CardTitle>
              <CardDescription>Total properties for sale and letting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">For Letting</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {kpis?.properties_letting?.total || kpis?.properties?.total || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-muted-foreground">For Sale</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {kpis?.properties_sale?.total || 0}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-xl font-bold">
                      {(kpis?.properties_letting?.total || kpis?.properties?.total || 0) + (kpis?.properties_sale?.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Properties This Week Widget */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                New Properties This Week
              </CardTitle>
              <CardDescription>Listings added in last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">
                {isLoadingProperties ? (
                  <Skeleton className="h-10 w-20" />
                ) : (
                  newPropertiesThisWeek
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {newPropertiesThisWeek === 1 ? "new listing" : "new listings"}
              </p>
            </CardContent>
          </Card>

          {/* Pipeline Value Widget */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                Pipeline Value
              </CardTitle>
              <CardDescription>Total estimated value of active listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sales</span>
                  <span className="text-lg font-bold text-purple-600">
                    {isLoadingProperties ? (
                      <Skeleton className="h-6 w-24" />
                    ) : (
                      `£${(pipelineValue.sales / 1000000).toFixed(1)}M`
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lettings (Annual)</span>
                  <span className="text-lg font-bold text-primary">
                    {isLoadingProperties ? (
                      <Skeleton className="h-6 w-24" />
                    ) : (
                      `£${(pipelineValue.lettings / 1000).toFixed(0)}K`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-xl font-bold">
                      {isLoadingProperties ? (
                        <Skeleton className="h-8 w-32" />
                      ) : (
                        `£${((pipelineValue.total) / 1000000).toFixed(1)}M`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Widgets Row 2 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Market Snapshot Widget */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Market Snapshot
              </CardTitle>
              <CardDescription>High-level market statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProperties ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Property Price</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">
                        £{marketSnapshot.avgPrice > 0 ? (marketSnapshot.avgPrice / 1000).toFixed(0) + "K" : "0"}
                      </span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Days on Market</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{marketSnapshot.avgDaysOnMarket}</span>
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Demand Level</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${
                        marketSnapshot.demandLevel === "High" ? "text-green-500" :
                        marketSnapshot.demandLevel === "Medium" ? "text-yellow-500" :
                        "text-red-500"
                      }`}>
                        {marketSnapshot.demandLevel}
                      </span>
                      {marketSnapshot.demandLevel === "High" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : marketSnapshot.demandLevel === "Low" ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Feed - Enhanced */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity Feed
              </CardTitle>
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
