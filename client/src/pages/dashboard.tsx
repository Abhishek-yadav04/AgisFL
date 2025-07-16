// Error Boundary for edge case handling
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    // Optionally log error to a service
    // console.error(error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-2">Something went wrong</h1>
          <p className="text-gray-300 mb-4">An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.</p>
          <pre className="bg-gray-900 text-red-300 p-4 rounded max-w-xl overflow-x-auto text-xs mb-4">{String(this.state.error)}</pre>
          <button onClick={() => window.location.reload()} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded">Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
import React, { useEffect, useState, useMemo, memo } from "react";
import { UserCircle, Sun, Moon, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MetricsOverview from "@/components/dashboard/MetricsOverview";
import ThreatActivity from "@/components/dashboard/ThreatActivity";
import SystemHealth from "@/components/dashboard/SystemHealth";
import IncidentTable from "@/components/dashboard/IncidentTable";
import AIInsights from "@/components/dashboard/AIInsights";
import AttackPathVisualization from "@/components/dashboard/AttackPathVisualization";
import FederatedLearningPanel from "@/components/dashboard/FederatedLearningPanel";
import { useWebSocket } from "@/lib/websocket";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
// Theme context for dark/light mode
const ThemeContext = React.createContext<{theme: string, toggle: () => void}>({ theme: 'dark', toggle: () => {} });
// Help & Docs Modal
function HelpDocsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full p-8 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl">&times;</button>
        <h2 className="text-2xl font-bold mb-2 text-white">Help & Docs</h2>
        <div className="text-gray-200 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
          <div>
            <b>Usage Instructions:</b>
            <ul className="list-disc ml-5 mt-1">
              <li>Monitor real-time threats, system health, and analytics on the dashboard.</li>
              <li>Use the sidebar to navigate between dashboard, reports, and settings.</li>
              <li>Download reports or export data as needed.</li>
              <li>Receive instant notifications for critical events.</li>
            </ul>
          </div>
          <div>
            <b>API Endpoints:</b>
            <ul className="list-disc ml-5 mt-1">
              <li><code>GET /api/fl-ids/status</code> - Federated learning status</li>
              <li><code>GET /api/fl-ids/nodes</code> - List of nodes</li>
              <li><code>GET /api/fl-ids/performance</code> - Performance metrics</li>
              <li><code>GET /api/fl-ids/threats</code> - Threat feed</li>
              <li><code>POST /api/fl-ids/analyze-csv</code> - Analyze uploaded CSV</li>
              <li><code>GET /api/fl-ids/download-report</code> - Download report</li>
            </ul>
          </div>
          <div>
            <b>Demo Walkthrough:</b>
            <ul className="list-disc ml-5 mt-1">
              <li>Login or access the dashboard as a guest.</li>
              <li>Observe real-time updates and notifications.</li>
              <li>Try uploading a CSV for analysis and download the generated report.</li>
              <li>Check the Project Info panel for tech stack and contributors.</li>
            </ul>
          </div>
          <div>
            <b>Support:</b> For questions, contact <a href="mailto:abhishek@example.com" className="underline text-blue-300">Abhishek Yadav</a> or visit the <a href="https://github.com/Abhishek-yadav04/AgisFL" target="_blank" rel="noopener" className="underline text-blue-300">GitHub repo</a>.
          </div>
        </div>
      </div>
    </div>
  );
}

