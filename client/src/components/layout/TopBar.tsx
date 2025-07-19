import { Shield, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TopBar() {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <Shield className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold cyber-text-primary">AgisFL</h1>
              <p className="text-sm cyber-text-muted">Cybersecurity Command Center</p>
            </div>
          </div>
        </div>
        
        <nav className="flex items-center space-x-6">
          <a href="#" className="cyber-info font-medium">Dashboard</a>
          <a href="#" className="cyber-text-muted hover:text-primary transition-colors">Threats</a>
          <a href="#" className="cyber-text-muted hover:text-primary transition-colors">Network</a>
          <a href="#" className="cyber-text-muted hover:text-primary transition-colors">Analytics</a>
          <a href="#" className="cyber-text-muted hover:text-primary transition-colors">Federated Learning</a>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="border-accent">
            <Bell className="mr-2 h-4 w-4" />
            Alerts 
            <Badge variant="destructive" className="ml-2">3</Badge>
          </Button>
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
