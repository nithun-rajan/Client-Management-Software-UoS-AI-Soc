// src/components/AgentProfileDialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  UserCheck,
  Users,
  BarChart3,
  FileText,
  TrendingUp,
  Clock,
  PoundSterling,
  Star,
  Mail,
  Phone,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AgentProfileDialog({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState("properties");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-screen overflow-y-auto font-sans sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-6 text-2xl">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 text-4xl font-bold text-white shadow-2xl">
              JS
            </div>
            <div>
              <div className="text-3xl font-bold">John Smith</div>
              <div className="text-lg font-medium text-indigo-600">
                Senior Sales & Lettings Manager – Southampton
              </div>
              <div className="mt-1 text-sm text-gray-500">
                7 years experience • ARLA Level 3 • 96% client satisfaction
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-5 rounded-xl bg-gray-100 p-1">
            <TabsTrigger value="properties" className="rounded-lg">
              Properties
            </TabsTrigger>
            <TabsTrigger value="landlords" className="rounded-lg">
              Landlords
            </TabsTrigger>
            <TabsTrigger value="applicants" className="rounded-lg">
              Applicants
            </TabsTrigger>
            <TabsTrigger value="kpis" className="rounded-lg">
              KPIs
            </TabsTrigger>
            <TabsTrigger value="valuation" className="rounded-lg">
              Valuation Pack
            </TabsTrigger>
          </TabsList>

          {/* PROPERTIES */}
          <TabsContent value="properties" className="mt-6">
            <div className="space-y-4">
              {[
                {
                  addr: "Court Road, SO15",
                  price: "£195,000",
                  status: "Offer Accepted",
                  badge: "success",
                },
                {
                  addr: "High Street, SO14",
                  price: "£1,200 pcm",
                  status: "Viewing Tomorrow",
                  badge: "warning",
                },
                {
                  addr: "Portswood Rd",
                  price: "£340,000",
                  status: "New Instruction",
                  badge: "info",
                },
                {
                  addr: "The Avenue",
                  price: "£850 pcm",
                  status: "Tenancy Started",
                  badge: "success",
                },
              ].map((p) => (
                <div
                  key={p.addr}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-5 transition hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <Home className="h-6 w-6 text-indigo-600" />
                    <div>
                      <p className="text-lg font-semibold">{p.addr}</p>
                      <p className="text-2xl font-bold text-indigo-700">{p.price}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      p.badge === "success"
                        ? "default"
                        : p.badge === "warning"
                          ? "secondary"
                          : "outline"
                    }
                  >
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
                <div
                  key={l}
                  className="flex items-center gap-4 rounded-xl bg-blue-50 p-5"
                >
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
                <div
                  key={a.name}
                  className="flex items-center justify-between rounded-xl border-2 border-amber-200 bg-amber-50 p-5"
                >
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

          {/* KPIs – FROM PAGE 3 */}
          <TabsContent value="kpis" className="mt-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-center">
                <TrendingUp className="mx-auto mb-2 h-10 w-10 text-green-600" />
                <p className="text-3xl font-bold text-green-700">96%</p>
                <p className="text-sm text-gray-600">Asking Price Achieved</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center">
                <Clock className="mx-auto mb-2 h-10 w-10 text-blue-600" />
                <p className="text-3xl font-bold text-blue-700">46</p>
                <p className="text-sm text-gray-600">Avg Days on Market</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 text-center">
                <PoundSterling className="mx-auto mb-2 h-10 w-10 text-purple-600" />
                <p className="text-3xl font-bold text-purple-700">£47.2k</p>
                <p className="text-sm text-gray-600">Fees This Month</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center">
                <Star className="mx-auto mb-2 h-10 w-10 text-amber-600" />
                <p className="text-3xl font-bold text-amber-700">4.1</p>
                <p className="text-sm text-gray-600">Customer Satisfaction</p>
              </div>
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
              <p className="font-semibold text-gray-800">Contact John directly</p>
              <div className="flex flex-col items-center gap-6 text-sm sm:flex-row">
                <a
                  href="mailto:john.smith@uos-crm.co.uk"
                  className="flex items-center gap-2 transition hover:text-indigo-600"
                >
                  john.smith@uos-crm.co.uk
                </a>
                <span className="flex items-center gap-2">023 8099 1111</span>
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
