import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Settings, LogOut, Menu, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications] = useState([
    { id: 1, message: "High severity threat detected", time: "2 min ago", type: "threat" },
    { id: 2, message: "Federated learning round completed", time: "5 min ago", type: "fl" },
    { id: 3, message: "System performance optimal", time: "10 min ago", type: "system" },
  ]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActivePath = (path: string) => location.pathname === path;

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Federal Learning", path: "/federal-learning" },
    { label: "Threat Logs", path: "/threat-logs" },
    { label: "Network Logs", path: "/network-logs" },
  ];

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-4">
          <Shield className="h-8 w-8 text-blue-500" />
          <h1 className="text-xl font-bold cyber-text-primary cursor-pointer" onClick={() => navigate('/dashboard')}>
            AgisFL
          </h1>
          <Badge variant="outline" className="text-xs">
            v2.0 Enterprise
          </Badge>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          {/* Navigation Menu for larger screens */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActivePath(item.path) ? "default" : "ghost"}
                size="sm"
                onClick={() => handleNavigation(item.path)}
                className={isActivePath(item.path) ? "bg-blue-600 text-white" : ""}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2">
                <h4 className="font-medium text-sm mb-2">Notifications</h4>
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-2 text-sm border-b last:border-b-0">
                    <p className="font-medium">{notification.message}</p>
                    <p className="text-xs cyber-text-muted">{notification.time}</p>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-4">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={isActivePath(item.path) ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.label}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}