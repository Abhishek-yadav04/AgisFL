import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useLocation } from 'wouter';

export const Login = () => {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (!isLogin) {
      if (!formData.email.trim()) {
        setError('Email is required for registration');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication token
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Redirect to dashboard
        setLocation('/dashboard');
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      // For demo purposes, allow guest access
      console.warn('Authentication service not available, allowing demo access');
      localStorage.setItem('demo_mode', 'true');
      localStorage.setItem('user_data', JSON.stringify({
        username: formData.username,
        role: 'guest',
        permissions: ['read']
      }));
      setLocation('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('user_data', JSON.stringify({
      username: 'guest',
      role: 'guest',
      permissions: ['read']
    }));
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="relative">
              <Shield className="h-12 w-12 text-cyan-400" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">AgisFL</h1>
          <p className="text-gray-400">Federated Learning Intrusion Detection System</p>
        </div>

        {/* Auth Card */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">
              {isLogin ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              {isLogin 
                ? 'Enter your credentials to access the security dashboard' 
                : 'Register for enterprise-grade intrusion detection'
              }
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="border-red-500 bg-red-500/10">
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-300">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-cyan-400"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              {/* Email Field (Registration only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-cyan-400"
                    placeholder="Enter your email"
                    required={!isLogin}
                  />
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-cyan-400"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Registration only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-cyan-400"
                      placeholder="Confirm your password"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleGuestAccess}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white"
              >
                Continue as Guest
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                >
                  {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Security Note */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>🔒 Your data is protected with enterprise-grade security</p>
          <p>🛡️ Real-time threat detection and federated learning</p>
        </div>
      </div>
    </div>
  );
};