// Project Info Panel
function ProjectInfoPanel() {
  return (
    <div className="rounded-xl bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 shadow-lg p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold mb-1 text-white">AgisFL: Federated Learning Intrusion Detection System</h2>
        <p className="text-blue-100 mb-2 max-w-xl">A real-time, enterprise-grade FL-IDS platform with persistent storage, live analytics, and a modern dashboard. Built for your final year project and beyond.</p>
        <div className="flex flex-wrap gap-2 text-xs text-blue-200">
          <span className="bg-blue-950 px-2 py-1 rounded">Flask</span>
          <span className="bg-blue-950 px-2 py-1 rounded">React</span>
          <span className="bg-blue-950 px-2 py-1 rounded">Vite</span>
          <span className="bg-blue-950 px-2 py-1 rounded">Tailwind CSS</span>
          <span className="bg-blue-950 px-2 py-1 rounded">PostgreSQL (Neon)</span>
          <span className="bg-blue-950 px-2 py-1 rounded">WebSockets</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start md:items-end">
        <div className="text-blue-100 text-sm">Contributors: <span className="font-semibold">Abhishek Yadav</span></div>
        <div className="flex gap-2 mt-1">
          <a href="https://github.com/Abhishek-yadav04/AgisFL" target="_blank" rel="noopener" className="underline text-blue-200 hover:text-white">GitHub</a>
          <a href="/docs" className="underline text-blue-200 hover:text-white">Docs</a>
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized dashboard components to prevent unnecessary re-renders
 * This optimization was implemented to improve performance when dealing
 * with real-time data updates from the WebSocket connection
 */
const MemoizedMetricsOverview = memo(MetricsOverview);
const MemoizedThreatActivity = memo(ThreatActivity);
const MemoizedSystemHealth = memo(SystemHealth);
const MemoizedIncidentTable = memo(IncidentTable);
const MemoizedAIInsights = memo(AIInsights);
const MemoizedAttackPathVisualization = memo(AttackPathVisualization);
const MemoizedFederatedLearningPanel = memo(FederatedLearningPanel);

export default function Dashboard() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const [helpOpen, setHelpOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarded'));
  const [demoLoading, setDemoLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ backend: false, db: false, ws: false });
  const [profileOpen, setProfileOpen] = useState(false);

  // Onboarding hint logic
  useEffect(() => {
    if (showOnboarding) {
      setTimeout(() => setShowOnboarding(false), 9000);
      localStorage.setItem('onboarded', '1');
    }
  }, [showOnboarding]);

  // System status check
  useEffect(() => {
    async function checkStatus() {
      try {
        const backend = await fetch('/api/fl-ids/status').then(r => r.ok);
        const db = await fetch('/api/fl-ids/performance').then(r => r.ok);
        // WebSocket: check isConnected from context
        setSystemStatus(s => ({ ...s, backend, db }));
      } catch {
        setSystemStatus(s => ({ ...s, backend: false, db: false }));
      }
    }
    checkStatus();
  }, []);
  // Real-time threat alert notification
  const { lastMessage } = useWebSocket();
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "threat_alert") {
      toast({
        title: "Threat Alert!",
        description: `${lastMessage.data?.type || "Unknown"} (${lastMessage.data?.severity || "?"}) detected at ${lastMessage.timestamp || "now"}`,
        variant: "destructive"
      });
    }
  }, [lastMessage]);
  // Federated learning status
  const { data: flStatus, isLoading: flLoading, error: flError } = useQuery({
    queryKey: ['fl-status'],
    queryFn: async () => {
      const response = await fetch('/api/fl-ids/status');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    refetchInterval: 10000,
    retry: false
  });

  // Nodes
  const { data: nodes, isLoading: nodesLoading, error: nodesError } = useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      const response = await fetch('/api/fl-ids/nodes');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    refetchInterval: 10000,
    retry: false
  });

  // Performance
  const { data: performance, isLoading: perfLoading, error: perfError } = useQuery({
    queryKey: ['fl-performance'],
    queryFn: async () => {
      const response = await fetch('/api/fl-ids/performance');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    refetchInterval: 10000,
    retry: false
  });

  // Threats
  const { data: threats, isLoading: threatsLoading, error: threatsError } = useQuery({
    queryKey: ['threats'],
    queryFn: async () => {
      const response = await fetch('/api/fl-ids/threats');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    refetchInterval: 10000,
    retry: false
  });

  // Optimized dashboard data queries with proper error handling
  // Dashboard metrics from real data
  const dashboardMetrics = useMemo(() => {
    return {
      threatCount: threats?.threats?.length || 0,
      incidentCount: 0, // Add real incident count if available
      systemHealth: performance?.system_health?.cpu_usage ? 'good' : 'unknown'
    };
  }, [threats, performance]);

  // Loading skeleton component for better UX
  const DashboardSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 bg-gray-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 bg-gray-800" />
          <Skeleton className="h-48 bg-gray-800" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 bg-gray-800" />
          <Skeleton className="h-32 bg-gray-800" />
        </div>
      </div>
    </div>
  );

  return (
    <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
      <ErrorBoundary>
        <div className={`flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-800 text-gray-100 ${theme === 'light' ? 'bg-white text-gray-900' : ''}`}>
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main id="main-content" className="flex-1 overflow-auto p-6" tabIndex={-1} aria-label="Main dashboard content">
              <div className="space-y-8">
                {/* Accessibility: Skip to Content */}
                <a href="#main-content" className="sr-only focus:not-sr-only absolute left-2 top-2 bg-blue-700 text-white px-3 py-1 rounded z-50">Skip to main content</a>
                {/* User Profile, System Status, Theme Toggle */}
                <div className="flex justify-end items-center gap-4 mb-2">
                  <button
                    aria-label="Toggle dark/light mode"
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                  <div className="relative">
                    <button onClick={() => setProfileOpen(v => !v)} className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 focus:outline-none">
                      <UserCircle className="w-6 h-6" />
                      <span className="font-semibold">Abhishek</span>
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 animate-fade-in">
                        <div className="px-4 py-2 text-gray-300">Signed in as <b>Abhishek</b></div>
                        <div className="border-t border-gray-700" />
                        <button className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-200" onClick={() => setProfileOpen(false)}>Close</button>
                      </div>
                    )}
                  </div>
                  {/* System Status Indicator */}
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${systemStatus.backend ? 'bg-green-500' : 'bg-red-500'}`} title="Backend" />
                    <span className={`w-3 h-3 rounded-full ${systemStatus.db ? 'bg-green-500' : 'bg-red-500'}`} title="Database" />
                    <span className={`w-3 h-3 rounded-full ${systemStatus.ws ? 'bg-green-500' : 'bg-yellow-500'}`} title="WebSocket" />
                  </div>
                </div>
                <ProjectInfoPanel />
                {/* Demo Data Button */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={async () => {
                      setDemoLoading(true);
                      try {
                        const res = await fetch('/api/fl-ids/demo-data', { method: 'POST' });
                        if (!res.ok) throw new Error('Failed to load demo data');
                        toast({ title: 'Demo data loaded!', variant: 'success' });
                      } catch (err) {
                        toast({ title: 'Demo data failed', description: String(err), variant: 'destructive' });
                      } finally {
                        setDemoLoading(false);
                      }
                    }}
                    className="bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2 rounded-lg shadow font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                    disabled={demoLoading}
                    aria-label="Load demo data"
                  >
                    {demoLoading ? <Loader2 className="inline w-4 h-4 mr-1 animate-spin" /> : null}
                    {demoLoading ? 'Loading Demo...' : 'Load Demo Data'}
                  </button>
                </div>
                {/* Onboarding Tooltip */}
                {showOnboarding && (
                  <div className="fixed top-24 right-8 z-50 bg-blue-900 text-white px-6 py-4 rounded-xl shadow-lg animate-fade-in" role="alert" aria-live="polite">
                    <b>Welcome!</b> Explore the dashboard, try <span className="underline">Help & Docs</span>, and use <span className="underline">Download Report</span> or <span className="underline">Load Demo Data</span> for a quick demo.
                  </div>
                )}
                {/* Download Report Button */}
                <div className="flex justify-end mb-4">
                  <button
                    aria-label="Download latest report"
                    onClick={async (e) => {
                      const btn = e.currentTarget;
                      btn.disabled = true;
                      btn.classList.add('animate-spin');
                      try {
                        const res = await fetch('/api/fl-ids/download-report');
                        if (!res.ok) throw new Error('Failed to download report');
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        // Try to infer file type
                        const contentType = res.headers.get('content-type');
                        a.download = contentType && contentType.includes('pdf') ? 'report.pdf' : 'report.csv';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        toast({ title: 'Download failed', description: String(err), variant: 'destructive' });
                      } finally {
                        btn.disabled = false;
                        btn.classList.remove('animate-spin');
                      }
                    }}
                    className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-lg shadow font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <Loader2 className="inline w-4 h-4 mr-1 animate-spin hidden" /> Download Report
                  </button>
                </div>
                {/* Floating Help & Docs Button */}
                <button
                  aria-label="Open help and documentation"
                  onClick={() => setHelpOpen(true)}
                  className="fixed bottom-8 right-8 z-40 bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-full shadow-lg font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                  style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.25)' }}
                >
                  Help & Docs
                </button>
                <HelpDocsModal open={helpOpen} onClose={() => setHelpOpen(false)} />
                {/* Show loading skeleton while data is being fetched */}
                {(flLoading || nodesLoading || perfLoading || threatsLoading) ? (
                  <DashboardSkeleton />
                ) : (
                  <>
                    {/* Metrics Overview with optimized rendering */}
                    <MemoizedMetricsOverview />
                    {/* Main Dashboard Grid with memoized components */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-8">
                        <MemoizedThreatActivity />
                        <MemoizedIncidentTable />
                      </div>
                      <div className="space-y-8">
                        <MemoizedSystemHealth />
                        <MemoizedAIInsights />
                      </div>
                    </div>
                    {/* Advanced Analytics with performance optimization */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      <MemoizedAttackPathVisualization />
                      <MemoizedFederatedLearningPanel />
                    </div>
                  </>
                )}
              </div>
            </main>
            {/* Footer with credits and version */}
            <footer className="w-full text-center py-4 text-xs text-gray-500 bg-transparent mt-8">
              AgisFL &copy; {new Date().getFullYear()} &mdash; Built by Abhishek Yadav. Version 1.0.0
            </footer>
          </div>
        </div>
      </ErrorBoundary>
    </ThemeContext.Provider>
  );
// Add global styles for fade-in and slide-up animations
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .animate-fade-in { animation: fadeIn 0.7s; }
    .animate-slide-up { animation: slideUp 0.5s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `;
  document.head.appendChild(style);
}
}