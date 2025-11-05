// src/pages/Settings.tsx
import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Mail, Phone, Building2, Award, Camera } from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from "@/components/layout/Header";

// GLOBAL AGENT STORE (shared with Sidebar & Dialog)
interface Agent {
  name: string;
  title: string;
  email: string;
  phone: string;
  office: string;
  qualifications: string;
  avatarUrl: string;
  kpis: {
    askingPrice: string;
    daysOnMarket: string;
    monthlyFees: string;
    satisfaction: string;
  };
}

const AGENT_KEY = "john-smith-agent";

const defaultAgent: Agent = {
  name: "John Smith",
  title: "Senior Sales & Lettings Manager – Southampton",
  email: "john.smith@uos-crm.co.uk",
  phone: "023 8099 1111",
  office: "Court Road, Southampton SO15 2JS",
  qualifications: "ARLA Level 3 • 7 years experience",
  avatarUrl: "",
  kpis: {
    askingPrice: "96%",
    daysOnMarket: "46",
    monthlyFees: "£47,200",
    satisfaction: "4.1/5",
  },
};

export default function Settings() {
  const [agent, setAgent] = useState<Agent>(defaultAgent);
  const [saved, setSaved] = useState(false);

  // LOAD FROM LOCALSTORAGE ON MOUNT
  useEffect(() => {
    const saved = localStorage.getItem(AGENT_KEY);
    if (saved) setAgent(JSON.parse(saved));
  }, []);

  // AUTO-SAVE TO LOCALSTORAGE
  const saveAgent = () => {
    localStorage.setItem(AGENT_KEY, JSON.stringify(agent));
    window.dispatchEvent(new Event("agent-saved"));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAgent(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <Header title="Settings" />
      <div className="space-y-8 p-6 max-w-5xl mx-auto">

        {/* LIVE AGENT EDITOR */}
        <Card className="shadow-2xl border-2 border-indigo-100">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
            <CardTitle className="text-2xl flex items-center gap-3">
              <SettingsIcon className="h-7 w-7" />
              Agent Profile
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-10 space-y-10">

            {/* AVATAR + DELETE */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                <Avatar className="h-36 w-36 border-8 border-white shadow-2xl ring-4 ring-indigo-200">
                  <AvatarImage src={agent.avatarUrl} />
                  <AvatarFallback className="text-5xl font-bold bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
                    {agent.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  <Camera className="h-10 w-10 text-white" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {agent.avatarUrl && (
                  <button
                    onClick={() => setAgent(prev => ({ ...prev, avatarUrl: "" }))}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-xl"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* FORM GRID */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Name</Label>
                <Input value={agent.name} onChange={e => setAgent(prev => ({ ...prev, name: e.target.value }))} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Title</Label>
                <Input value={agent.title} onChange={e => setAgent(prev => ({ ...prev, title: e.target.value }))} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="h-5 w-5" /> Email</Label>
                <Input type="email" value={agent.email} onChange={e => setAgent(prev => ({ ...prev, email: e.target.value }))} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-5 w-5" /> Phone</Label>
                <Input value={agent.phone} onChange={e => setAgent(prev => ({ ...prev, phone: e.target.value }))} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Office</Label>
                <Input value={agent.office} onChange={e => setAgent(prev => ({ ...prev, office: e.target.value }))} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Award className="h-5 w-5" /> Qualifications</Label>
                <Input value={agent.qualifications} onChange={e => setAgent(prev => ({ ...prev, qualifications: e.target.value }))} className="h-12" />
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="flex justify-center pt-8 border-t">
              <Button
                onClick={saveAgent}
                size="lg"
                className="px-16 py-8 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 shadow-2xl"
              >
                <Save className="h-8 w-8 mr-4" />
                {saved ? "SAVED SUCCESSFULY!" : "SAVE CHANGES"}
              </Button>
            </div>
            </CardContent>
        </Card>
        {/* BACKEND API – BACK BY POPULAR DEMAND */}
        <Card className="shadow-lg border-2 border-cyan-100">
          <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
            <CardTitle className="text-xl">Backend API</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>API Base URL</Label>
              <Input defaultValue="http://localhost:8000" placeholder="https://api.uos-crm.co.uk" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm font-medium text-green-600">Connected</span>
    </div>
    <Button className="w-full" variant="outline">Test Connection</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}