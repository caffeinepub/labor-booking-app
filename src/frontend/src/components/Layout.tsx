import { Link, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Menu, X, Handshake } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const buttonText = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  useEffect(() => {
    console.log('[Layout] 🔄 State update:', {
      timestamp: new Date().toISOString(),
      isAuthenticated,
      loginStatus,
      principal: identity?.getPrincipal().toString() || 'N/A',
    });
  }, [isAuthenticated, loginStatus, identity]);

  const handleAuth = async () => {
    console.log('[Layout] 🔐 Auth button clicked');
    console.log('[Layout] Current state:', { isAuthenticated, loginStatus });
    
    if (isAuthenticated) {
      console.log('[Layout] Logging out...');
      try {
        await clear();
        console.log('[Layout] ✅ Logout successful, clearing query cache...');
        queryClient.clear();
        console.log('[Layout] ✅ Query cache cleared, navigating to home...');
        navigate({ to: '/' });
      } catch (error) {
        console.error('[Layout] ❌ Logout error:', error);
      }
    } else {
      console.log('[Layout] Logging in...');
      try {
        await login();
        console.log('[Layout] ✅ Login successful');
      } catch (error: any) {
        console.error('[Layout] ❌ Login error:', error);
        if (error.message === 'User is already authenticated') {
          console.log('[Layout] User already authenticated, clearing and retrying...');
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors">
              <Handshake className="h-6 w-6 text-primary" />
              <span>LaborLink</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {isAuthenticated && (
                <>
                  <Link
                    to="/discover"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Find Workers
                  </Link>
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/bookings"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    My Bookings
                  </Link>
                  <Link
                    to="/system-health"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    System Health
                  </Link>
                </>
              )}
              <Button
                onClick={handleAuth}
                disabled={disabled}
                variant={isAuthenticated ? 'outline' : 'default'}
                size="sm"
              >
                {buttonText}
              </Button>
            </nav>

            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 flex flex-col gap-3 border-t border-border pt-4">
              {isAuthenticated && (
                <>
                  <Link
                    to="/discover"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Find Workers
                  </Link>
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/bookings"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <Link
                    to="/system-health"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    System Health
                  </Link>
                </>
              )}
              <Button
                onClick={() => {
                  handleAuth();
                  setMobileMenuOpen(false);
                }}
                disabled={disabled}
                variant={isAuthenticated ? 'outline' : 'default'}
                size="sm"
                className="w-full"
              >
                {buttonText}
              </Button>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LaborLink. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Built with <Handshake className="h-4 w-4 text-primary" /> using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.hostname : 'laborlink-app'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
