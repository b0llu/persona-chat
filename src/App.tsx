import AuthGuard from './components/AuthGuard';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    </ThemeProvider>
  );
}

export default App;
