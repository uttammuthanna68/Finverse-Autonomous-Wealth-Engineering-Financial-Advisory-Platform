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
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenTour?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onOpenTour }) => {
  const { isAuthenticated, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('finverse_sidebar_collapsed') === 'true';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  if (!isAuthenticated) return null;

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('finverse_sidebar_collapsed', String(next));
      return next;
    });
  };

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

  const handleMobileNav = (path: string) => {
    onNavigate(path);
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible on md: screens and above) */}
      <aside
        className={`hidden md:flex ${
          isCollapsed ? 'w-20 px-2 py-4' : 'w-64 p-4'
        } bg-card-bg border-r border-black/5 flex-col justify-between min-h-screen sticky top-0 h-screen flex-shrink-0 transition-all duration-300 ease-in-out z-30 select-none shadow-sm`}
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
                  title="Expand Sidebar"
                >
                  F
                </button>
              </div>
            )}

            {!isCollapsed && (
              <button
                onClick={toggleCollapse}
                className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-surface transition-colors"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Nav Links */}
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

        {/* Footer Actions */}
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
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible on screens < md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card-bg border-t border-black/10 flex justify-around items-center px-2 py-2 shadow-lg backdrop-blur-md">
        <button
          onClick={() => handleMobileNav('/dashboard')}
          className={`flex flex-col items-center space-y-1 p-2 rounded-xl text-[10px] font-bold ${
            currentPath === '/dashboard' || currentPath === '/' ? 'text-primary' : 'text-muted'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => handleMobileNav('/tax')}
          className={`flex flex-col items-center space-y-1 p-2 rounded-xl text-[10px] font-bold ${
            currentPath === '/tax' ? 'text-primary' : 'text-muted'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span>Tax</span>
        </button>

        <button
          onClick={() => handleMobileNav('/portfolios')}
          className={`flex flex-col items-center space-y-1 p-2 rounded-xl text-[10px] font-bold ${
            currentPath === '/portfolios' ? 'text-primary' : 'text-muted'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Portfolios</span>
        </button>

        <button
          onClick={() => handleMobileNav('/debt')}
          className={`flex flex-col items-center space-y-1 p-2 rounded-xl text-[10px] font-bold ${
            currentPath === '/debt' ? 'text-primary' : 'text-muted'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Debt</span>
        </button>

        <button
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          className="flex flex-col items-center space-y-1 p-2 rounded-xl text-[10px] font-bold text-muted"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </div>

      {/* MOBILE SLIDE-OUT DRAWER MENU */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-4/5 max-w-xs bg-card-bg h-full p-5 flex flex-col justify-between shadow-2xl border-l border-black/10 animate-slideLeft">
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs">
                    F
                  </div>
                  <span className="font-extrabold text-main text-sm">Finverse Menu</span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-surface"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleMobileNav(item.path)}
                      className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                        isActive ? 'bg-primary text-white' : 'text-main hover:bg-surface'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-2 pt-3 border-t border-black/5">
              {onOpenTour && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenTour();
                  }}
                  className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-primary bg-primary/5 border border-primary/20"
                >
                  <ShellyMascot pose="happy" size="sm" animateFloat={false} className="w-5 h-5" />
                  <span>Ask Shelly / Tour</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  logout();
                  onNavigate('/login');
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-warning bg-warning/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
