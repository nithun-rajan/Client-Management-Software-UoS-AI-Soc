// src/components/AgentProfileDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home, UserCheck, Users, BarChart3, FileText,
  TrendingUp, Clock, PoundSterling, Star, Mail, Phone,
} from "lucide-react";

const AGENT_KEY = "john-smith-agent";

interface Agent {
  name: string;
  title: string;
  email: string;
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

const defaultAgent: Agent = {
  name: "John Smith",
  title: "Senior Sales & Lettings Manager – Southampton",
  email: "john.smith@uos-crm.co.uk",
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
  const [agent, setAgent] = useState<Agent>(defaultAgent);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem(AGENT_KEY);
      if (saved) setAgent(JSON.parse(saved));
    };
    load();
    window.addEventListener("agent-saved", load);
    return () => window.removeEventListener("agent-saved", load);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-screen overflow-y-auto font-sans sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-6 text-2xl">
            <Avatar className="h-24 w-24 ring-4 ring-indigo-200">
              <AvatarImage src={agent.avatarUrl} />
              <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
                {agent.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-3xl font-bold">{agent.name}</div>
              <div className="text-lg font-medium text-indigo-600">{agent.title}</div>
              <div className="mt-1 text-sm text-gray-500">{agent.qualifications}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-5 rounded-xl bg-gray-100 p-1">
            {["properties", "landlords", "applicants", "kpis", "valuation"].map(t => (
              <TabsTrigger key={t} value={t} className="rounded-lg capitalize">
                {t === "kpis" ? "KPIs" : t}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* PROPERTIES */}
          <TabsContent value="properties" className="mt-6">
            <div className="space-y-4">
              {[
                { addr: "Court Road, SO15", price: "£195,000", status: "Offer Accepted", badge: "success" },
                { addr: "High Street, SO14", price: "£1,200 pcm", status: "Viewing Tomorrow", badge: "warning" },
                { addr: "Portswood Rd", price: "£340,000", status: "New Instruction", badge: "info" },
                { addr: "The Avenue", price: "£850 pcm", status: "Tenancy Started", badge: "success" },
              ].map((p) => (
                <div key={p.addr} className="flex items-center justify-between rounded-xl bg-gray-50 p-5 hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <Home className="h-6 w-6 text-indigo-600" />
                    <div>
                      <p className="text-lg font-semibold">{p.addr}</p>
                      <p className="text-2xl font-bold text-indigo-700">{p.price}</p>
                    </div>
                  </div>
                  <Badge variant={p.badge === "success" ? "default" : p.badge === "warning" ? "secondary" : "outline"}>
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* LANDLORDS */}
          <TabsContent value="landlords" className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                "Mr A. Patel – 3 properties",
                "Dr S. Chen – Court Road",
                "Mrs J. Taylor – High St",
                "Southampton Uni – 2 flats",
                "Mr R. Kumar – Portswood",
                "Trustees of L. Brown",
              ].map((l) => (
                <div key={l} className="flex items-center gap-4 rounded-xl bg-blue-50 p-5">
                  <UserCheck className="h-8 w-8 text-blue-600" />
                  <span className="text-lg font-medium">{l}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* APPLICANTS */}
          <TabsContent value="applicants" className="mt-6">
            <div className="space-y-4">
              {[
                { name: "Emma Wilson", budget: "£1,200 pcm", move: "Dec 1", hot: true },
                { name: "Tom & Lisa", budget: "£380,000", move: "ASAP", hot: true },
                { name: "Dr Mike Lee", budget: "2-bed flat", move: "Jan", hot: false },
                { name: "Sarah Khan", budget: "£900 pcm", move: "Nov 15", hot: true },
              ].map((a) => (
                <div key={a.name} className="flex items-center justify-between rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-center gap-4">
                    <Users className="h-6 w-6 text-amber-600" />
                    <div>
                      <p className="text-lg font-semibold">{a.name}</p>
                      <p className="text-sm text-gray-700">Budget: {a.budget}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {a.hot && <Badge className="mb-2">HOT LEAD</Badge>}
                    <p className="text-sm font-medium">Move: {a.move}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* KPIs – LIVE FROM SETTINGS */}
          <TabsContent value="kpis" className="mt-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { icon: TrendingUp, label: "Asking Price Achieved", value: agent.kpis.askingPrice, color: "green" },
                { icon: Clock, label: "Avg Days on Market", value: agent.kpis.daysOnMarket, color: "blue" },
                { icon: PoundSterling, label: "Fees This Month", value: agent.kpis.monthlyFees, color: "purple" },
                { icon: Star, label: "Satisfaction", value: agent.kpis.satisfaction, color: "amber" },
              ].map((kpi, i) => (
                <div key={i} className={`rounded-2xl bg-gradient-to-br from-${kpi.color}-50 to-${kpi.color}-100 p-6 text-center`}>
                  <kpi.icon className={`mx-auto mb-2 h-10 w-10 text-${kpi.color}-600`} />
                  <p className={`text-3xl font-bold text-${kpi.color}-700`}>{kpi.value}</p>
                  <p className="text-sm text-gray-600">{kpi.label}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* VALUATION PACK – PAGE 5 */}
          <TabsContent value="valuation" className="mt-6">
            <div className="rounded-2xl border-2 border-indigo-200 bg-white p-8 shadow-lg">
              <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold">
                <FileText className="h-8 w-8 text-indigo-600" />
                AI Valuation Pack – Court Road, SO15
              </h3>
              <div className="grid grid-cols-2 gap-6 text-lg">
                <div>
                  <p className="text-gray-600">Guide Price</p>
                  <p className="text-3xl font-bold text-indigo-700">£195,000</p>
                </div>
                <div>
                  <p className="text-gray-600">Comparable Sale</p>
                  <p className="text-2xl font-bold text-green-600">£185,000</p>
                  <p className="text-sm text-gray-500">Apr 2025</p>
                </div>
              </div>
              <div className="mt-6 rounded-xl bg-indigo-50 p-4">
                <p className="font-medium">AI Confidence</p>
                <p className="text-5xl font-black text-indigo-700">96%</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* CONTACT BAR */}
        <div className="-m-6 mt-10 rounded-b-2xl border-t-2 border-indigo-200 bg-gradient-to-t from-indigo-50 to-white px-6 pb-6 pt-8 shadow-inner">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="space-y-2 text-center sm:text-left">
              <p className="font-semibold text-gray-800">Contact {agent.name.split(" ")[0]} directly</p>
              <div className="flex flex-col items-center gap-6 text-sm sm:flex-row">
                <a href={`mailto:${agent.email}`} className="flex items-center gap-2 hover:text-indigo-600 transition">
                  <Mail className="h-4 w-4" /> {agent.email}
                </a>
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> {agent.phone}
                </span>
              </div>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-indigo-600 to-blue-700 px-10 py-6 text-lg font-semibold text-white shadow-xl hover:from-indigo-700 hover:to-blue-800"
            >
              Close Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}