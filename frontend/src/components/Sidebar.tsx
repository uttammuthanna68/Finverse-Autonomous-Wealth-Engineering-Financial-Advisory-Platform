import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ShellyMascot } from './ShellyMascot';
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  Layers,
  Calculator,
  User as UserIcon,
  Award,
  LogOut,
  PanelLeftClose,
  Receipt,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenTour?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onOpenTour }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('finverse_sidebar_collapsed') === 'true';
  });

  if (!isAuthenticated) return null;

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('finverse_sidebar_collapsed', String(next));
      return next;
    });
  };

  const initial = user?.full_name
    ? user.full_name.trim().charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'F';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Onboarding', path: '/onboarding', icon: ClipboardList },
    { label: 'Debt Payoff', path: '/debt', icon: CreditCard },
    { label: 'Card Rewards', path: '/creditcard/rewards', icon: Award },
    { label: 'Tax Advisor', path: '/tax', icon: Receipt },
    { label: 'Portfolios', path: '/portfolios', icon: Layers },
    { label: 'Calculators', path: '/calculator', icon: Calculator },
    { label: 'Profile', path: '/profile', icon: UserIcon },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20 px-2 py-4' : 'w-64 p-4'
      } bg-card-bg border-r border-black/5 flex flex-col justify-between min-h-screen sticky top-0 h-screen flex-shrink-0 transition-all duration-300 ease-in-out z-30 select-none shadow-sm`}
    >
      <div className="space-y-5">
        
        {/* Brand & Collapse Header */}
        <div className="flex items-center justify-between px-2 pt-1 border-b border-black/5 pb-3 min-h-[48px]">
          {!isCollapsed ? (
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                F
              </div>
              <div className="flex flex-col">
                <span className="font-black text-main text-sm tracking-tight leading-none">Finverse</span>
                <span className="text-[10px] text-muted font-semibold uppercase tracking-wider mt-0.5">Wealth Suite</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto">
              <button
                onClick={toggleCollapse}
                className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-sm hover:scale-105 transition-transform"
                title="Expand Navigation Sidebar"
              >
                F
              </button>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-xl hover:bg-surface text-muted hover:text-main transition-colors flex-shrink-0"
              title="Collapse Navigation Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Card Profile Header (Expanded Mode) */}
        {!isCollapsed && (
          <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-surface border border-black/5">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20 flex-shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-extrabold text-main text-xs block truncate leading-tight">
                {user?.full_name || 'Finverse User'}
              </span>
              <span className="text-[10px] text-muted font-mono truncate block mt-0.5">
                {user?.email}
              </span>
            </div>
          </div>
        )}

        {/* Vertical Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path === '/dashboard' && currentPath === '/');

            return (
              <div key={item.path} className="relative group">
                <button
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center py-3' : 'space-x-3 px-3.5 py-2.5'
                  } rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>

                {/* Hover Tooltip when Collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block bg-main text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-lg whitespace-nowrap z-50 animate-fadeIn pointer-events-none">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions (Shelly Mascot & Logout) */}
      <div className="space-y-2 pt-3 border-t border-black/5">
        {onOpenTour && (
          <div className="relative group">
            <button
              onClick={onOpenTour}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center py-2.5' : 'space-x-3 px-3.5 py-2'
              } rounded-xl text-xs font-extrabold text-primary bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/20`}
            >
              <ShellyMascot pose="happy" size="sm" animateFloat={false} className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Ask Shelly / Tour</span>}
            </button>

            {isCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block bg-main text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-lg whitespace-nowrap z-50 animate-fadeIn pointer-events-none">
                Ask Shelly / Guided Tour
              </div>
            )}
          </div>
        )}

        <div className="relative group">
          <button
            onClick={() => {
              logout();
              onNavigate('/login');
            }}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center py-2.5' : 'space-x-3 px-3.5 py-2.5'
            } rounded-xl text-xs font-bold text-muted hover:text-warning hover:bg-warning/10 transition-colors`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Logout</span>}
          </button>

          {isCollapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block bg-warning text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-lg whitespace-nowrap z-50 animate-fadeIn pointer-events-none">
              Logout
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
