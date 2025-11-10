import { useState, useMemo } from "react";
import { Search, Users, Mail, Phone, TrendingUp, Clock, PoundSterling, Star, Home, UserCheck } from "lucide-react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";

export default function Agents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const { data: agents, isLoading } = useUsers("agent"); // Filter for agents only

  // Filter agents based on search
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    if (!searchQuery) return agents;
    
    const query = searchQuery.toLowerCase();
    return agents.filter((agent) => {
      const fullName = `${agent.first_name || ""} ${agent.last_name || ""}`.toLowerCase();
      const email = (agent.email || "").toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [agents, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!agents) return { total: 0, active: 0, inactive: 0 };
    return {
      total: agents.length,
      active: agents.filter((a) => a.is_active).length,
      inactive: agents.filter((a) => !a.is_active).length,
    };
  }, [agents]);

  // Get selected agent data
  const selectedAgentData = useMemo(() => {
    if (!selectedAgent || !agents) return null;
    return agents.find((a) => a.id === selectedAgent);
  }, [selectedAgent, agents]);

  // Calculate stats for an agent (mock data for now)
  const getAgentStats = (agentId: string) => {
    // In a real app, these would come from the API
    return {
      askingPrice: `${Math.floor(Math.random() * 20) + 85}%`,
      daysOnMarket: `${Math.floor(Math.random() * 30) + 30}`,
      monthlyFees: `£${(Math.random() * 30 + 20).toFixed(1)}k`,
      satisfaction: (Math.random() * 1.5 + 3.5).toFixed(1),
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
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
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
                    <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
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
              const stats = getAgentStats(agent.id);
              const fullName = `${agent.first_name || ""} ${agent.last_name || ""}`.trim() || "Unknown";
              const initials = fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

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
                      <Avatar className="h-16 w-16">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate">{fullName}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate">
                          {agent.role ? agent.role.charAt(0).toUpperCase() + agent.role.slice(1) : "Agent"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {agent.is_active ? (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      {agent.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{agent.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Asking Price</p>
                        <p className="text-sm font-semibold">{stats.askingPrice}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Satisfaction</p>
                        <p className="text-sm font-semibold">{stats.satisfaction}/5</p>
                      </div>
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
            {selectedAgentData && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                        {`${selectedAgentData.first_name || ""} ${selectedAgentData.last_name || ""}`
                          .trim()
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <DialogTitle className="text-xl">
                        {`${selectedAgentData.first_name || ""} ${selectedAgentData.last_name || ""}`.trim() || "Unknown"}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgentData.role
                          ? selectedAgentData.role.charAt(0).toUpperCase() + selectedAgentData.role.slice(1)
                          : "Agent"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ARLA Level 3 • {Math.floor(Math.random() * 10) + 3} years experience
                      </p>
                    </div>
                  </div>
                </DialogHeader>
                <Tabs defaultValue="overview" className="mt-4">
                  <TabsList className="grid w-full grid-cols-4">
                    {["overview", "properties", "clients", "kpis"].map((t) => (
                      <TabsTrigger key={t} value={t} className="text-xs sm:text-sm">
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="overview" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedAgentData.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={selectedAgentData.is_active ? "default" : "secondary"}>
                          {selectedAgentData.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>

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

                  <TabsContent value="clients" className="mt-4">
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
                      {(() => {
                        const stats = getAgentStats(selectedAgentData.id);
                        return [
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
                        ));
                      })()}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Contact Bar */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Contact {selectedAgentData.first_name || "Agent"}
                      </p>
                      <div className="flex flex-col gap-2 text-sm sm:flex-row">
                        {selectedAgentData.email && (
                          <a
                            href={`mailto:${selectedAgentData.email}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Mail className="h-4 w-4" /> {selectedAgentData.email}
                          </a>
                        )}
                      </div>
                    </div>
                    <Button onClick={() => setSelectedAgent(null)} variant="outline">
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

