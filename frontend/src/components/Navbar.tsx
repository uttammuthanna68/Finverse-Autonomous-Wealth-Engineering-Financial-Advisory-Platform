import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LogOut, User as UserIcon, LayoutDashboard, ClipboardList, CreditCard, ListOrdered, Calculator, BookOpen, Layers, Award, Bell, BellRing, CheckCircle2, ShieldAlert, Sparkles, X, Receipt } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'monthly_payment' | 'emergency_fund' | 'shelly_milestone' | 'rebalancing';
  date: string;
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Monthly Payment Tracking Active',
    message: 'Your monthly payment auto-tracking is active! Emergency Fund & Investment allocations update automatically.',
    type: 'monthly_payment',
    date: 'Monthly Update',
    read: false,
  },
  {
    id: 'n2',
    title: 'Emergency Reserve Priority (6× Expenses)',
    message: 'Target 6× monthly expenses. 50% Flexi-FD (Bank Sweep-In) + 50% Liquid Mutual Fund split recommended for 24/7 liquidity.',
    type: 'emergency_fund',
    date: 'Priority Alert',
    read: false,
  },
  {
    id: 'n3',
    title: 'Prof. Shelly Milestone Ready',
    message: 'Complete your monthly contribution to unlock Shelly mascot progress badge!',
    type: 'shelly_milestone',
    date: 'System',
    read: false,
  },
];

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('finverse_notifications');
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (e) {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS);
      localStorage.setItem('finverse_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
    }

    // Listen for custom notification events
    const handleNotify = (e: any) => {
      if (e.detail) {
        setNotifications((prev) => {
          const updated = [e.detail, ...prev];
          localStorage.setItem('finverse_notifications', JSON.stringify(updated));
          return updated;
        });
      }
    };
    window.addEventListener('finverse_notification', handleNotify as EventListener);
    return () => window.removeEventListener('finverse_notification', handleNotify as EventListener);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('finverse_notifications', JSON.stringify(updated));
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('finverse_notifications', JSON.stringify(updated));
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAllAsRead();
        }}
        className="relative p-2 rounded-xl text-muted hover:text-main hover:bg-surface transition-colors flex items-center justify-center border border-black/5"
        title="Monthly Updates & Alerts"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-primary animate-pulse" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-card-bg">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-card-bg rounded-2xl shadow-xl border border-black/10 z-50 p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-black/5 pb-2">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-main">Monthly Updates & Alerts</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted hover:text-main text-xs font-bold p-1 rounded-lg hover:bg-surface"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No updates right now.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 relative transition-all ${
                    n.read ? 'bg-surface border-black/5' : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-bold text-main">
                      {n.type === 'emergency_fund' && <ShieldAlert className="w-3.5 h-3.5 text-warning" />}
                      {n.type === 'monthly_payment' && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                      {n.type === 'shelly_milestone' && <Sparkles className="w-3.5 h-3.5 text-primary" />}
                      <span>{n.title}</span>
                    </div>
                    <button
                      onClick={(e) => removeNotification(n.id, e)}
                      className="text-muted hover:text-warning"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-muted leading-relaxed text-[11px]">{n.message}</p>
                  <span className="text-[10px] text-muted/70 font-mono block text-right">{n.date}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate('/login');
  };

  return (
    <header className="bg-card-bg border-b border-black/5 shadow-card sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* App Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate(isAuthenticated ? '/dashboard' : '/login')}>
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shadow-sm">
              F
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-main block leading-none">Finverse</span>
              <span className="text-[10px] text-muted font-medium tracking-wide uppercase">Financial Advisor</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPath === '/dashboard' || currentPath === '/'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => onNavigate('/priority')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPath === '/priority'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  <ListOrdered className="w-4 h-4" />
                  <span>Priority Plan</span>
                </button>

                <button
                  onClick={() => onNavigate('/portfolios')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPath === '/portfolios'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Portfolios</span>
                </button>

                <button
                  onClick={() => onNavigate('/creditcard/rewards')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPath === '/creditcard/rewards'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Card Rewards</span>
                </button>

                <button
                  onClick={() => onNavigate('/tax')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPath === '/tax'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Tax Advisor</span>
                </button>

                <button
                  onClick={() => onNavigate('/calculator')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPath === '/calculator'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Calculators</span>
                </button>

                <button
                  onClick={() => onNavigate('/glossary')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPath === '/glossary'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Glossary</span>
                </button>

                <button
                  onClick={() => onNavigate('/onboarding')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPath === '/onboarding'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Onboarding</span>
                </button>

                <button
                  onClick={() => onNavigate('/debt')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPath === '/debt'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Debts</span>
                </button>

                <button
                  onClick={() => onNavigate('/profile')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPath === '/profile'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profile</span>
                </button>

                {/* Top-Right Notification Center Bell */}
                <NotificationBell />

                <div className="h-6 w-px bg-black/10 mx-1 hidden sm:block" />

                {/* Logged in User Badge & Logout */}
                <div className="flex items-center space-x-3 pl-1">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-main">
                      {user?.full_name || 'User'}
                    </div>
                    <div className="text-[11px] text-muted truncate max-w-[140px]">
                      {user?.email}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center space-x-1.5 bg-surface hover:bg-warning/10 text-muted hover:text-warning border border-black/10 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                    title="Log out of session"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('/login')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPath === '/login'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-main hover:bg-surface'
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigate('/signup')}
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sign Up
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
