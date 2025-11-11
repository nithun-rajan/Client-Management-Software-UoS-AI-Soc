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
  CheckSquare,
  Mail,
  TrendingUp,
  TrendingDown,
  Clock,
  Trophy,
  BarChart3,
  ArrowRight,
  UserPlus,
  Sun,
  Moon,
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
import { Badge } from "@/components/ui/badge";
import { useKPIs } from "@/hooks/useKPIs";
import { useEvents } from "@/hooks/useEvents";
import { useProperties } from "@/hooks/useProperties";
import { useApplicants } from "@/hooks/useApplicants";
import { useTasks } from "@/hooks/useTasks";
import { useViewingsQuery } from "@/hooks/useViewings";
import { useNotifications } from "@/hooks/useNotifications";
import { useUsers } from "@/hooks/useUsers";
import { useOffers } from "@/hooks/useOffers";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import { formatDistanceToNow, format, isToday, isThisWeek, addDays, startOfDay } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: kpis, isLoading } = useKPIs();
  const { data: events, isLoading: isLoadingEvents } = useEvents();
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { data: applicants, isLoading: isLoadingApplicants } = useApplicants();
  const { data: tasks, isLoading: isLoadingTasks } = useTasks();
  const { data: viewings, isLoading: isLoadingViewings } = useViewingsQuery({ limit: 20 });
  const { data: notifications } = useNotifications();
  const { data: agents } = useUsers("agent");
  const { data: offers } = useOffers();
  const [complianceOpen, setComplianceOpen] = useState(false);
  const { user, isLoading: isLoadingUser } = useAuth();

  // Get greeting based on time of day with icon and color
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return { text: "Good morning", Icon: Sun, color: "text-yellow-500" };
    }
    if (hour < 17) {
      return { text: "Good afternoon", Icon: Sun, color: "text-orange-500" };
    }
    return { text: "Good evening", Icon: Moon, color: "text-indigo-500" };
  };

  const greeting = getGreeting();
  const firstName = user?.first_name;
  
  // Debug: Log user data to help troubleshoot
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard - User data:', { user, isLoadingUser, firstName });
  }

  // Widget 1: Active Listings Count - Total properties for sale and letting
  const activeListings = useMemo(() => {
    if (!properties) return { forSale: 0, forLetting: 0, total: 0 };
    const forSale = properties.filter(p => p.sales_status && p.sales_status.trim() !== "" && p.vendor_id && !p.landlord_id).length;
    const forLetting = properties.filter(p => p.landlord_id && !p.vendor_id && (!p.sales_status || p.sales_status.trim() === "")).length;
    return { forSale, forLetting, total: forSale + forLetting };
  }, [properties]);

  // Widget 2: New Properties This Week - Properties added in last 7 days
  const newPropertiesThisWeek = useMemo(() => {
    if (!properties) return 0;
    const weekAgo = addDays(new Date(), -7);
    return properties.filter(p => {
      if (!p.created_at) return false;
      return new Date(p.created_at) >= weekAgo;
    }).length;
  }, [properties]);

  // Widget 3: Pipeline Value - Total estimated value of active listings
  const pipelineValue = useMemo(() => {
    if (!properties) return { sales: 0, lettings: 0, total: 0 };
    const salesProperties = properties.filter(p => p.sales_status && p.sales_status.trim() !== "" && p.asking_price);
    const lettingsProperties = properties.filter(p => p.landlord_id && p.rent);
    const salesTotal = salesProperties.reduce((sum, p) => sum + (p.asking_price || 0), 0);
    const lettingsTotal = lettingsProperties.reduce((sum, p) => sum + (p.rent || 0), 0);
    return { sales: salesTotal, lettings: lettingsTotal, total: salesTotal + lettingsTotal };
  }, [properties]);

  // Widget 4: Agent Leaderboard - Top agents by deals closed this month
  const agentLeaderboard = useMemo(() => {
    if (!agents || !offers) return [];
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const acceptedOffers = offers.filter(o => 
      o.status === "accepted" && 
      o.accepted_at && 
      new Date(o.accepted_at) >= thisMonth
    );
    const agentDeals: Record<string, number> = {};
    acceptedOffers.forEach(offer => {
      // Assuming offers have assigned_agent or we can derive from applicant
      // This is a placeholder - adjust based on actual data structure
      const agentName = offer.applicant?.name || "Unknown";
      agentDeals[agentName] = (agentDeals[agentName] || 0) + 1;
    });
    return Object.entries(agentDeals)
      .map(([name, count]) => ({ name, count, branch: "Main Branch" }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [agents, offers]);

  // Widget 5: Applicant Funnel - Applicants by stage
  const applicantFunnel = useMemo(() => {
    if (!applicants) return { lead: 0, viewing: 0, offer: 0, completed: 0 };
    return {
      lead: applicants.filter(a => a.status === "new" || a.status === "qualified").length,
      viewing: applicants.filter(a => a.status === "viewing_booked").length,
      offer: applicants.filter(a => a.status === "offer_submitted" || a.status === "offer_accepted").length,
      completed: applicants.filter(a => a.status === "let_agreed" || a.status === "tenancy_started").length,
    };
  }, [applicants]);

  // Widget 6: Upcoming Viewings - Scheduled viewings in next 7 days
  const upcomingViewings = useMemo(() => {
    if (!viewings) return [];
    const today = startOfDay(new Date());
    const nextWeek = addDays(today, 7);
    return viewings
      .filter(v => {
        if (!v.scheduled_date) return false;
        const viewingDate = new Date(v.scheduled_date);
        return viewingDate >= today && viewingDate <= nextWeek && v.status !== "cancelled";
      })
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
      .slice(0, 5);
  }, [viewings]);

  // Widget 7: Tasks Due Today - Pending tasks for logged-in agent
  const tasksDueToday = useMemo(() => {
    if (!tasks || !user) return [];
    const today = startOfDay(new Date());
    const agentName = `${user.first_name} ${user.last_name}`;
    return tasks.filter(t => {
      if (t.assigned_to !== agentName) return false;
      if (t.status === "completed" || t.status === "cancelled") return false;
      if (!t.due_date) return false;
      const dueDate = startOfDay(new Date(t.due_date));
      return dueDate.getTime() === today.getTime();
    });
  }, [tasks, user]);

  // Widget: My Team - Team members on the same team as current user
  const myTeamMembers = useMemo(() => {
    if (!agents || !user) return [];
    // Filter agents on the same team, excluding the current user
    // Use type assertion to access team property which may exist on the user object
    const userTeam = (user as any).team;
    if (!userTeam) {
      // If user has no team, show first 3 agents as a fallback
      return agents.filter(a => a.id !== user.id).slice(0, 3);
    }
    return agents.filter(a => a.id !== user.id && a.team === userTeam).slice(0, 5);
  }, [agents, user]);

  // Widget 9: Market Snapshot - High-level market stats
  const marketSnapshot = useMemo(() => {
    if (!properties || !kpis) return null;
    const salesProperties = properties.filter(p => p.sales_status && p.asking_price);
    const avgPrice = salesProperties.length > 0
      ? salesProperties.reduce((sum, p) => sum + (p.asking_price || 0), 0) / salesProperties.length
      : 0;
    // Calculate average days on market if available (property might have created_at and updated_at)
    const propertiesWithDates = properties.filter(p => p.created_at);
    const avgDaysOnMarket = propertiesWithDates.length > 0
      ? propertiesWithDates.reduce((sum, p) => {
          const created = new Date(p.created_at);
          const now = new Date();
          const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / propertiesWithDates.length
      : 0;
    return {
      avgPrice,
      avgDaysOnMarket: Math.round(avgDaysOnMarket),
      demandLevel: applicants && applicants.length > 50 ? "High" : applicants && applicants.length > 20 ? "Medium" : "Low",
    };
  }, [properties, kpis, applicants]);

  if (isLoading) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="space-y-6 p-6">
          {/* Personalized Greeting */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <greeting.Icon className={`h-8 w-8 ${greeting.color}`} />
              {greeting.text}{firstName ? `, ${firstName}` : isLoadingUser ? "" : ""}!
            </h1>
          </div>
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
<<<<<<< HEAD
        {/* Personalized Greeting */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <greeting.Icon className={`h-8 w-8 ${greeting.color}`} />
            {greeting.text}{firstName ? `, ${firstName}` : ""}!
          </h1>
        </div>

        {/* Row 1: Upcoming Viewings, Tasks Due Today, and My Team */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Upcoming Viewings */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
                Upcoming Viewings
              </CardTitle>
              <CardDescription>Scheduled viewings in the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingViewings ? (
                <Skeleton className="h-32" />
              ) : upcomingViewings.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No upcoming viewings</div>
              ) : (
                <div className="space-y-3">
                  {upcomingViewings.map((viewing) => (
                    <div key={viewing.id} className="p-2 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {viewing.property?.address_line1 || viewing.property?.address || "Property"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {viewing.applicant?.name || viewing.applicant?.first_name ? 
                              `${viewing.applicant?.first_name || ""} ${viewing.applicant?.last_name || ""}`.trim() || viewing.applicant?.name : 
                              "Applicant"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {viewing.scheduled_date && format(new Date(viewing.scheduled_date), "MMM dd, HH:mm")}
                          </p>
                        </div>
                        {viewing.assigned_agent && (
                          <Badge variant="outline" className="text-xs">{viewing.assigned_agent}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate("/calendar")}>
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks Due Today */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckSquare className="h-5 w-5 text-orange-500" />
                Tasks Due Today
              </CardTitle>
              <CardDescription>Pending tasks for you</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <Skeleton className="h-32" />
              ) : tasksDueToday.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckSquare className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  <p className="text-sm text-muted-foreground">No tasks due today</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasksDueToday.map((task) => (
                    <Link
                      key={task.id}
                      to="/my-tasks"
                      className="block p-2 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{task.description}</p>
                          )}
                        </div>
                        <Badge 
                          variant={task.priority === "urgent" || task.priority === "high" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate("/my-tasks")}>
                    View All Tasks <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Team */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5 text-purple-500" />
                My Team
              </CardTitle>
              <CardDescription>Your team members</CardDescription>
            </CardHeader>
            <CardContent>
              {!agents ? (
                <Skeleton className="h-32" />
              ) : myTeamMembers.length === 0 ? (
                <div className="py-8 text-center">
                  <UserPlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No team members found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myTeamMembers.map((member) => (
                    <div 
                      key={member.id} 
                      onClick={() => navigate("/agents", { state: { selectedAgentId: member.id } })}
                      className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                        {member.first_name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.first_name && member.last_name
                            ? `${member.first_name} ${member.last_name}`
                            : member.first_name || member.email || "Team Member"}
                        </p>
                        {member.email && (
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        )}
                      </div>
                      {member.is_active !== false && (
                        <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" title="Active" />
                      )}
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate("/agents")}>
                    View All Agents <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Main Widgets - 2 larger widgets side by side */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Applicant Funnel Chart - Left side */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Applicant Funnel
              </CardTitle>
              <CardDescription>Applicants moving through stages</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingApplicants ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Lead</span>
                      <span className="text-lg font-bold">{applicantFunnel.lead}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min((applicantFunnel.lead / Math.max(applicantFunnel.lead + applicantFunnel.viewing + applicantFunnel.offer + applicantFunnel.completed, 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Viewing</span>
                      <span className="text-lg font-bold">{applicantFunnel.viewing}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${Math.min((applicantFunnel.viewing / Math.max(applicantFunnel.lead + applicantFunnel.viewing + applicantFunnel.offer + applicantFunnel.completed, 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Offer</span>
                      <span className="text-lg font-bold">{applicantFunnel.offer}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${Math.min((applicantFunnel.offer / Math.max(applicantFunnel.lead + applicantFunnel.viewing + applicantFunnel.offer + applicantFunnel.completed, 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Completed</span>
                      <span className="text-lg font-bold text-green-600">{applicantFunnel.completed}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min((applicantFunnel.completed / Math.max(applicantFunnel.lead + applicantFunnel.viewing + applicantFunnel.offer + applicantFunnel.completed, 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Feed - Right side */}
          <Card className="shadow-card">
=======
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
        </div>

        {/* Row 3: KPI Cards - Compact 3 cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Active Listings Count - Compact version */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProperties ? (
                <Skeleton className="h-16" />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">For Sale</span>
                    <span className="text-2xl font-bold">{activeListings.forSale}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">For Letting</span>
                    <span className="text-2xl font-bold">{activeListings.forLetting}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total</span>
                      <span className="text-xl font-bold text-primary">{activeListings.total}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* New Properties This Week - Compact version */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">New Properties This Week</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProperties ? (
                <Skeleton className="h-16" />
              ) : (
                <div className="flex items-center justify-center h-16">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{newPropertiesThisWeek}</div>
                    <p className="text-xs text-muted-foreground mt-1">new listings</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Value - Compact version */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Pipeline Value</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProperties ? (
                <Skeleton className="h-16" />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sales</span>
                    <span className="text-lg font-semibold">£{(pipelineValue.sales / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lettings</span>
                    <span className="text-lg font-semibold">£{(pipelineValue.lettings / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total</span>
                      <span className="text-xl font-bold text-emerald-600">£{(pipelineValue.total / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
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
