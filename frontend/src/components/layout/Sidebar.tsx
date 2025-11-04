import { Home, Building2, Users, UserCheck, Search, BarChart3, Settings, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'Landlords', href: '/landlords', icon: UserCheck },
  { name: 'Applicants', href: '/applicants', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'KPIs', href: '/kpis', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-primary border-r border-white/10 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-white/10">
          <Building2 className="h-8 w-8 text-white" />
          <div>
            <div className="text-lg font-bold text-white leading-tight">UoS Scouting</div>
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white font-semibold">
              T67
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Team 67</p>
              <p className="text-xs text-white/60 truncate">UoS AI Society</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
