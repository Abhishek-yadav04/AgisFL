import { Bell, Search, Settings, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { getUserInfo, logout } from "@/lib/queryClient";

/**
 * TopBar Component for AgiesFL Application
 * 
 * This component renders the top navigation bar with the following features:
 * - Brand logo and application name
 * - Global search functionality
 * - System status indicator
 * - Notification system with badge
 * - User profile dropdown with authentication controls
 * - Settings access
 * 
 * The component includes comprehensive error handling and responsive design
 * for optimal user experience across different screen sizes.
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */
export function TopBar() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(0);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'maintenance'>('online');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      // Get user information from JWT token
      const userInfo = getUserInfo();
      if (userInfo) {
        setUser(userInfo);
      }
    } catch (error) {
      console.error('Failed to load user information:', error);
    }

    // Simulate notification count - in production, this would come from API
    setNotifications(3);

    // Check system status periodically
    const statusInterval = setInterval(checkSystemStatus, 30000);
    checkSystemStatus(); // Initial check

    return () => clearInterval(statusInterval);
  }, []);

  /**
   * Check system status and update indicator
   */
  const checkSystemStatus = async (): Promise<void> => {
    try {
      // In production, this would check actual system health endpoints
      const response = await fetch('/api/health');
      if (response.ok) {
        setSystemStatus('online');
      } else {
        setSystemStatus('offline');
      }
    } catch (error) {
      console.warn('System status check failed:', error);
      setSystemStatus('offline');
    }
  };

  /**
   * Handle user logout with proper cleanup
   */
  const handleLogout = async (): Promise<void> => {
    try {
      console.log('🚪 User logging out from AgiesFL...');

      // Call logout function which handles token cleanup and redirect
      logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      localStorage.removeItem('agiesfl_token');
      window.location.href = '/login';
    }
  };

  /**
   * Handle search functionality
   */
  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    if (query.trim()) {
      console.log('🔍 Searching for:', query);
      // In production, this would trigger search API call
      // and navigate to search results page
    }
  };

  /**
   * Handle search form submission
   */
  const handleSearchSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  /**
   * Get system status indicator color and text
   */
  const getSystemStatusDisplay = () => {
    switch (systemStatus) {
      case 'online':
        return {
          color: 'bg-green-500',
          text: 'System Online',
          pulse: 'animate-pulse'
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          text: 'System Offline',
          pulse: 'animate-pulse'
        };
      case 'maintenance':
        return {
          color: 'bg-yellow-500',
          text: 'Maintenance Mode',
          pulse: 'animate-pulse'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'Status Unknown',
          pulse: ''
        };
    }
  };

  const statusDisplay = getSystemStatusDisplay();

  return (
    <header className="h-16 border-b border-gray-700 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60 sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-6">
        {/* Brand Logo and Application Name */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/agiesfl-logo.png" 
              alt="AgiesFL Logo" 
              className="h-8 w-auto"
              onError={(e) => {
                // Fallback to Shield icon if logo fails to load
                e.currentTarget.style.display = 'none';
                const fallbackIcon = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallbackIcon) {
                  fallbackIcon.classList.remove('hidden');
                }
              }}
            />
            <Shield className="h-8 w-8 text-blue-500 hidden" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
                AgiesFL
              </h1>
              <p className="text-xs text-gray-400">Federated Learning Security</p>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search threats, incidents, nodes, or users..."
              className="pl-10 bg-gray-800 border-gray-600 focus:border-blue-500 text-white placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* System Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${statusDisplay.color} rounded-full ${statusDisplay.pulse}`}></div>
            <span className="text-sm text-gray-300">{statusDisplay.text}</span>
          </div>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative text-gray-300 hover:text-white"
            onClick={() => console.log('🔔 Opening notifications...')}
          >
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notifications > 99 ? '99+' : notifications}
              </Badge>
            )}
          </Button>

          {/* Settings */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-300 hover:text-white"
            onClick={() => console.log('⚙️ Opening settings...')}
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user?.avatar || "/placeholder-avatar.jpg"} 
                    alt={user?.username || "User"} 
                  />
                  <AvatarFallback className="bg-blue-600 text-white font-semibold">
                    {user?.username 
                      ? user.username.substring(0, 2).toUpperCase() 
                      : 'SA'
                    }
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">
                    {user?.username || user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs leading-none text-gray-400">
                    {user?.role 
                      ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)} - AgiesFL` 
                      : 'System Administrator'
                    }
                  </p>
                  <p className="text-xs text-blue-400">
                    {user?.email || 'admin@agiesfl.local'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

// Export as default for backward compatibility
export default TopBar;