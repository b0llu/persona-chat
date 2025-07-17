import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import AuthGuard from './components/AuthGuard';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';

// Lazy load components
const Landing = lazy(() => import('./components/Landing'));
const ChatInterface = lazy(() => import('./components/ChatInterface'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <Landing />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <AuthGuard>
              <ChatInterface />
            </AuthGuard>
          } 
        />
        <Route 
          path="/chat/:chatId" 
          element={
            <AuthGuard>
              <ChatInterface />
            </AuthGuard>
          } 
        />
        <Route 
          path="/temp-chat/:chatId" 
          element={
            <AuthGuard>
              <ChatInterface />
            </AuthGuard>
          } 
        />
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/"} replace />} 
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
