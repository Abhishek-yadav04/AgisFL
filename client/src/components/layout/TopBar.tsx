
import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Settings, LogOut, Bell, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TopBar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const isGuest = localStorage.getItem('demo_mode') === 'true';
  const username = isGuest ? 'guest' : 'admin';

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('demo_mode');
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "Failed to logout properly",
        variant: "destructive",
      });
    }
  };

  const handleNotifications = () => {
    toast({
      title: "Notifications",
      description: "No new notifications",
    });
  };

  const handleSettings = () => {
    toast({
      title: "Settings",
      description: "Settings panel coming soon",
    });
  };

  const handleSystemStatus = () => {
    toast({
      title: "System Status",
      description: "All systems operational",
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-gradient-to-r from-blue-500 to-purple-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold cyber-text-primary">AgisFL</h1>
              <p className="text-xs text-muted-foreground -mt-1">Security Center</p>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="hidden md:flex items-center space-x-2">
          <Badge variant="outline" className="text-green-500 border-green-500/50">
            <Activity className="h-3 w-3 mr-1" />
            Online
          </Badge>
          {isGuest && (
            <Badge variant="secondary">
              Demo Mode
            </Badge>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNotifications}
            className="hidden sm:flex"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSystemStatus}
            className="hidden sm:flex"
          >
            <Activity className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{username}</p>
                  <p className="text-xs text-muted-foreground">
                    {isGuest ? 'Guest User' : 'Administrator'}
                  </p>
                </div>
              </div>
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNotifications}>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSystemStatus}>
                <Activity className="mr-2 h-4 w-4" />
                <span>System Status</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
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
