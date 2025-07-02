import { useAuth } from '../hooks/useAuth';
import AuthButton from './AuthButton';
import { ThemeToggle } from './ThemeToggle';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground text-sm font-medium">Welcome back, {user?.displayName?.split(' ')[0]}!</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-card rounded-xl border border-border/50 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Your Profile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
              <p className="text-lg font-medium text-foreground">{user?.displayName}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
              <p className="text-lg font-medium text-foreground">{user?.email}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account Created</label>
              <p className="text-lg font-medium text-foreground">
                {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Last Sign In</label>
              <p className="text-lg font-medium text-foreground">
                {user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-card rounded-xl border border-border/50 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Session Status</h2>
          </div>
          <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  Active & Secure Session
                </h3>
                <p className="text-green-700 dark:text-green-300 leading-relaxed">
                  Your authentication is active and persistent. You'll remain signed in until your token expires or you manually sign out.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 