
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff, Lock, User, AlertTriangle, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Simulate authentication process
    try {
      // Demo credentials validation
      if (credentials.username && credentials.password) {
        setSuccess('Authentication successful! Redirecting to dashboard...');
        
        // Create a demo JWT token for development
        const demoToken = btoa(JSON.stringify({
          id: 'demo-user-001',
          username: credentials.username,
          email: `${credentials.username}@agiesfl.com`,
          role: 'administrator',
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
          iat: Math.floor(Date.now() / 1000)
        }));
        
        localStorage.setItem('agiesfl_token', `demo.${demoToken}.signature`);
        localStorage.setItem('agiesfl_user', JSON.stringify({
          username: credentials.username,
          email: `${credentials.username}@agiesfl.com`,
          role: 'administrator'
        }));

        // Redirect after brief delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setError('Please enter both username and password');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setCredentials({ username: 'admin', password: 'demo123' });
    setTimeout(() => {
      document.getElementById('login-form')?.dispatchEvent(new Event('submit', { bubbles: true }));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Branding */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <img 
              src="/agiesfl-logo.png" 
              alt="AgiesFL Logo" 
              className="h-16 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <Shield className="h-16 w-16 text-green-500 hidden" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
              NexusGuard AI
            </h1>
            <p className="text-gray-400 text-sm">Next-Generation AI-Powered Cybersecurity Defense</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Welcome Back</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter your credentials to access the security dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-700 bg-red-900/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-700 bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400">{success}</AlertDescription>
              </Alert>
            )}

            <form id="login-form" onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-800 px-2 text-gray-400">Or</span>
              </div>
            </div>

            <Button 
              type="button"
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={handleDemoLogin}
            >
              Demo Login
            </Button>

            <div className="text-center text-xs text-gray-500">
              <p>Demo Credentials: admin / demo123</p>
              <p className="mt-1">Enterprise-grade security simulation</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <div className="text-center space-y-2">
          <div className="flex justify-center space-x-4 text-xs text-gray-500">
            <span>• End-to-End Encryption</span>
            <span>• Multi-Factor Auth</span>
            <span>• Zero Trust Architecture</span>
          </div>
          <p className="text-xs text-gray-600">
            Powered by advanced AI and federated learning technologies
          </p>
        </div>
      </div>
    </div>
  );
}
