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
      <div className="space-y-6 p-6 max-w-4xl mx-auto">

        {/* LIVE AGENT EDITOR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Agent Profile
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* AVATAR + DELETE */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={agent.avatarUrl} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                    {agent.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  <Camera className="h-5 w-5 text-white" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {agent.avatarUrl && (
                  <button
                    onClick={() => setAgent(prev => ({ ...prev, avatarUrl: "" }))}
                    className="absolute -top-1 -right-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1.5 shadow-sm"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* FORM GRID */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={agent.name} onChange={e => setAgent(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={agent.title} onChange={e => setAgent(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </Label>
                <Input type="email" value={agent.email} onChange={e => setAgent(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Phone
                </Label>
                <Input value={agent.phone} onChange={e => setAgent(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Office
                </Label>
                <Input value={agent.office} onChange={e => setAgent(prev => ({ ...prev, office: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Award className="h-4 w-4" /> Qualifications
                </Label>
                <Input value={agent.qualifications} onChange={e => setAgent(prev => ({ ...prev, qualifications: e.target.value }))} />
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={saveAgent}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saved ? "Saved!" : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* BACKEND API */}
        <Card>
          <CardHeader>
            <CardTitle>Backend API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Base URL</Label>
              <Input defaultValue="http://localhost:8000" placeholder="https://api.uos-crm.co.uk" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Connected</span>
            </div>
            <Button className="w-full" variant="outline">Test Connection</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}