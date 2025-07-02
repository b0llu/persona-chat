import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
    return fallback || <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard; 