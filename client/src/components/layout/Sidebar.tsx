
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Shield,
  AlertTriangle,
  BarChart3,
  Brain,
  Search,
  FileText,
  Users,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview and system status"
  },
  {
    title: "Threats",
    href: "/threats", 
    icon: Shield,
    description: "Active threats and alerts"
  },
  {
    title: "Incidents",
    href: "/incidents",
    icon: AlertTriangle,
    description: "Security incidents management"
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Security analytics and insights"
  },
  {
    title: "Federated Learning",
    href: "/federated-learning",
    icon: Brain,
    description: "AI model training and collaboration"
  },
  {
    title: "Investigation",
    href: "/investigation",
    icon: Search,
    description: "Digital forensics and investigation"
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    description: "Security reports and documentation"
  }
];

const adminItems = [
  {
    title: "Users",
    href: "/users",
    icon: Users,
    description: "User management"
  },
  {
    title: "Settings", 
    href: "/settings",
    icon: Settings,
    description: "System configuration"
  }
];

export function Sidebar() {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 border-r border-gray-800">
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800 px-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-500" />
          <span className="text-xl font-bold text-white">AgiesFL</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                  )}
                />
                {item.title}
              </Link>
            );
          })}
        </div>

        <Separator className="my-4 bg-gray-700" />

        {/* Admin Section */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Administration
          </p>
          {adminItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                  )}
                />
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              Security Analyst
            </p>
            <p className="text-xs text-gray-400 truncate">
              analyst@agiesfl.local
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
