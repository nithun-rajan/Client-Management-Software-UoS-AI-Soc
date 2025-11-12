import { useState, useMemo } from "react";
import { Search, Users, Mail, Phone, TrendingUp, Clock, PoundSterling, Star, Home, UserCheck, Building2, Award, Activity } from "lucide-react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAgents, Agent, useAgentManagedEntities } from "@/hooks/useAgents";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { Checkbox as UICheckbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Format agent ID for display (convert UUID to 4-digit number)
const formatAgentId = (id: string): string => {
  if (!id) return "N/A";
  // Convert UUID to a consistent 4-digit number
  // Use a simple hash of the UUID to get a deterministic 4-digit number
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return String(Math.abs(hash) % 10000).padStart(4, '0');
};

// Generate formal ID picture URL based on agent name
const getAgentPhotoUrl = (firstName: string, lastName: string): string => {
  // Use a placeholder service or generate based on name
  const name = `${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '-');
  // Using a placeholder image service - in production, these would be actual photos
  return `https://i.pravatar.cc/150?img=${Math.abs(name.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)) % 70}`;
};

// Note: Team, position, phone, and online status now come from the API

export default function Agents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [onMyTeamFilter, setOnMyTeamFilter] = useState(false);
  
  // Get current user's team (mock - in real app would come from auth)
  // Set to "Sales Team" for testing - change this to "Lettings Team" to test the other team
  const currentUserTeam = "Sales Team"; // This would come from the logged-in user's data
  
  const { data: agents, isLoading } = useAgents(onMyTeamFilter ? currentUserTeam : undefined, searchQuery || undefined);

  // Agents are already filtered by the API, so we can use them directly
  const filteredAgents = agents || [];

  // Calculate stats from API data
  const stats = useMemo(() => {
    if (!agents) return { total: 0, active: 0, inactive: 0, online: 0, offline: 0 };
    const onlineCount = agents.filter((a) => a.online_status).length;
    return {
      total: agents.length,
      active: agents.filter((a) => a.is_active).length,
      inactive: agents.filter((a) => !a.is_active).length,
      online: onlineCount,
      offline: agents.length - onlineCount,
    };
  }, [agents]);

  // Get selected agent data
  const selectedAgentData = useMemo(() => {
    if (!selectedAgent || !agents) return null;
    return agents.find((a) => a.id === selectedAgent);
  }, [selectedAgent, agents]);

  // Fetch managed entities for selected agent
  const { data: managedEntities, isLoading: managedLoading } = useAgentManagedEntities(
    selectedAgentData?.id || ""
  );

  // Get agent stats from API data
  const getAgentStats = (agent: Agent) => {
    return {
      askingPrice: agent.stats.asking_price_achievement 
        ? `${agent.stats.asking_price_achievement.toFixed(0)}%`
        : "N/A",
      daysOnMarket: agent.stats.days_on_market_avg 
        ? `${agent.stats.days_on_market_avg.toFixed(0)}`
        : "N/A",
      monthlyFees: agent.stats.monthly_fees 
        ? `£${(agent.stats.monthly_fees / 1000).toFixed(1)}k`
        : "£0",
      satisfaction: agent.stats.satisfaction_score 
        ? agent.stats.satisfaction_score.toFixed(1)
        : "N/A",
    };
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Agents" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Agents" />
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        {!isLoading && agents && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Agents</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Agents</p>
                    <p className="text-2xl font-bold text-green-600">{stats.online}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inactive Agents</p>
                    <p className="text-2xl font-bold text-muted-foreground">{stats.offline}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center space-x-2">
            <UICheckbox
              id="on-my-team"
              checked={onMyTeamFilter}
              onCheckedChange={(checked) => setOnMyTeamFilter(checked === true)}
            />
            <Label htmlFor="on-my-team" className="text-sm font-normal cursor-pointer">
              On my team
            </Label>
          </div>
        </div>

        {/* Agents Grid */}
        {filteredAgents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No agents found"
            description={
              searchQuery
                ? "Try adjusting your search query"
                : "No agents in the system"
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => {
              const stats = getAgentStats(agent);
              const fullName = `${agent.first_name || ""} ${agent.last_name || ""}`.trim() || "Unknown";
              const initials = fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const agentId = formatAgentId(agent.id);
              const isOnline = agent.online_status;
              const photoUrl = getAgentPhotoUrl(agent.first_name || "", agent.last_name || "");
              const phone = agent.phone || "N/A";
              const position = agent.position || "Agent";
              const team = agent.team || "N/A";

              return (
                <Card
                  key={agent.id}
                  className={`hover:shadow-lg transition-all cursor-pointer ${
                    selectedAgent === agent.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={photoUrl} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online/Offline Status Indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${
                          isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-semibold truncate">{fullName}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className="text-xs font-mono"
                            title={`Full ID: ${agent.id}`}
                          >
                            {agentId}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {position}: <span className={team === currentUserTeam ? "text-primary font-medium" : "text-muted-foreground font-medium"}>{team}</span>
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      {agent.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{agent.email}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Agent Detail Dialog */}
        <Dialog open={!!selectedAgentData} onOpenChange={(open) => !open && setSelectedAgent(null)}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            {selectedAgentData && (() => {
              const fullName = `${selectedAgentData.first_name || ""} ${selectedAgentData.last_name || ""}`.trim() || "Unknown";
              const initials = fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              const agentId = formatAgentId(selectedAgentData.id);
              const isOnline = selectedAgentData.online_status;
              const photoUrl = getAgentPhotoUrl(selectedAgentData.first_name || "", selectedAgentData.last_name || "");
              const phone = selectedAgentData.phone || "N/A";
              const position = selectedAgentData.position || "Agent";
              const team = selectedAgentData.team || "N/A";
              const role = selectedAgentData.role ? selectedAgentData.role.charAt(0).toUpperCase() + selectedAgentData.role.slice(1) : "Agent";
              const qualifications = `ARLA Level 3 • ${Math.floor(Math.random() * 10) + 3} years experience`;
              const stats = getAgentStats(selectedAgentData);
              
              // Determine default tab (first available tab or KPIs)
              const getDefaultTab = () => {
                if (managedEntities?.properties && managedEntities.properties.length > 0) return "properties";
                if (managedEntities?.vendors && managedEntities.vendors.length > 0) return "vendors";
                if (managedEntities?.buyers && managedEntities.buyers.length > 0) return "buyers";
                if (managedEntities?.landlords && managedEntities.landlords.length > 0) return "landlords";
                if (managedEntities?.applicants && managedEntities.applicants.length > 0) return "applicants";
                return "kpis";
              };
              
              // Mock activity feed
              const activities = [
                { type: "listing", text: "Listed new property: Court Road, SO15", time: "2 hours ago", icon: Home },
                { type: "update", text: "Updated offer status for High Street property", time: "5 hours ago", icon: TrendingUp },
                { type: "deal", text: "Completed deal: Portswood Rd - £340,000", time: "1 day ago", icon: Star },
                { type: "listing", text: "Listed new property: The Avenue", time: "2 days ago", icon: Home },
                { type: "update", text: "Updated tenant application status", time: "3 days ago", icon: UserCheck },
              ];

              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={photoUrl} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online/Offline Status Indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${
                          isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <DialogTitle className="text-xl">{fullName}</DialogTitle>
                          <Badge 
                            variant="outline" 
                            className="text-xs font-mono"
                            title={`Full ID: ${selectedAgentData.id}`}
                          >
                            {agentId}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-primary mt-1">{role}</p>
                        <p className="text-sm text-muted-foreground">
                          {position}: <span className={team === currentUserTeam ? "text-primary font-medium" : "text-muted-foreground font-medium"}>{team}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{qualifications}</p>
                      </div>
                    </div>
                  </DialogHeader>

                  {/* Contact Info */}
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-sm">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {selectedAgentData.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${selectedAgentData.email}`} className="text-primary hover:underline">
                            {selectedAgentData.email}
                          </a>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{phone}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Tabs defaultValue={getDefaultTab()} className="mt-4">
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${(() => {
                      const tabs = [];
                      if (managedEntities?.properties && managedEntities.properties.length > 0) tabs.push("properties");
                      if (managedEntities?.vendors && managedEntities.vendors.length > 0) tabs.push("vendors");
                      if (managedEntities?.buyers && managedEntities.buyers.length > 0) tabs.push("buyers");
                      if (managedEntities?.landlords && managedEntities.landlords.length > 0) tabs.push("landlords");
                      if (managedEntities?.applicants && managedEntities.applicants.length > 0) tabs.push("applicants");
                      tabs.push("kpis"); // Always show KPIs
                      return tabs.length;
                    })()}, 1fr)` }}>
                      {(() => {
                        const tabs = [];
                        if (managedEntities?.properties && managedEntities.properties.length > 0) {
                          tabs.push({ value: "properties", label: "Properties" });
                        }
                        if (managedEntities?.vendors && managedEntities.vendors.length > 0) {
                          tabs.push({ value: "vendors", label: "Vendors" });
                        }
                        if (managedEntities?.buyers && managedEntities.buyers.length > 0) {
                          tabs.push({ value: "buyers", label: "Buyers" });
                        }
                        if (managedEntities?.landlords && managedEntities.landlords.length > 0) {
                          tabs.push({ value: "landlords", label: "Landlords" });
                        }
                        if (managedEntities?.applicants && managedEntities.applicants.length > 0) {
                          tabs.push({ value: "applicants", label: "Applicants" });
                        }
                        tabs.push({ value: "kpis", label: "KPIs" }); // Always show KPIs
                        return tabs.map((t) => (
                          <TabsTrigger key={t.value} value={t.value} className="text-xs sm:text-sm">
                            {t.label}
                          </TabsTrigger>
                        ));
                      })()}
                    </TabsList>

                    {managedEntities?.properties && managedEntities.properties.length > 0 && (
                      <TabsContent value="properties" className="mt-4 space-y-3">
                        {managedLoading ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-16" />
                            ))}
                          </div>
                        ) : (
                          managedEntities.properties.map((prop) => (
                            <Card key={prop.id} className="hover:shadow-sm transition-shadow">
                              <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                  <Home className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{prop.name}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </TabsContent>
                    )}

                    {managedEntities?.applicants && managedEntities.applicants.length > 0 && (
                      <TabsContent value="applicants" className="mt-4 space-y-3">
                        {managedLoading ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-16" />
                            ))}
                          </div>
                        ) : (
                          managedEntities.applicants.map((applicant) => (
                            <Card key={applicant.id} className="hover:shadow-sm transition-shadow">
                              <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                  <Users className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{applicant.name}</p>
                                    <p className="text-xs text-muted-foreground">Tenant</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </TabsContent>
                    )}

                    {managedEntities?.vendors && managedEntities.vendors.length > 0 && (
                      <TabsContent value="vendors" className="mt-4">
                        {managedLoading ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-16" />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {managedEntities.vendors.map((vendor) => (
                              <Card key={vendor.id} className="hover:shadow-sm transition-shadow">
                                <CardContent className="flex items-center gap-3 p-4">
                                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{vendor.name}</span>
                                    {vendor.property_count > 0 && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {vendor.property_count} {vendor.property_count === 1 ? "property" : "properties"}
                                      </p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    )}

                    {managedEntities?.buyers && managedEntities.buyers.length > 0 && (
                      <TabsContent value="buyers" className="mt-4 space-y-3">
                        {managedLoading ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-16" />
                            ))}
                          </div>
                        ) : (
                          managedEntities.buyers.map((buyer) => (
                            <Card key={buyer.id} className="hover:shadow-sm transition-shadow">
                              <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                  <Users className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{buyer.name}</p>
                                    <p className="text-xs text-muted-foreground">Buyer</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </TabsContent>
                    )}

                    {managedEntities?.landlords && managedEntities.landlords.length > 0 && (
                      <TabsContent value="landlords" className="mt-4">
                        {managedLoading ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-16" />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {managedEntities.landlords.map((landlord) => (
                              <Card key={landlord.id} className="hover:shadow-sm transition-shadow">
                                <CardContent className="flex items-center gap-3 p-4">
                                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{landlord.name}</span>
                                    {landlord.property_count > 0 && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {landlord.property_count} {landlord.property_count === 1 ? "property" : "properties"}
                                      </p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    )}

                    <TabsContent value="kpis" className="mt-4">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                          { icon: TrendingUp, label: "Asking Price", value: stats.askingPrice },
                          { icon: Clock, label: "Days on Market", value: stats.daysOnMarket },
                          { icon: PoundSterling, label: "Monthly Fees", value: stats.monthlyFees },
                          { icon: Star, label: "Satisfaction", value: stats.satisfaction },
                        ].map((stat, i) => (
                          <Card key={i}>
                            <CardContent className="p-4 text-center">
                              <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                              <p className="text-2xl font-bold">{stat.value}</p>
                              <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Activity Feed */}
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Activity Feed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {activities.map((activity, i) => (
                          <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                            <activity.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{activity.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

