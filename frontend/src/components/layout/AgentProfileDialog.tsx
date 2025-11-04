// src/components/AgentProfileDialog.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Home, UserCheck, Users, BarChart3, FileText, 
  TrendingUp, Clock, PoundSterling, Star, Mail, Phone 
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AgentProfileDialog({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState("properties");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-screen overflow-y-auto font-sans">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-6 text-2xl">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold text-4xl shadow-2xl">
              JS
            </div>
            <div>
              <div className="font-bold text-3xl">John Smith</div>
              <div className="text-lg text-indigo-600 font-medium">
                Senior Sales & Lettings Manager – Southampton
              </div>
              <div className="text-sm text-gray-500 mt-1">
                7 years experience • ARLA Level 3 • 96% client satisfaction
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="properties" className="rounded-lg">Properties</TabsTrigger>
            <TabsTrigger value="landlords" className="rounded-lg">Landlords</TabsTrigger>
            <TabsTrigger value="applicants" className="rounded-lg">Applicants</TabsTrigger>
            <TabsTrigger value="kpis" className="rounded-lg">KPIs</TabsTrigger>
            <TabsTrigger value="valuation" className="rounded-lg">Valuation Pack</TabsTrigger>
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
                <div key={p.addr} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <Home className="h-6 w-6 text-indigo-600" />
                    <div>
                      <p className="font-semibold text-lg">{p.addr}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Mr A. Patel – 3 properties", "Dr S. Chen – Court Road", 
                "Mrs J. Taylor – High St", "Southampton Uni – 2 flats",
                "Mr R. Kumar – Portswood", "Trustees of L. Brown"
              ].map((l) => (
                <div key={l} className="flex items-center gap-4 p-5 bg-blue-50 rounded-xl">
                  <UserCheck className="h-8 w-8 text-blue-600" />
                  <span className="font-medium text-lg">{l}</span>
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
                <div key={a.name} className="flex items-center justify-between p-5 bg-amber-50 rounded-xl border-2 border-amber-200">
                  <div className="flex items-center gap-4">
                    <Users className="h-6 w-6 text-amber-600" />
                    <div>
                      <p className="font-semibold text-lg">{a.name}</p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                <TrendingUp className="h-10 w-10 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-700">96%</p>
                <p className="text-sm text-gray-600">Asking Price Achieved</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                <Clock className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-700">46</p>
                <p className="text-sm text-gray-600">Avg Days on Market</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                <PoundSterling className="h-10 w-10 text-purple-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-700">£47.2k</p>
                <p className="text-sm text-gray-600">Fees This Month</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl">
                <Star className="h-10 w-10 text-amber-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-amber-700">4.1</p>
                <p className="text-sm text-gray-600">Customer Satisfaction</p>
              </div>
            </div>
          </TabsContent>

          {/* VALUATION PACK – PAGE 5 */}
          <TabsContent value="valuation" className="mt-6">
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
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
              <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                <p className="font-medium">AI Confidence</p>
                <p className="text-5xl font-black text-indigo-700">96%</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* CONTACT BAR */}
        <div className="mt-10 pt-8 border-t-2 border-indigo-200 bg-gradient-to-t from-indigo-50 to-white -m-6 px-6 pb-6 rounded-b-2xl shadow-inner">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 max-w-4xl mx-auto">
            <div className="text-center sm:text-left space-y-2">
              <p className="font-semibold text-gray-800">Contact John directly</p>
              <div className="flex flex-col sm:flex-row items-center gap-6 text-sm">
                <a href="mailto:john.smith@uos-crm.co.uk" className="flex items-center gap-2 hover:text-indigo-600 transition">
                  john.smith@uos-crm.co.uk
                </a>
                <span className="flex items-center gap-2">
                  023 8099 1111
                </span>
              </div>
            </div>
            <Button 
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-semibold px-10 py-6 text-lg shadow-xl"
            >
              Close Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}