import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/queryClient";

/**
 * Login Page Component for AgiesFL Application
 * 
 * This component provides secure authentication for the AgiesFL platform.
 * It includes comprehensive form validation, error handling, and security features.
 * 
 * Features:
 * - Secure credential input with password visibility toggle
 * - Form validation with real-time feedback
 * - Loading states and error handling
 * - Responsive design for multiple screen sizes
 * - Professional enterprise-grade styling
 * - Accessibility compliance
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */
export function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const navigate = useNavigate();

  /**
   * Validate form inputs
   * 
   * @returns boolean indicating if form is valid
   */
  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string } = {};

    if (!credentials.username.trim()) {
      errors.username = 'Username is required';
    } else if (credentials.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!credentials.password) {
      errors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Attempting authentication for AgiesFL...');

      // Attempt authentication
      const response = await apiRequest('POST', '/auth/login', credentials);

      if (response.token) {
        // Store authentication token
        localStorage.setItem('agiesfl_token', response.token);

        // Store refresh token if provided
        if (response.refreshToken) {
          localStorage.setItem('agiesfl_refresh_token', response.refreshToken);
        }

        // Create session ID for tracking
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('agiesfl_session_id', sessionId);

        console.log('✅ Authentication successful, redirecting to dashboard...');

        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        throw new Error('Authentication failed: No token received');
      }
    } catch (error: any) {
      console.error('❌ Authentication failed:', error);

      // Handle different types of errors
      if (error.status === 401) {
        setError('Invalid username or password. Please try again.');
      } else if (error.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle input changes with validation
   * 
   * @param field - Field name to update
   * @param value - New field value
   */
  const handleInputChange = (field: 'username' | 'password', value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Clear general error when user modifies input
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Welcome to AgiesFL
          </CardTitle>
          <CardDescription className="text-gray-400">
            Federated Learning Security Platform
          </CardDescription>
          <CardDescription className="text-gray-500 text-sm">
            Sign in to access your security dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="border-red-700 bg-red-900/20">
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 ${
                  validationErrors.username ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
                required
              />
              {validationErrors.username && (
                <p className="text-sm text-red-400">
                  {validationErrors.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 pr-10 ${
                    validationErrors.password ? 'border-red-500' : ''
                  }`}
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-red-400">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Additional Information */}
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>
              For demonstration purposes, use any username and password.
            </p>
            <p>
              This is a final year project showcasing enterprise-level security features.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4 text-center text-xs text-gray-600">
        <p>AgiesFL v1.0.0 - Federated Learning Security Platform</p>
        <p className="mt-1">Academic Final Year Project - Educational Use Only</p>
      </div>
    </div>
  );
}

// Export as default for backward compatibility
export default Login;