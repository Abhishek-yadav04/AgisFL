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

export function TopBar() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    // Get user from localStorage or token
    const token = localStorage.getItem('agiesfl_token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUser(decoded);
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('agiesfl_token');
    window.location.href = '/login';
  };

  return (
    <header className="h-16 border-b border-gray-700 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60 sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/agiesfl-logo.png" 
              alt="AgiesFL Logo" 
              className="h-8 w-auto"
              onError={(e) => {
                // Fallback to Shield icon if logo fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <Shield className="h-8 w-8 text-green-500 hidden" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
                AgiesFL
              </h1>
              <p className="text-xs text-gray-400">Federated Learning Security</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search threats, incidents, or nodes..."
              className="pl-10 bg-gray-800 border-gray-600 focus:border-blue-500 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* System Status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">System Online</span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative text-gray-300 hover:text-white">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notifications}
              </Badge>
            )}
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="Current User" />
                  <AvatarFallback className="bg-blue-600 text-white font-semibold">
                    SA
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">Security Administrator</p>
                  <p className="text-xs text-gray-400">System Operator</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.username ? `${user.username.charAt(0).toUpperCase()}${user.username.slice(1)}` : 'System User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)} - NexusGuard AI` : 'Security Professional'}
                  </p>
                  <p className="text-xs text-blue-400">
                    {user?.email || 'security@nexusguard.ai'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}