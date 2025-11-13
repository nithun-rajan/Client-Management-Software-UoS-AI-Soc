// src/components/AgentProfileDialog.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMyManagedEntities } from "@/hooks/useAgents";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home, UserCheck, Users, BarChart3,
  TrendingUp, Clock, PoundSterling, Star, Mail, Phone,
} from "lucide-react";

const AGENT_KEY = "john-smith-agent";

interface AgentProfile {
  title: string;
  phone: string;
  qualifications: string;
  avatarUrl: string;
  kpis: {
    askingPrice: string;
    daysOnMarket: string;
    monthlyFees: string;
    satisfaction: string;
  };
}

const defaultProfile: AgentProfile = {
  title: "Senior Sales & Lettings Manager – Southampton",
  phone: "023 8099 1111",
  qualifications: "ARLA Level 3 • 7 years experience",
  avatarUrl: "",
  kpis: {
    askingPrice: "96%",
    daysOnMarket: "46",
    monthlyFees: "£47.2k",
    satisfaction: "4.1",
  },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AgentProfileDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { data: managedEntities, isLoading: managedLoading } = useMyManagedEntities();
  const [profile, setProfile] = useState<AgentProfile>(defaultProfile);
  
  // Determine default tab (first available tab or KPIs)
  const getDefaultTab = useMemo(() => {
    if (managedEntities?.properties && managedEntities.properties.length > 0) return "properties";
    if (managedEntities?.vendors && managedEntities.vendors.length > 0) return "vendors";
    if (managedEntities?.buyers && managedEntities.buyers.length > 0) return "buyers";
    if (managedEntities?.landlords && managedEntities.landlords.length > 0) return "landlords";
    if (managedEntities?.applicants && managedEntities.applicants.length > 0) return "applicants";
    return "kpis";
  }, [managedEntities]);
  
  const [tab, setTab] = useState(getDefaultTab);
  
  // Update tab when managedEntities changes
  useEffect(() => {
    if (managedEntities) {
      setTab(getDefaultTab);
    }
  }, [managedEntities, getDefaultTab]);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem(AGENT_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setProfile({
          title: data.title || defaultProfile.title,
          phone: data.phone || defaultProfile.phone,
          qualifications: data.qualifications || defaultProfile.qualifications,
          avatarUrl: data.avatarUrl || defaultProfile.avatarUrl,
          kpis: data.kpis || defaultProfile.kpis,
        });
      }
    };
    load();
    window.addEventListener("agent-saved", load);
    return () => window.removeEventListener("agent-saved", load);
  }, [open]);

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  // Get user initials
  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Get first name for contact section
  const getFirstName = () => {
    if (user?.first_name) {
      return user.first_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-lg font-semibold text-white">
                {getUserInitials()}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">{getUserDisplayName()}</DialogTitle>
                <p className="text-sm text-muted-foreground">{profile.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{profile.qualifications}</p>
              </div>
            </div>
            <div className="text-right space-y-2">
              <p className="text-sm font-medium">Contact {getFirstName()}</p>
              <div className="flex flex-col gap-2 text-sm">
                <a href={`mailto:${user.email}`} className="flex items-center justify-end gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-4 w-4" /> {user.email}
                </a>
                <span className="flex items-center justify-end gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /> {profile.phone}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
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
                tabs.push({ value: "applicants", label: "Tenants" });
              }
              tabs.push({ value: "kpis", label: "KPIs" }); // Always show KPIs
              return tabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs sm:text-sm">
                  {t.label}
                </TabsTrigger>
              ));
            })()}
          </TabsList>

          {/* PROPERTIES */}
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
                  <Link key={prop.id} to={`/properties/${prop.id}`} className="block">
                    <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Home className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium hover:text-primary transition-colors">{prop.name}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>
          )}

          {/* VENDORS */}
          {managedEntities?.vendors && managedEntities.vendors.length > 0 && (
            <TabsContent value="vendors" className="mt-4 space-y-3">
              {managedLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                managedEntities.vendors.map((vendor) => (
                  <Link key={vendor.id} to={`/vendors/${vendor.id}`} className="block">
                    <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <UserCheck className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium hover:text-primary transition-colors">{vendor.name}</p>
                            {vendor.property_count > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {vendor.property_count} {vendor.property_count === 1 ? "property" : "properties"}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>
          )}

          {/* BUYERS */}
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
                  <Link key={buyer.id} to={`/applicants/${buyer.id}`} className="block">
                    <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium hover:text-primary transition-colors">{buyer.name}</p>
                            <p className="text-xs text-muted-foreground">Buyer</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>
          )}

          {/* LANDLORDS */}
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
                    <Link key={landlord.id} to={`/landlords/${landlord.id}`} className="block">
                      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                        <CardContent className="flex items-center gap-3 p-4">
                          <UserCheck className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <span className="text-sm font-medium hover:text-primary transition-colors">{landlord.name}</span>
                            {landlord.property_count > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {landlord.property_count} {landlord.property_count === 1 ? "property" : "properties"}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* TENANTS */}
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
                  <Link key={applicant.id} to={`/applicants/${applicant.id}`} className="block">
                    <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium hover:text-primary transition-colors">{applicant.name}</p>
                            <p className="text-xs text-muted-foreground">Tenant</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>
          )}

          {/* KPIs */}
          <TabsContent value="kpis" className="mt-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{profile.kpis.askingPrice}</p>
                  <p className="text-xs text-muted-foreground">Asking Price</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{profile.kpis.daysOnMarket}</p>
                  <p className="text-xs text-muted-foreground">Days on Market</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <PoundSterling className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{profile.kpis.monthlyFees}</p>
                  <p className="text-xs text-muted-foreground">Monthly Fees</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{profile.kpis.satisfaction}</p>
                  <p className="text-xs text-muted-foreground">Satisfaction</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
