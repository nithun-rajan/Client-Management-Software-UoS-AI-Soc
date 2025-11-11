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
<<<<<<< HEAD
import { useUsers } from "@/hooks/useUsers";
=======
import { useAgents, Agent } from "@/hooks/useAgents";
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { Checkbox as UICheckbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

<<<<<<< HEAD
// Generate agent ID (4-digit) from agent ID
const getAgentId = (id: string): string => {
  // Use a hash of the ID to generate a consistent 4-digit number
=======
// Format agent ID for display (convert UUID to 4-digit number)
const formatAgentId = (id: string): string => {
  if (!id) return "N/A";
  // Convert UUID to a consistent 4-digit number
  // Use a simple hash of the UUID to get a deterministic 4-digit number
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
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

<<<<<<< HEAD
// Get team from agent data, fallback to mock if not available
const getAgentTeam = (agent: { id: string; team?: string | null }): string => {
  // Use team from database if available
  if (agent.team) {
    return agent.team;
  }
  // Fallback to mock assignment for backwards compatibility
  const hash = agent.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
  const index = Math.abs(hash) % 5; // 5 agents total
  // Make first two agents (index 0, 1) Sales Team, rest Lettings Team
  if (index < 2) {
    return "Sales Team";
  }
  return "Lettings Team";
};

// Mock position/title based on agent
const getAgentPosition = (agentId: string, firstName: string): string => {
  const positions = [
    "Senior Sales & Lettings Manager",
    "Lettings Specialist",
    "Sales Manager",
    "Property Consultant",
    "Senior Property Advisor"
  ];
  const index = parseInt(agentId.slice(-1)) || 0;
  return positions[index % positions.length];
};

// Mock phone number
const getAgentPhone = (agentId: string): string => {
  const phones = [
    "023 8099 1111",
    "023 8099 1122",
    "023 8099 1133",
    "023 8099 1144",
    "023 8099 1155"
  ];
  const index = parseInt(agentId.slice(-1)) || 0;
  return phones[index % phones.length];
};

// Mock online status (FE only, randomly generated per agent)
const getAgentOnlineStatus = (agentId: string): boolean => {
  // Use agent ID to generate consistent online status
  const hash = agentId.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
  return Math.abs(hash) % 3 !== 0; // 2/3 chance of being online
};
=======
// Note: Team, position, phone, and online status now come from the API
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4

export default function Agents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [onMyTeamFilter, setOnMyTeamFilter] = useState(false);
<<<<<<< HEAD
  const { data: agents, isLoading } = useUsers("agent"); // Filter for agents only

  // Get current user's team (mock - in real app would come from auth)
  // Set to "Sales Team" for testing - change this to "Lettings Team" to test the other team
  const currentUserTeam = "Sales Team"; // This would come from the logged-in user's data

  // Filter agents based on search and team filter
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    
    let filtered = agents;
    
    // Apply team filter
    if (onMyTeamFilter) {
      filtered = filtered.filter((agent) => getAgentTeam(agent) === currentUserTeam);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((agent) => {
        const fullName = `${agent.first_name || ""} ${agent.last_name || ""}`.toLowerCase();
        const email = (agent.email || "").toLowerCase();
        const position = getAgentPosition(agent.id, agent.first_name || "").toLowerCase();
        return fullName.includes(query) || email.includes(query) || position.includes(query);
      });
    }
    
    return filtered;
  }, [agents, searchQuery, onMyTeamFilter, currentUserTeam]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!agents) return { total: 0, active: 0, inactive: 0, online: 0, offline: 0 };
    const onlineCount = agents.filter((a) => getAgentOnlineStatus(a.id)).length;
=======
  
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
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
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

<<<<<<< HEAD
  // Calculate stats for an agent (mock data for now)
  const getAgentStats = (agentId: string) => {
    // In a real app, these would come from the API
    return {
      askingPrice: `${Math.floor(Math.random() * 20) + 85}%`,
      daysOnMarket: `${Math.floor(Math.random() * 30) + 30}`,
      monthlyFees: `£${(Math.random() * 30 + 20).toFixed(1)}k`,
      satisfaction: (Math.random() * 1.5 + 3.5).toFixed(1),
=======
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
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
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
<<<<<<< HEAD
              const stats = getAgentStats(agent.id);
=======
              const stats = getAgentStats(agent);
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
              const fullName = `${agent.first_name || ""} ${agent.last_name || ""}`.trim() || "Unknown";
              const initials = fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
<<<<<<< HEAD
              const agentId = getAgentId(agent.id);
              const isOnline = getAgentOnlineStatus(agent.id);
              const photoUrl = getAgentPhotoUrl(agent.first_name || "", agent.last_name || "");
              const phone = getAgentPhone(agent.id);
              const position = getAgentPosition(agent.id, agent.first_name || "");
              const team = getAgentTeam(agent);
=======
              const agentId = formatAgentId(agent.id);
              const isOnline = agent.online_status;
              const photoUrl = getAgentPhotoUrl(agent.first_name || "", agent.last_name || "");
              const phone = agent.phone || "N/A";
              const position = agent.position || "Agent";
              const team = agent.team || "N/A";
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4

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
<<<<<<< HEAD
                          <Badge variant="outline" className="text-xs font-mono">{agentId}</Badge>
=======
                          <Badge 
                            variant="outline" 
                            className="text-xs font-mono"
                            title={`Full ID: ${agent.id}`}
                          >
                            {agentId}
                          </Badge>
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
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
<<<<<<< HEAD
              const agentId = getAgentId(selectedAgentData.id);
              const isOnline = getAgentOnlineStatus(selectedAgentData.id);
              const photoUrl = getAgentPhotoUrl(selectedAgentData.first_name || "", selectedAgentData.last_name || "");
              const phone = getAgentPhone(selectedAgentData.id);
              const position = getAgentPosition(selectedAgentData.id, selectedAgentData.first_name || "");
              const team = getAgentTeam(selectedAgentData);
              const role = selectedAgentData.role ? selectedAgentData.role.charAt(0).toUpperCase() + selectedAgentData.role.slice(1) : "Agent";
              const qualifications = `ARLA Level 3 • ${Math.floor(Math.random() * 10) + 3} years experience`;
              const stats = getAgentStats(selectedAgentData.id);
=======
              const agentId = formatAgentId(selectedAgentData.id);
              const isOnline = selectedAgentData.online_status;
              const photoUrl = getAgentPhotoUrl(selectedAgentData.first_name || "", selectedAgentData.last_name || "");
              const phone = selectedAgentData.phone || "N/A";
              const position = selectedAgentData.position || "Agent";
              const team = selectedAgentData.team || "N/A";
              const role = selectedAgentData.role ? selectedAgentData.role.charAt(0).toUpperCase() + selectedAgentData.role.slice(1) : "Agent";
              const qualifications = `ARLA Level 3 • ${Math.floor(Math.random() * 10) + 3} years experience`;
              const stats = getAgentStats(selectedAgentData);
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
              
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
<<<<<<< HEAD
                          <Badge variant="outline" className="text-xs font-mono">{agentId}</Badge>
=======
                          <Badge 
                            variant="outline" 
                            className="text-xs font-mono"
                            title={`Full ID: ${selectedAgentData.id}`}
                          >
                            {agentId}
                          </Badge>
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
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

                  <Tabs defaultValue="properties" className="mt-4">
                    <TabsList className="grid w-full grid-cols-5">
                      {["properties", "applicants", "vendors", "landlords", "kpis"].map((t) => (
                        <TabsTrigger key={t} value={t} className="text-xs sm:text-sm">
                          {t === "kpis" ? "KPIs" : t.charAt(0).toUpperCase() + t.slice(1)}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="properties" className="mt-4 space-y-3">
                      {[
                        { addr: "Court Road, SO15", price: "£195,000", status: "Offer Accepted", badge: "default" },
                        { addr: "High Street, SO14", price: "£1,200 pcm", status: "Viewing Tomorrow", badge: "secondary" },
                        { addr: "Portswood Rd", price: "£340,000", status: "New Instruction", badge: "outline" },
                        { addr: "The Avenue", price: "£850 pcm", status: "Tenancy Started", badge: "default" },
                      ].map((p, i) => (
                        <Card key={i} className="hover:shadow-sm transition-shadow">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <Home className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{p.addr}</p>
                                <p className="text-sm font-semibold text-primary">{p.price}</p>
                              </div>
                            </div>
                            <Badge variant={p.badge as any}>{p.status}</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="applicants" className="mt-4 space-y-3">
                      {[
                        { name: "Emma Wilson", budget: "£1,200 pcm", move: "Dec 1", hot: true },
                        { name: "Tom & Lisa", budget: "£380,000", move: "ASAP", hot: true },
                        { name: "Dr Mike Lee", budget: "2-bed flat", move: "Jan", hot: false },
                        { name: "Sarah Khan", budget: "£900 pcm", move: "Nov 15", hot: true },
                      ].map((a, i) => (
                        <Card key={i} className="hover:shadow-sm transition-shadow">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <Users className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{a.name}</p>
                                <p className="text-xs text-muted-foreground">Budget: {a.budget}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {a.hot && <Badge className="mb-1">HOT LEAD</Badge>}
                              <p className="text-xs text-muted-foreground">Move: {a.move}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="vendors" className="mt-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                          "Mr A. Patel – 3 properties",
                          "Dr S. Chen – Court Road",
                          "Mrs J. Taylor – High St",
                        ].map((v, i) => (
                          <Card key={i} className="hover:shadow-sm transition-shadow">
                            <CardContent className="flex items-center gap-3 p-4">
                              <UserCheck className="h-5 w-5 text-muted-foreground" />
                              <span className="text-sm font-medium">{v}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="landlords" className="mt-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                          "Mr A. Patel – 3 properties",
                          "Dr S. Chen – Court Road",
                          "Mrs J. Taylor – High St",
                          "Southampton Uni – 2 flats",
                          "Mr R. Kumar – Portswood",
                          "Trustees of L. Brown",
                        ].map((l, i) => (
                          <Card key={i} className="hover:shadow-sm transition-shadow">
                            <CardContent className="flex items-center gap-3 p-4">
                              <UserCheck className="h-5 w-5 text-muted-foreground" />
                              <span className="text-sm font-medium">{l}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

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

