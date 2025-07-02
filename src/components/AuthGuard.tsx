import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthButton from './AuthButton';
import { ThemeToggle } from './ThemeToggle';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-primary/40 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Loading your session</p>
            <p className="text-sm text-muted-foreground">Please wait a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full mx-auto p-10 bg-card rounded-2xl shadow-lg border border-border/50">
          <div className="text-center mb-10">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">Welcome</h1>
            <p className="text-muted-foreground text-lg">Sign in to continue to your account</p>
          </div>
          <div className="flex justify-center">
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard; 