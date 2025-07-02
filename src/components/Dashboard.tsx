import { useAuth } from '../hooks/useAuth';
import AuthButton from './AuthButton';
import { ThemeToggle } from './ThemeToggle';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.displayName?.split(' ')[0]}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Your Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Name</label>
              <p className="mt-1 text-foreground">{user?.displayName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1 text-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Account Created</label>
              <p className="mt-1 text-foreground">
                {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Last Sign In</label>
              <p className="mt-1 text-foreground">
                {user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-card rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Session Information</h2>
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Your session is active and persistent
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>You'll remain signed in until your token expires or you manually sign out.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 