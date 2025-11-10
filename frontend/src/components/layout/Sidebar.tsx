// src/components/Sidebar.tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import AgentProfileDialog from "./AgentProfileDialog";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Home, Building2, Users, UserCheck,
  BarChart3, Settings, MessageSquare, Store, ShoppingBag,
  User, UserCircle, Building, CheckSquare, Wrench, Handshake, FileText
} from "lucide-react";

const AGENT_KEY = "john-smith-agent";

const navigation = {
  general: [
    { name: "Dashboard", href: "/", icon: Home },
  ],
  lettings: [
    { name: "Tenants", href: "/applicants", icon: Users },
    { name: "Properties for Letting", href: "/properties", icon: Building2 },
    { name: "Landlords", href: "/landlords", icon: UserCheck },
  ],
  sales: [
    { name: "Buyers", href: "/buyers", icon: User },
    { name: "Properties for Sale", href: "/properties-for-sale", icon: Building },
    { name: "Vendors", href: "/vendors", icon: UserCircle },
    { name: "Valuations", href: "/valuations", icon: FileText },
  ],
        other: [
          { name: "Messages", href: "/messages", icon: MessageSquare },
          { name: "Tasks", href: "/tasks", icon: CheckSquare },
          { name: "Tickets", href: "/tickets", icon: Wrench },
          { name: "Offers", href: "/offers", icon: Handshake },
          { name: "KPIs", href: "/kpis", icon: BarChart3 },
          { name: "Settings", href: "/settings", icon: Settings },
        ],
};

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
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {/* General */}
          {navigation.general.map((item) => {
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

          {/* Lettings Section */}
          <div className="pt-4">
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Lettings
              </h3>
            </div>
            {navigation.lettings.map((item) => {
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
          </div>

          {/* Sales Section */}
          <div className="pt-4">
            <Separator className="mb-3 bg-white/10" />
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Sales
              </h3>
            </div>
            {navigation.sales.map((item) => {
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
          </div>

          {/* Other Navigation */}
          <div className="pt-4">
            <Separator className="mb-3 bg-white/10" />
            {navigation.other.map((item) => {
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
          </div>
        </nav>

        {/* Theme Toggle */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center justify-center">
            <ThemeToggle variant="sidebar" />
          </div>
        </div>

        {/* Agent Profile - Compact & Clean */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => setAgentOpen(true)}
            className="group flex w-full items-center gap-2.5 rounded-lg p-2 transition-all hover:bg-white/10"
          >
            <div className="relative">
              <Avatar className="h-9 w-9 ring-2 ring-white/20">
                <AvatarImage src={agent.avatarUrl} />
                <AvatarFallback className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                  {agent.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-indigo-900 bg-green-500"></div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-white truncate">{agent.name}</p>
              <p className="text-[10px] text-white/60">Online</p>
            </div>
            <Sparkles className="h-3.5 w-3.5 text-yellow-400 opacity-0 transition group-hover:opacity-100 flex-shrink-0" />
          </button>
        </div>

        <AgentProfileDialog open={agentOpen} onOpenChange={setAgentOpen} />
      </div>
    </aside>
  );
}