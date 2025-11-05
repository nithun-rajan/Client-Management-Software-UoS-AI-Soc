// src/components/Sidebar.tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import AgentProfileDialog from "./AgentProfileDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home, Building2, Users, UserCheck, Search,
  BarChart3, Settings, MessageSquare
} from "lucide-react";

const AGENT_KEY = "john-smith-agent";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Landlords", href: "/landlords", icon: UserCheck },
  { name: "Applicants", href: "/applicants", icon: Users },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Search", href: "/search", icon: Search },
  { name: "KPIs", href: "/kpis", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const [agentOpen, setAgentOpen] = useState(false);
  const [agent, setAgent] = useState({
    name: "John Smith",
    avatarUrl: "",
    kpi: "96%"
  });

  const loadAgent = () => {
    const saved = localStorage.getItem(AGENT_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setAgent({
        name: data.name || "John Smith",
        avatarUrl: data.avatarUrl || "",
        kpi: data.kpis?.askingPrice || "96%"
      });
    }
  };

  // Load on mount
  useEffect(() => {
    loadAgent();
  }, []);

  // Listen to Settings save (from another tab or same tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === AGENT_KEY) loadAgent();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Listen to custom event from Settings (same tab)
  useEffect(() => {
    const handleSave = () => loadAgent();
    window.addEventListener("agent-saved", handleSave);
    return () => window.removeEventListener("agent-saved", handleSave);
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-white/10 bg-gradient-primary backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <Building2 className="h-8 w-8 text-white" />
          <div>
            <div className="text-lg font-bold leading-tight text-white">
              UoS Scouting
            </div>
            <div className="text-xs text-white/70">Challenge</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Agent Profile – 100% ORIGINAL LOOK */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => setAgentOpen(true)}
            className="group flex w-full items-center gap-3 rounded-lg p-2 transition-all hover:bg-white/10"
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={agent.avatarUrl} />
                <AvatarFallback className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-lg">
                  {agent.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full border-2 border-indigo-900 bg-green-400"></div>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">{agent.name}</p>
              <p className="text-xs text-white/70">• Live</p>
            </div>
            <Sparkles className="h-4 w-4 text-yellow-400 opacity-0 transition group-hover:opacity-100" />
          </button>
        </div>

        <AgentProfileDialog open={agentOpen} onOpenChange={setAgentOpen} />
      </div>
    </aside>
  );
}