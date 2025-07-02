import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AuthButton from './AuthButton';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-8 gap-3 sm:gap-0">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground text-sm font-medium">Welcome back, {user?.displayName?.split(' ')[0]}!</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-card rounded-xl border border-border/50 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Start Chatting</h2>
            </div>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              Choose from our diverse collection of personas and start engaging conversations. 
              Chat with celebrities, anime characters, historical figures, and more!
            </p>
            <Button 
              onClick={() => navigate('/chat')} 
              className="w-full"
              variant="outline"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Chat
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <svg className="w-5 h-5 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Your Profile</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <img
                  src={user?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'}
                  alt={user?.displayName || 'User'}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover self-start"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground break-words">{user?.displayName}</h3>
                  <p className="text-muted-foreground text-sm break-words">{user?.email}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground font-medium">Joined</label>
                    <p className="text-foreground">
                      {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="text-muted-foreground font-medium">Last Active</label>
                    <p className="text-foreground">
                      {user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 lg:mt-8 bg-card rounded-xl border border-border/50 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Available Features</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 sm:p-6 bg-muted/50 rounded-lg">
              <div className="text-2xl mb-2">🎭</div>
              <h3 className="font-semibold text-foreground mb-2">Diverse Personas</h3>
              <p className="text-sm text-muted-foreground">Chat with celebrities, anime characters, cartoon figures, and historical personalities</p>
            </div>
            <div className="text-center p-4 sm:p-6 bg-muted/50 rounded-lg">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-foreground mb-2">Real-time Chat</h3>
              <p className="text-sm text-muted-foreground">Enjoy seamless conversations with instant responses from your chosen personas</p>
            </div>
            <div className="text-center p-4 sm:p-6 bg-muted/50 rounded-lg sm:col-span-2 xl:col-span-1">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-semibold text-foreground mb-2">Beautiful UI</h3>
              <p className="text-sm text-muted-foreground">Experience our modern, responsive design with dark and light mode support</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 