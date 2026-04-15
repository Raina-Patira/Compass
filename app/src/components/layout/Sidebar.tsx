import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  HelpCircle,
  Users,
  Trophy,
  BrainCircuit,
  Bell,
  UserCircle,
  Settings,
  MessageSquarePlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const mainNavItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/questions', label: 'Questions', icon: HelpCircle },
    { path: '/ask', label: 'Ask Question', icon: MessageSquarePlus },
    { path: '/experts', label: 'Experts', icon: Users },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/quiz', label: 'Daily Quiz', icon: BrainCircuit },
  ];

  const secondaryNavItems: NavItem[] = [
    { path: '/notifications', label: 'Notifications', icon: Bell, badge: 0 },
    { path: '/profile', label: 'Profile', icon: UserCircle },
  ];

  if (user?.isAdmin) {
    secondaryNavItems.push({ path: '/admin', label: 'Admin', icon: Settings });
  }

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-card border-r border-border overflow-y-auto z-40">
      <nav className="p-4 space-y-1">
        <div className="mb-6">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main
          </p>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div>
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Account
          </p>
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Card */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-primary">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.jobTitle || 'Member'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-primary">{user?.totalPoints}</p>
            <p className="text-[10px] text-muted-foreground">pts</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
