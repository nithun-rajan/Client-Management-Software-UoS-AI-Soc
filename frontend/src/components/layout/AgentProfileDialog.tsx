// src/components/AgentProfileDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
<<<<<<< HEAD
=======
import { useAuth } from "@/hooks/useAuth";
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
import {
  Home, UserCheck, Users, BarChart3,
  TrendingUp, Clock, PoundSterling, Star, Mail, Phone,
} from "lucide-react";

const AGENT_KEY = "john-smith-agent";

<<<<<<< HEAD
interface Agent {
  name: string;
  title: string;
  email: string;
=======
interface AgentProfile {
  title: string;
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
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

<<<<<<< HEAD
const defaultAgent: Agent = {
  name: "John Smith",
  title: "Senior Sales & Lettings Manager – Southampton",
  email: "john.smith@uos-crm.co.uk",
=======
const defaultProfile: AgentProfile = {
  title: "Senior Sales & Lettings Manager – Southampton",
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
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
  const [tab, setTab] = useState("properties");
<<<<<<< HEAD
  const [agent, setAgent] = useState<Agent>(defaultAgent);
=======
  const { user } = useAuth();
  const [profile, setProfile] = useState<AgentProfile>(defaultProfile);
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem(AGENT_KEY);
<<<<<<< HEAD
      if (saved) setAgent(JSON.parse(saved));
=======
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
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    };
    load();
    window.addEventListener("agent-saved", load);
    return () => window.removeEventListener("agent-saved", load);
  }, [open]);

<<<<<<< HEAD
=======
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

>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
<<<<<<< HEAD
                <AvatarImage src={agent.avatarUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {agent.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-xl">{agent.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{agent.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{agent.qualifications}</p>
              </div>
            </div>
            <div className="text-right space-y-2">
              <p className="text-sm font-medium">Contact {agent.name.split(" ")[0]}</p>
              <div className="flex flex-col gap-2 text-sm">
                <a href={`mailto:${agent.email}`} className="flex items-center justify-end gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-4 w-4" /> {agent.email}
                </a>
                <span className="flex items-center justify-end gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /> {agent.phone}
=======
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
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
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            {["properties", "landlords", "applicants", "kpis"].map(t => (
              <TabsTrigger key={t} value={t} className="text-xs sm:text-sm">
                {t === "kpis" ? "KPIs" : t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* PROPERTIES */}
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

          {/* LANDLORDS */}
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

          {/* APPLICANTS */}
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

          {/* KPIs */}
          <TabsContent value="kpis" className="mt-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
<<<<<<< HEAD
                  <p className="text-2xl font-bold">{agent.kpis.askingPrice}</p>
=======
                  <p className="text-2xl font-bold">{profile.kpis.askingPrice}</p>
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
                  <p className="text-xs text-muted-foreground">Asking Price</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
<<<<<<< HEAD
                  <p className="text-2xl font-bold">{agent.kpis.daysOnMarket}</p>
=======
                  <p className="text-2xl font-bold">{profile.kpis.daysOnMarket}</p>
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
                  <p className="text-xs text-muted-foreground">Days on Market</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <PoundSterling className="h-6 w-6 mx-auto mb-2 text-primary" />
<<<<<<< HEAD
                  <p className="text-2xl font-bold">{agent.kpis.monthlyFees}</p>
=======
                  <p className="text-2xl font-bold">{profile.kpis.monthlyFees}</p>
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
                  <p className="text-xs text-muted-foreground">Monthly Fees</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
<<<<<<< HEAD
                  <p className="text-2xl font-bold">{agent.kpis.satisfaction}</p>
=======
                  <p className="text-2xl font-bold">{profile.kpis.satisfaction}</p>
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
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
