import { Shield, BarChart3, AlertTriangle, Search, History, FileText, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, active: true },
  { name: "Incidents", href: "/incidents", icon: AlertTriangle, badge: "12" },
  { name: "Threat Detection", href: "/threats", icon: Shield },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Investigation", href: "/investigation", icon: Search },
  { name: "Forensics", href: "/forensics", icon: History },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const [location] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: false, // Enable when user auth is implemented
  });

  return (
    <div className="w-64 surface sidebar-shadow flex flex-col">
      {/* Logo/Branding */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-white">CyberShield IR</h1>
            <p className="text-xs on-surface-variant">Enterprise Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/" && location === "/dashboard");
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start space-x-3 ${
                  isActive 
                    ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30" 
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 px-2 py-1 rounded-full text-xs text-white">
                    {item.badge}
                  </span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100" />
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Alex Chen</p>
            <p className="text-xs on-surface-variant">Security Analyst</p>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 text-gray-400 hover:text-gray-100" />
          </Button>
        </div>
      </div>
    </div>
  );
}
