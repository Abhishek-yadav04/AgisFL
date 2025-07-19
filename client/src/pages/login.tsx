import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [demoMfaCode, setDemoMfaCode] = useState('');
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          mfaCode: showMFA ? mfaCode : undefined
        }),
      });

      const data = await response.json();

      if (data.requiresMFA) {
        setShowMFA(true);
        setDemoMfaCode(data.mfaCode || ''); // For demo purposes
        toast({
          title: "MFA Required",
          description: `Enter the 6-digit code: ${data.mfaCode}`,
          duration: 10000,
        });
        setIsLoading(false);
        return;
      }

      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        localStorage.removeItem('demo_mode');
        toast({
          title: "Login Successful",
          description: "Welcome to AgisFL Dashboard",
        });
        setLocation('/dashboard');
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : 'Authentication failed',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('demo_mode', 'true');
        toast({
          title: "Guest Access Granted",
          description: "Welcome to AgisFL Demo",
        });
        setLocation('/dashboard');
      } else {
        throw new Error(data.message || 'Guest login failed');
      }
    } catch (error) {
      console.error('Guest login error:', error);
      toast({
        title: "Guest Login Failed",
        description: error instanceof Error ? error.message : 'Failed to access demo mode',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setCredentials({
      username: 'admin',
      password: 'password123',
      rememberMe: false
    });
  };

  return (
    <div className="min-h-screen cyber-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold cyber-text-primary">
            AgisFL Security Center
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Federated Learning Intrusion Detection System
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showMFA ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                  className="bg-background/50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember"
                  checked={credentials.rememberMe}
                  onCheckedChange={(checked) => 
                    setCredentials(prev => ({ ...prev, rememberMe: !!checked }))
                  }
                />
                <Label htmlFor="remember" className="text-sm">Remember me</Label>
              </div>

              <Button 
                type="submit" 
                className="w-full cyber-button-primary" 
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Sign In"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fillDemoCredentials}
                  className="text-xs"
                >
                  Fill Demo Credentials
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                <h3 className="font-semibold">Multi-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit verification code
                </p>
                {demoMfaCode && (
                  <div className="p-2 bg-blue-500/10 rounded text-blue-400 text-sm">
                    Demo Code: <strong>{demoMfaCode}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mfa" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verification Code
                </Label>
                <Input
                  id="mfa"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg tracking-widest bg-background/50"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full cyber-button-primary" 
                disabled={isLoading || mfaCode.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowMFA(false);
                  setMfaCode('');
                  setDemoMfaCode('');
                }}
                className="w-full"
              >
                Back to Login
              </Button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            onClick={handleGuestLogin}
            variant="outline"
            className="w-full cyber-button-secondary"
            disabled={isLoading}
          >
            {isLoading ? "Connecting..." : "Continue as Guest"}
          </Button>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>Demo Credentials</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Username: <code className="bg-muted px-1 rounded">admin</code></div>
              <div>Password: <code className="bg-muted px-1 rounded">password123</code></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}