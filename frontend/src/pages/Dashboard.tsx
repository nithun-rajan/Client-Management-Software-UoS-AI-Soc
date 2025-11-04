import { Building2, UserCheck, Users, PoundSterling, Activity, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useKPIs } from '@/hooks/useKPIs';
import { useEvents } from '@/hooks/useEvents';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import { formatDistanceToNow } from 'date-fns';


export default function Dashboard() {
  const { data: kpis, isLoading } = useKPIs();
  const { data: events, isLoading: isLoadingEvents } = useEvents();

  if (isLoading) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="p-6 space-y-6">
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
      title: 'Properties',
      icon: Building2,
      value: kpis?.properties.total || 0,
      subtitle: `${kpis?.properties.available || 0} available, ${kpis?.properties.let_by || 0} let`,
      gradient: 'from-primary to-secondary',
    },
    {
      title: 'Landlords',
      icon: UserCheck,
      value: kpis?.landlords.total || 0,
      subtitle: `${kpis?.landlords.verification_rate.toFixed(0) || 0}% AML verified`,
      gradient: 'from-accent to-emerald-500',
    },
    {
      title: 'Applicants',
      icon: Users,
      value: kpis?.applicants.total || 0,
      subtitle: `${kpis?.applicants.qualification_rate.toFixed(0) || 0}% qualified`,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'Average Rent',
      icon: PoundSterling,
      value: `£${kpis?.properties.avg_rent.toFixed(0) || 0}`,
      subtitle: 'per calendar month',
      gradient: 'from-blue-500 to-purple-500',
    },
  ];

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <Card
              key={card.title}
              className={`bg-gradient-to-br ${card.gradient} text-white border-0 shadow-elevated hover:shadow-xl transition-shadow`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-white/90">
                  <span className="text-sm font-medium">{card.title}</span>
                  <card.icon className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
                <p className="text-sm text-white/80 mt-1">{card.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Compliance Alert Card */}
          <Card className="md:col-span-3 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                Compliance Alerts
              </CardTitle>
              <CardDescription>Documents requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-muted-foreground">Expiring Soon</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">0</div>
                  <div className="text-sm text-muted-foreground">Expired</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{kpis?.properties.total || 0}</div>
                  <div className="text-sm text-muted-foreground">Compliant</div>
                </div>
              </div>
            </CardContent>
          </Card>
        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 shadow-card">
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
                events.slice(0, 5).map((event) => {
                  const eventIcon = event.entity_type === 'property' ? Building2 
                    : event.entity_type === 'applicant' ? Users 
                    : event.entity_type === 'landlord' ? UserCheck 
                    : Activity;
                  
                  const eventColor = event.entity_type === 'property' ? 'accent' 
                    : event.entity_type === 'applicant' ? 'primary' 
                    : event.entity_type === 'landlord' ? 'accent' 
                    : 'secondary';
                  
                  const eventTitle = event.event
                    .split('.')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                  const timeAgo = formatDistanceToNow(new Date(event.timestamp), { addSuffix: true });

                  return (
                    <div key={event.id} className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-${eventColor}/10`}>
                        
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{eventTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.entity_type} #{event.entity_id}
                        </p>
                        <p className="text-xs text-muted-foreground">{timeAgo}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
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
                <span className="text-sm text-muted-foreground">New properties</span>
                <span className="text-2xl font-bold text-accent">{kpis?.properties.available || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Properties let</span>
                <span className="text-2xl font-bold text-primary">{kpis?.properties.let_by || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New applicants</span>
                <span className="text-2xl font-bold text-secondary">{kpis?.applicants.total || 0}</span>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
