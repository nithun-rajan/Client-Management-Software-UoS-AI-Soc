// src/components/Sidebar.tsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import AgentProfileDialog from "./AgentProfileDialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useAgent } from "@/hooks/useAgents";
import { Badge } from "@/components/ui/badge";
import {
  Home, Building2, Users, UserCheck,
  BarChart3, Settings, Store, ShoppingBag,
  User, UserCircle, Building, CheckSquare, Wrench, Handshake, FileText,
  Calendar, StickyNote, UserCog, Sparkles, LogOut, UserIcon, Ticket
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const AGENT_KEY = "john-smith-agent";

const navigation = {
  general: [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "My Tasks", href: "/my-tasks", icon: CheckSquare },
    { name: "Notes", href: "/notes", icon: StickyNote },
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
  ],
  operations: [
    { name: "Maintenance", href: "/maintenance", icon: Wrench },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Tickets", href: "/tickets", icon: Ticket },
    { name: "Offers", href: "/offers", icon: Handshake },
  ],
  analytics: [
    { name: "KPIs", href: "/kpis", icon: BarChart3 },
  ],
  system: [
    { name: "Agents", href: "/agents", icon: UserCog },
    { name: "Settings", href: "/settings", icon: Settings },
  ],
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [agentOpen, setAgentOpen] = useState(false);
  const { user, logout } = useAuth();
  const { data: agentData } = useAgent(user?.id || "");

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

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-white/10 bg-gradient-primary backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <img 
            src="/images/favicon.png" 
            alt="AI Society Logo" 
            className="h-10 w-10 object-contain"
          />
          <div>
            <div className="text-lg font-bold leading-tight text-white">
              Properly CRM
            </div>
            <div className="text-xs text-white/70">Estate Management</div>
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

          {/* Operations Section */}
          <div className="pt-4">
            <Separator className="mb-3 bg-white/10" />
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Operations
              </h3>
            </div>
            {navigation.operations.map((item) => {
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

          {/* Analytics Section */}
          <div className="pt-4">
            <Separator className="mb-3 bg-white/10" />
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Analytics
              </h3>
            </div>
            {navigation.analytics.map((item) => {
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

          {/* System Section */}
          <div className="pt-4 mt-auto">
            <Separator className="mb-3 bg-white/10" />
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                System
              </h3>
            </div>
            {navigation.system.map((item) => {
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

        {/* Agent Profile - Dropdown Menu */}
        {user && (
          <div className="border-t border-white/10 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex w-full items-center gap-2.5 rounded-lg p-2 transition-all hover:bg-white/10">
                  <div className="relative">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary ring-2 ring-white/20 text-sm font-semibold text-white">
                      {getUserInitials()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500"></div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-white truncate">{getUserDisplayName()}</p>
                      {agentData?.team && (
                        <Badge className="bg-accent text-white text-[9px] font-semibold px-1.5 py-0 h-4 leading-none">
                          {agentData.team}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-white/60">Online</p>
                  </div>
                  <Sparkles className="h-3.5 w-3.5 text-yellow-400 opacity-0 transition group-hover:opacity-100 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize mt-1">
                      {user.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAgentOpen(true)}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <AgentProfileDialog open={agentOpen} onOpenChange={setAgentOpen} />
      </div>
    </aside>
  );
}