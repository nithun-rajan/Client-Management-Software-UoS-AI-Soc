import {
  Home,
  Building2,
  Users,
  UserCheck,
  Search,
  BarChart3,
  Settings,
  MessageSquare,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import AgentProfileDialog from "./AgentProfileDialog.tsx";

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

        {/* Agent Profile */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => setAgentOpen(true)}
            className="group flex w-full items-center gap-3 rounded-lg p-2 transition-all hover:bg-white/10"
          >
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-lg">
                EA
              </div>
              <div className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full border-2 border-indigo-900 bg-green-400"></div>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Estate Agent</p>
              <p className="text-xs text-white/70">• Live</p>
            </div>
            <Sparkles className="h-4 w-4 text-yellow-400 opacity-0 transition group-hover:opacity-100" />
          </button>
        </div>

        {/* Profile Pop up */}
        <AgentProfileDialog open={agentOpen} onOpenChange={setAgentOpen} />
      </div>
    </aside>
  );
}
