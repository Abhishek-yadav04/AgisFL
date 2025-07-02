import { Search, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function TopBar() {
  return (
    <header className="surface border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-white">Security Operations Dashboard</h2>
          <p className="text-sm on-surface-variant">Real-time incident monitoring and response</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search incidents, IPs, users..."
              className="surface-variant border-gray-600 pl-10 pr-4 py-2 text-sm text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent w-80"
            />
          </div>
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4 text-gray-400" />
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0">
              3
            </Badge>
          </Button>
          
          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>
    </header>
  );
}
