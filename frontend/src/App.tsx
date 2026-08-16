import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { Sidebar } from './components/Sidebar';
import { ShellyTourModal } from './components/ShellyTourModal';
import { FloatingShellyBadge } from './components/FloatingShellyBadge';
import { ShellyToast } from './components/ShellyToast';
import { LoginPage } from './auth/LoginPage';
import { SignupPage } from './auth/SignupPage';
import { ForgotPasswordPage } from './auth/ForgotPasswordPage';
import { ProfilePage } from './auth/ProfilePage';
import { DashboardPage } from './dashboard/DashboardPage';
import { OnboardingPage } from './onboarding';
import { DebtPage } from './debt/DebtPage';
import { PriorityPage } from './priority/PriorityPage';
import { PortfoliosPage } from './portfolios/PortfoliosPage';
import { RewardsPage } from './creditcard/RewardsPage';
import { CalculatorPage } from './calculator/CalculatorPage';
import { SystemStatusPage } from './dev/SystemStatusPage';
import { TaxPage } from './tax/TaxPage';

function MainApp() {
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  useEffect(() => {
    if (isLoading) return;

    const publicPaths = ['/login', '/signup', '/forgot-password', '/dev/system-status'];
    const isPublicPath = publicPaths.includes(currentPath);

    if (!isAuthenticated && !isPublicPath) {
      handleNavigate('/login');
    } else if (isAuthenticated && isPublicPath) {
      // Direct authenticated user from login/signup to onboarding or dashboard
      handleNavigate(hasCompletedOnboarding ? '/dashboard' : '/onboarding');
    } else if (isAuthenticated && !hasCompletedOnboarding && (currentPath === '/dashboard' || currentPath === '/')) {
      handleNavigate('/onboarding');
    }
  }, [isAuthenticated, hasCompletedOnboarding, isLoading, currentPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary animate-bounce flex items-center justify-center text-white font-bold">
            F
          </div>
          <span className="text-sm font-bold text-main">Loading Finverse...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPath) {
      case '/login':
        return <LoginPage onNavigate={handleNavigate} />;
      case '/signup':
        return <SignupPage onNavigate={handleNavigate} />;
      case '/forgot-password':
        return <ForgotPasswordPage onNavigate={handleNavigate} />;
      case '/dev/system-status':
        return <SystemStatusPage />;
      default:
        if (!isAuthenticated) {
          return <LoginPage onNavigate={handleNavigate} />;
        }
        switch (currentPath) {
          case '/profile':
            return <ProfilePage onNavigate={handleNavigate} />;
          case '/onboarding':
            return <OnboardingPage onNavigate={handleNavigate} />;
          case '/debt':
            return <DebtPage />;
          case '/priority':
            return <PriorityPage />;
          case '/portfolios':
            return <PortfoliosPage />;
          case '/creditcard/rewards':
            return <RewardsPage />;
          case '/tax':
            return <TaxPage onNavigate={handleNavigate} />;
          case '/calculator':
            return <CalculatorPage />;
          case '/dashboard':
          case '/':
          default:
            return <DashboardPage onNavigate={handleNavigate} />;
        }
    }
  };

  return (
    <div className="min-h-screen bg-surface text-main font-sans flex relative transition-colors duration-300 overflow-x-hidden w-full max-w-full">
      {/* Persistent Dark/Light Mode Toggle on top right for ALL pages */}
      <ThemeToggle />

      {isAuthenticated && (
        <Sidebar
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onOpenTour={() => setIsTourOpen(true)}
        />
      )}
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-28 md:pb-8 overflow-y-auto overflow-x-hidden w-full max-w-full flex flex-col items-center">
        <div className="w-full max-w-7xl mx-auto overflow-x-hidden px-1">
          {renderContent()}
        </div>
      </main>

      {/* Global Shelly Mascot Components */}
      {isAuthenticated && (
        <>
          <FloatingShellyBadge
            onOpenTour={() => setIsTourOpen(true)}
            onNavigate={handleNavigate}
          />
          <ShellyTourModal
            isOpen={isTourOpen}
            onClose={() => setIsTourOpen(false)}
            onNavigate={handleNavigate}
          />
          <ShellyToast />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

