import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Login = lazy(() => import("@/pages/login"));
const Incidents = lazy(() => import("@/pages/incidents"));
const Threats = lazy(() => import("@/pages/threats"));
const Analytics = lazy(() => import("@/pages/analytics"));
const FederatedLearning = lazy(() => import("@/pages/federated-learning"));
const Forensics = lazy(() => import("@/pages/forensics"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-white text-lg">Loading...</div>
  </div>
);
import { ElectronProvider } from "@/lib/electron";
import { ErrorBoundary } from "@/lib/errorBoundary";
import queryClient, { isAuthenticated } from "@/lib/queryClient";
import { useEffect, useState } from "react";

// Protected route wrapper with enhanced error handling
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const authStatus = isAuthenticated();
      setAuthenticated(authStatus);
    } catch (error) {
      console.error('Authentication check failed:', error);
      setAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Verifying authentication...</div>
      </div>
    );
  }

  return authenticated ? children : <Navigate to="/login" replace />;
};

// Layout wrapper to reduce code duplication
const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  </div>
);

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize app state with error handling
    try {
      // Perform any necessary initialization
      setIsInitialized(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      setInitError('Failed to initialize application. Please refresh the page.');
    }
  }, []);

  if (initError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-4">Application Error</h2>
          <p className="text-gray-300 mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading AgiesFL...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ElectronProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <div className="min-h-screen bg-gray-900">
              <Routes>
                <Route path="/login" element={
                  <Suspense fallback={<PageLoader />}>
                    <Login />
                  </Suspense>
                } />
                <Route path="/" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Dashboard />
                      </Suspense>
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Dashboard />
                      </Suspense>
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/incidents" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Incidents />
                      </Suspense>
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/threats" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Threats />
                      </Suspense>
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Analytics />
                      </Suspense>
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/federated-learning" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Suspense fallback={<PageLoader />}>
                        <FederatedLearning />
                      </Suspense>
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/forensics" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Forensics />
                      </Suspense>
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ElectronProvider>
    </ErrorBoundary>
  );
}

export default App;