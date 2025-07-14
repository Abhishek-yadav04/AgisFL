
import { 
  Shield, 
  Home, 
  AlertTriangle, 
  Eye, 
  BarChart, 
  Search, 
  FileText, 
  Network,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Sidebar Navigation Component for AgiesFL
 * 
 * Provides main navigation with clean, non-duplicated tabs
 */
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: Home,
      path: "/dashboard"
    },
    {
      id: "incidents",
      title: "Incidents",
      icon: AlertTriangle,
      path: "/incidents"
    },
    {
      id: "threats",
      title: "Threat Detection",
      icon: Eye,
      path: "/threats"
    },
    {
      id: "analytics", 
      title: "Analytics",
      icon: BarChart,
      path: "/analytics"
    },
    {
      id: "investigation",
      title: "Investigation",
      icon: Search,
      path: "/investigation"
    },
    {
      id: "forensics",
      title: "Forensics",
      icon: FileText,
      path: "/forensics"
    },
    {
      id: "reports",
      title: "Reports",
      icon: FileText,
      path: "/reports"
    },
    {
      id: "federated-learning",
      title: "Federated Learning",
      icon: Network,
      path: "/federated-learning"
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-gray-900 border-r border-gray-700 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-500" />
            <div>
              <h2 className="text-lg font-bold text-white">AgiesFL</h2>
              <p className="text-xs text-gray-400">Security Platform</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.id}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left",
                    isActive 
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "text-gray-300 hover:text-white hover:bg-gray-800",
                    isCollapsed && "justify-center"
                  )}
                  onClick={() => handleNavigation(item.path)}
                >
                  <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                  {!isCollapsed && <span>{item.title}</span>}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed && (
          <div className="text-center">
            <p className="text-xs text-gray-400">
              © 2025 AgiesFL Platform
            </p>
            <p className="text-xs text-gray-500">
              Version 1.0.0
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
