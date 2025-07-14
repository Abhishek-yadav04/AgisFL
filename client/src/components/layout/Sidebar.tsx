
import { Shield, BarChart3, AlertTriangle, Search, History, FileText, Settings, Brain } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { getUserInfo } from "@/lib/queryClient";
import { useState, useEffect } from "react";

/**
 * Navigation Configuration for AgiesFL Application
 * 
 * This configuration defines all the navigation items available in the sidebar.
 * Each item includes the display name, route path, icon, and optional badge.
 * 
 * The navigation is organized logically with core security features first,
 * followed by analysis tools, and administrative functions.
 */
const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, active: true },
  { name: "Incidents", href: "/incidents", icon: AlertTriangle, badge: "12" },
  { name: "Threat Detection", href: "/threats", icon: Shield },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Investigation", href: "/investigation", icon: Search },
  { name: "Forensics", href: "/forensics", icon: History },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Federated Learning", href: "/federated-learning", icon: Brain },
];

/**
 * Sidebar Component for AgiesFL Application
 * 
 * This component renders the main navigation sidebar with the following features:
 * - Application branding and logo
 * - Navigation menu with active state indicators
 * - Badge notifications for important sections
 * - User profile section with avatar and role information
 * - Settings access
 * - Responsive design with proper accessibility
 * 
 * The sidebar provides quick access to all major application features and
 * maintains visual consistency with the overall design system.
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */
export function Sidebar() {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  // Get user profile information
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      // In production, this would fetch from /api/user/profile
      const userInfo = getUserInfo();
      return userInfo;
    },
    enabled: false, // Enable when user auth is fully implemented
  });

  useEffect(() => {
    try {
      // Get user information from JWT token
      const userInfo = getUserInfo();
      if (userInfo) {
        setUser(userInfo);
      }
    } catch (error) {
      console.error('Failed to load user information in sidebar:', error);
    }
  }, []);

  /**
   * Check if a navigation item is currently active
   * 
   * @param itemHref - The href of the navigation item
   * @returns boolean indicating if the item is active
   */
  const isNavigationItemActive = (itemHref: string): boolean => {
    if (itemHref === "/" && (location.pathname === "/" || location.pathname === "/dashboard")) {
      return true;
    }
    return location.pathname === itemHref;
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
      {/* Application Branding */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">AgiesFL</h1>
            <p className="text-xs text-gray-400">Enterprise Security Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = isNavigationItemActive(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.name} to={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start space-x-3 transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30" 
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 px-2 py-1 rounded-full text-xs text-white font-medium">
                    {item.badge}
                  </span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user?.avatar || userProfile?.avatar || "/placeholder-avatar.jpg"} 
              alt={user?.username || userProfile?.username || "User"}
            />
            <AvatarFallback className="bg-blue-600 text-white font-semibold">
              {user?.username 
                ? user.username.substring(0, 2).toUpperCase()
                : userProfile?.username?.substring(0, 2).toUpperCase() || 'SA'
              }
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {user?.username || userProfile?.username || 'Security Admin'}
            </p>
            <p className="text-xs text-gray-400">
              {user?.role || userProfile?.role || 'System Administrator'}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => console.log('⚙️ Opening user settings...')}
          >
            <Settings className="h-4 w-4 text-gray-400 hover:text-gray-100" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Export as default for backward compatibility
export default Sidebar;
