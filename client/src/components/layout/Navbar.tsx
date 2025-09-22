import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { playFabAuth } from '@/services/playfab/auth';
import { Skeleton } from '@/components/ui/skeleton';

interface NavbarProps {
  /** Optional title to display in the navbar */
  title?: string;
  /** Optional badges to display next to the title */
  badges?: React.ReactNode[];
  /** Optional custom navigation items to display on the right side */
  rightContent?: React.ReactNode;
  /** Show back button with custom click handler */
  showBackButton?: boolean;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Additional class names */
  className?: string;
}

export function Navbar({ 
  title = 'Human ARC', 
  rightContent,
  showBackButton = false, 
  onBack,
  className = '' 
}: NavbarProps) {
  const [location] = useLocation();
  const isAuthenticated = playFabAuth.isAuthenticated();
  const isLoading = false; // No direct loading state in auth manager

  // Don't show navbar on certain pages
  if (['/play', '/game', '/officer-track'].some(path => location.startsWith(path))) {
    return null;
  }

  return (
    <nav className={`bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and title */}
          <div className="flex items-center">
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mr-4 text-gray-600 hover:bg-gray-100"
              >
                &larr; Back
              </Button>
            )}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </span>
            </Link>
          </div>

          {/* Right side - Navigation and auth */}
          <div className="flex items-center space-x-4">
            {rightContent || (
              <div className="hidden md:flex items-center space-x-6">
                <NavLink href="/assessment">Assessment</NavLink>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/leaderboards/harc_leaderboard">Leaderboard</NavLink>
                <NavLink href="/puzzles">Puzzles</NavLink>
                <NavLink href="/about">About</NavLink>

                {isLoading ? (
                  <Skeleton className="h-9 w-24 rounded-md" />
                ) : isAuthenticated ? (
                  <Button
                    asChild
                    className="border border-blue-500 bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <Link href="/profile">My Profile</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Helper component for navigation links
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        isActive
          ? 'text-blue-600 font-semibold'
          : 'text-gray-600 hover:text-blue-600'
      }`}
    >
      {children}
    </Link>
  );
}
