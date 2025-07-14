import { useEffect, useState, useMemo, memo } from "react";
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
  const { data: flStatus, isLoading: flLoading, error: flError } = useQuery({
    queryKey: ['fl-status'],
    queryFn: async () => {
      const response = await fetch('/api/fl/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
    placeholderData: {
      status: "active",
      round: 15,
      participants: 3,
      accuracy: 94.7,
      lastUpdate: new Date().toISOString()
    }
  });

  const { data: nodes, isLoading: nodesLoading, error: nodesError } = useQuery({
    queryKey: ['fl-nodes'],
    queryFn: async () => {
      const response = await fetch('/api/fl/nodes');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
    placeholderData: [
      { id: 1, name: "Node-Finance", status: "active", accuracy: 95.2, lastSeen: new Date() },
      { id: 2, name: "Node-HR", status: "active", accuracy: 93.8, lastSeen: new Date() },
      { id: 3, name: "Node-IT", status: "training", accuracy: 96.1, lastSeen: new Date() }
    ]
  });

  const { data: performance, isLoading: perfLoading, error: perfError } = useQuery({
    queryKey: ['fl-performance'],
    queryFn: async () => {
      const response = await fetch('/api/fl/performance');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
    placeholderData: {
      accuracy: 94.7,
      precision: 92.3,
      recall: 96.1,
      f1Score: 94.2,
      trainingTime: 45.2
    }
  });

  const { data: threats, isLoading: threatsLoading, error: threatsError } = useQuery({
    queryKey: ['threats'],
    queryFn: async () => {
      const response = await fetch('/api/threats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 15000,
    placeholderData: [
      {
        id: 1,
        title: "Suspicious Network Activity",
        severity: "High",
        description: "Unusual traffic patterns detected",
        timestamp: new Date().toISOString()
      }
    ]
  });

  // Optimized dashboard data queries with proper loading states
  const dashboardQueries = useQuery({
    queryKey: ['/api/dashboard/summary'],
    enabled: true,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
  });

  // Performance optimization: memoize expensive calculations
  const dashboardMetrics = useMemo(() => {
    if (!dashboardQueries.data) return null;
    return {
      threatCount: dashboardQueries.data.threats?.length || 0,
      incidentCount: dashboardQueries.data.incidents?.length || 0,
      systemHealth: dashboardQueries.data.health || 'unknown'
    };
  }, [dashboardQueries.data]);

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
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Show loading skeleton while data is being fetched */}
            {dashboardQueries.isLoading ? (
              <DashboardSkeleton />
            ) : (
              <>
                {/* Metrics Overview with optimized rendering */}
                <MemoizedMetricsOverview metrics={dashboardMetrics} />

                {/* Main Dashboard Grid with memoized components */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <MemoizedThreatActivity />
                    <MemoizedIncidentTable />
                  </div>
                  <div className="space-y-6">
                    <MemoizedSystemHealth />
                    <MemoizedAIInsights />
                  </div>
                </div>

                {/* Advanced Analytics with performance optimization */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <MemoizedAttackPathVisualization />
                  <MemoizedFederatedLearningPanel />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}