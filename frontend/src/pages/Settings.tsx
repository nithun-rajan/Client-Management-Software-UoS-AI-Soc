// src/pages/Settings.tsx
import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Mail, Phone, Building2, Award, Camera, Workflow, Shield, Lock, Palette } from "lucide-react";
import ThemeSelector from "@/components/shared/ThemeSelector";
import AccentColorSelector from "@/components/shared/AccentColorSelector";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import Header from "@/components/layout/Header";
import Pipeline from "./Pipeline";
import { getAuthRequired, setAuthRequired } from "@/lib/authSettings";
import { useAgentProfile, useUpdateAgentProfile, AgentProfile } from "@/hooks/useAgentProfile";
import { useAuth } from "@/hooks/useAuth";

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

const AGENT_KEY = "agent-profile"; // Keep for backward compatibility with localStorage

const defaultAgent: Agent = {
  name: "Tom Smith",
  title: "Senior Sales & Lettings Manager – Southampton",
  email: "",
  phone: "",
  office: "",
  qualifications: "",
  avatarUrl: "",
  kpis: {
    askingPrice: "96%",
    daysOnMarket: "46",
    monthlyFees: "£47,200",
    satisfaction: "4.1/5",
  },
};

export default function Settings() {
  const { user } = useAuth();
  const { data: backendProfile, isLoading: profileLoading } = useAgentProfile();
  const updateProfile = useUpdateAgentProfile();
  const [agent, setAgent] = useState<Agent>(defaultAgent);
  const [saved, setSaved] = useState(false);
  const [authRequired, setAuthRequiredState] = useState(getAuthRequired());
  const [securitySaved, setSecuritySaved] = useState(false);

  // LOAD FROM BACKEND OR LOCALSTORAGE ON MOUNT
  useEffect(() => {
    if (backendProfile) {
      // Merge backend profile with user data
      const mergedAgent: Agent = {
        name: backendProfile.name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Tom Smith",
        title: backendProfile.title || defaultAgent.title,
        email: backendProfile.email || user?.email || "",
        phone: backendProfile.phone || "",
        office: backendProfile.office || "",
        qualifications: backendProfile.qualifications || "",
        avatarUrl: backendProfile.avatarUrl || "",
        kpis: backendProfile.kpis || defaultAgent.kpis,
      };
      setAgent(mergedAgent);
      // Also save to localStorage for backward compatibility
      localStorage.setItem(AGENT_KEY, JSON.stringify(mergedAgent));
    } else {
      // Fallback to localStorage if backend doesn't have profile yet
      const saved = localStorage.getItem(AGENT_KEY);
      if (saved) {
        const localAgent = JSON.parse(saved);
        setAgent(localAgent);
      } else {
        // Use user data as default
        setAgent({
          ...defaultAgent,
          name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Tom Smith",
          email: user?.email || "",
        });
      }
    }
    setAuthRequiredState(getAuthRequired());
  }, [backendProfile, user]);

  // SAVE TO BACKEND AND LOCALSTORAGE
  const saveAgent = async () => {
    try {
      // Save to backend
      await updateProfile.mutateAsync({
        name: agent.name,
        title: agent.title,
        email: agent.email,
        phone: agent.phone,
        office: agent.office,
        qualifications: agent.qualifications,
        avatarUrl: agent.avatarUrl,
        kpis: agent.kpis,
      });
      
      // Also save to localStorage for backward compatibility
      localStorage.setItem(AGENT_KEY, JSON.stringify(agent));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save agent profile:", error);
      // Still save to localStorage as fallback
      localStorage.setItem(AGENT_KEY, JSON.stringify(agent));
      window.dispatchEvent(new Event("agent-saved"));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
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

  // Handle auth requirement toggle
  const handleAuthRequiredChange = (checked: boolean) => {
    setAuthRequiredState(checked);
    setAuthRequired(checked);
    setSecuritySaved(true);
    setTimeout(() => setSecuritySaved(false), 2000);
  };

  return (
    <div>
      <Header title="Settings" />
      <div className="p-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="personalisation">Personalisation</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 max-w-4xl mx-auto mt-6">
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
                disabled={updateProfile.isPending || profileLoading}
              >
                <Save className="h-4 w-4" />
                {updateProfile.isPending ? "Saving..." : saved ? "Saved!" : "Save Changes"}
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
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security" className="space-y-6 max-w-4xl mx-auto mt-6">
            {/* AUTHENTICATION SETTINGS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Require Sign In
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {authRequired 
                        ? "Users must sign in to access the application. If authentication has issues, you may get locked out."
                        : "Authentication is optional. Users can access the app without signing in. Turn this on to enable authentication checks."}
                    </p>
                  </div>
                  <Switch
                    checked={authRequired}
                    onCheckedChange={handleAuthRequiredChange}
                  />
                </div>
                
                {securitySaved && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Save className="h-4 w-4" />
                    Settings saved!
                  </div>
                )}

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> When authentication is disabled, the application is accessible to everyone without signing in. 
                    This is useful for development or if authentication services have issues. When enabled, all routes require authentication.
                  </p>
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
          </TabsContent>

          {/* PERSONALISATION TAB */}
          <TabsContent value="personalisation" className="space-y-6 max-w-4xl mx-auto mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Theme</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred theme style
                      </p>
                    </div>
                    <ThemeSelector />
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Accent Color</Label>
                      <p className="text-sm text-muted-foreground">
                        Customize the accent color for buttons and highlights
                      </p>
                    </div>
                    <AccentColorSelector />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="mt-6">
            <Pipeline />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}