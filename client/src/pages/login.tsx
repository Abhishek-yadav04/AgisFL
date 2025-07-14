import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { isAuthenticated } from "@/lib/queryClient";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("agiesfl_token", data.token);
        // Clear form
        setUsername("");
        setPassword("");
        setAttemptCount(0);
        navigate("/dashboard", { replace: true });
      } else {
        setAttemptCount(prev => prev + 1);
        setError(data.error || "Invalid credentials");

        // Clear password after failed attempt
        setPassword("");

        // Additional security: warn after multiple failed attempts
        if (attemptCount >= 2) {
          setError("Multiple failed attempts detected. Please verify your credentials.");
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      setAttemptCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            AgiesFL Security System
          </CardTitle>
          <CardDescription className="text-gray-300">
            Advanced Federated Learning Intrusion Detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-200">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your username"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="border-red-600 bg-red-900/20">
                <AlertDescription className="text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-400">
            <p className="mb-2">Demo Credentials:</p>
            <div className="bg-gray-700 p-2 rounded text-left">
              <p>Username: <span className="text-blue-400 font-mono">admin</span></p>
              <p>Password: <span className="text-blue-400 font-mono">admin123</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}