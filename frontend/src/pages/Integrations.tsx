import React, { useEffect, useState } from 'react';
import {
  Globe, CheckCircle, XCircle, AlertTriangle, RefreshCw, Settings, Activity,
  Network, Brain, Shield, BarChart3, Play, Pause, Eye, Zap, Server, Clock, List, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { Toaster, toast } from 'react-hot-toast';

// 1. STATE MANAGEMENT (Zustand Store)
// ============================================================================
// Centralizes all state and business logic for the integrations page.
// This includes data fetching, status management, and actions like starting/stopping services.

type IntegrationStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING';

interface Integration {
  id: string;
  name: string;
  type: 'Network' | 'Federated Learning' | 'IDS' | 'Visualization';
  status: IntegrationStatus;
  last_update: string;
  metrics: Record<string, string | number>;
  description: string;
  version: string;
  healthScore: number;
}

interface SummaryMetrics {
    total: number;
    active: number;
    errors: number;
    avgHealth: number;
}

interface IntegrationsState {
  integrations: Integration[];
  summary: SummaryMetrics;
  loading: boolean;
  error: string | null;
  selectedIntegration: Integration | null;
  viewMode: 'grid' | 'list';
  fetchIntegrations: () => Promise<void>;
  toggleIntegration: (id: string) => Promise<void>;
  selectIntegration: (integration: Integration | null) => void;
  refreshAll: () => Promise<void>;
  setViewMode: (mode: 'grid' | 'list') => void;
}

// Mock API interactions to simulate a real backend
const mockApi = {
  fetch: async (): Promise<Integration[]> => {
    await new Promise(res => setTimeout(res, 1200));
    // Simulate a potential API failure
    if (Math.random() < 0.05) throw new Error("API Connection Error");
    return [
      { id: 'scapy', name: 'Scapy Monitor', type: 'Network', status: 'INACTIVE', last_update: new Date(Date.now() - 3600000).toISOString(), metrics: { 'Packets Captured': '0', 'Suspicious Hits': 0 }, description: 'Real-time network packet capture and analysis using the powerful Scapy library. Essential for deep packet inspection.', version: '2.4.5', healthScore: 95 },
      { id: 'flower', name: 'Flower FL Server', type: 'Federated Learning', status: 'INACTIVE', last_update: new Date(Date.now() - 7200000).toISOString(), metrics: { 'Training Round': 0, 'Global Accuracy': '0.0%', 'Active Clients': 0 }, description: 'Distributed machine learning orchestration with the Flower framework. Enables privacy-preserving model training.', version: '1.5.0', healthScore: 98 },
      { id: 'suricata', name: 'Suricata IDS', type: 'IDS', status: 'ACTIVE', last_update: new Date().toISOString(), metrics: { 'New Alerts': 42, 'Rules Loaded': '25,104', 'Throughput': '1.2 Gbps' }, description: 'High-performance Intrusion Detection and Prevention System for real-time threat monitoring.', version: '6.0.8', healthScore: 99 },
      { id: 'grafana', name: 'Grafana Dashboards', type: 'Visualization', status: 'ACTIVE', last_update: new Date().toISOString(), metrics: { 'Active Dashboards': 8, 'Data Sources': 5, 'Uptime': '99.98%' }, description: 'Advanced data visualization and monitoring dashboards for all system metrics.', version: '9.3.2', healthScore: 100 },
    ];
  },
  toggle: async (currentStatus: IntegrationStatus): Promise<IntegrationStatus> => {
    await new Promise(res => setTimeout(res, 800));
    if (Math.random() < 0.1) throw new Error("Failed to toggle service");
    return currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  }
};

const useIntegrationsStore = create<IntegrationsState>((set, get) => ({
  integrations: [],
  summary: { total: 0, active: 0, errors: 0, avgHealth: 0 },
  loading: true,
  error: null,
  selectedIntegration: null,
  viewMode: 'grid',
  fetchIntegrations: async () => {
    set({ loading: true, error: null });
    try {
      const data = await mockApi.fetch();
      const summary: SummaryMetrics = {
          total: data.length,
          active: data.filter(i => i.status === 'ACTIVE').length,
          errors: data.filter(i => i.status === 'ERROR').length,
          avgHealth: data.reduce((acc, i) => acc + i.healthScore, 0) / data.length || 0,
      };
      set({ integrations: data, summary, loading: false });
    } catch (e) {
      const err = e as Error;
      set({ error: err.message || 'Failed to fetch integration data.', loading: false });
    }
  },
  toggleIntegration: async (id: string) => {
    const integration = get().integrations.find(i => i.id === id);
    if (!integration || integration.status === 'PENDING') return;

    set(state => ({ integrations: state.integrations.map(i => i.id === id ? { ...i, status: 'PENDING' } : i) }));
    const toastId = toast.loading(`Toggling ${integration.name}...`);

    try {
      const newStatus = await mockApi.toggle(integration.status);
      set(state => ({
        integrations: state.integrations.map(i => i.id === id ? { ...i, status: newStatus, last_update: new Date().toISOString() } : i)
      }));
      toast.success(`${integration.name} is now ${newStatus.toLowerCase()}.`, { id: toastId });
    } catch (e) {
      toast.error(`Failed to toggle ${integration.name}.`, { id: toastId });
      set(state => ({ integrations: state.integrations.map(i => i.id === id ? { ...i, status: 'ERROR' } : i) }));
    }
  },
  selectIntegration: (integration) => set({ selectedIntegration: integration }),
  refreshAll: async () => {
    const toastId = toast.loading('Refreshing all integrations...');
    await get().fetchIntegrations();
    toast.success('Integrations refreshed.', { id: toastId });
  },
  setViewMode: (mode) => set({ viewMode: mode }),
}));


// 2. REUSABLE UI & HELPER COMPONENTS
// ============================================================================

const getStatusInfo = (status: IntegrationStatus) => {
  switch (status) {
    case 'ACTIVE': return { Icon: CheckCircle, color: 'text-green-500', text: 'Active' };
    case 'INACTIVE': return { Icon: XCircle, color: 'text-gray-500', text: 'Inactive' };
    case 'ERROR': return { Icon: AlertTriangle, color: 'text-red-500', text: 'Error' };
    case 'PENDING': return { Icon: RefreshCw, color: 'text-yellow-500 animate-spin', text: 'Pending' };
    default: return { Icon: AlertTriangle, color: 'text-gray-500', text: 'Unknown' };
  }
};

const getIntegrationIcon = (type: Integration['type']) => {
  const icons = { 'Network': Network, 'Federated Learning': Brain, 'IDS': Shield, 'Visualization': BarChart3 };
  return icons[type] || Globe;
};

const SummaryCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/80 flex items-center space-x-4">
        <div className={`p-3 rounded-lg bg-gray-700/50 ${color}`}><Icon className="w-7 h-7" /></div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const SkeletonCard = () => (
    <div className="bg-gray-800/50 rounded-2xl p-6 space-y-4 animate-pulse">
        <div className="flex items-center space-x-3"><div className="w-12 h-12 bg-gray-700 rounded-xl"></div><div className="flex-1 space-y-2"><div className="h-4 bg-gray-700 rounded w-3/4"></div><div className="h-3 bg-gray-700 rounded w-1/2"></div></div></div>
        <div className="h-4 bg-gray-700 rounded w-full"></div><div className="h-4 bg-gray-700 rounded w-2/3"></div><div className="h-10 bg-gray-700 rounded-lg"></div>
    </div>
);


// 3. COMPONENT SECTIONS
// ============================================================================

const IntegrationsHeader = () => {
  const { refreshAll, setViewMode, viewMode } = useIntegrationsStore();
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
      <div><h1 className="text-3xl font-bold text-white">System Integrations</h1><p className="text-gray-400 mt-1">Manage connections to external monitoring and analysis tools.</p></div>
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-gray-800 rounded-lg p-1"><button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}><LayoutGrid className="w-5 h-5"/></button><button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}><List className="w-5 h-5"/></button></div>
        <button onClick={refreshAll} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"><RefreshCw className="w-4 h-4" /><span>Refresh</span></button>
        <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"><Settings className="w-4 h-4" /><span>Configure</span></button>
      </div>
    </motion.div>
  );
};

const SummaryMetrics = () => {
    const { summary, loading } = useIntegrationsStore();
    if (loading) return <div className="grid grid-cols-4 gap-6"><div className="h-24 bg-gray-800 rounded-xl animate-pulse col-span-4"></div></div>;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard icon={Globe} title="Total Integrations" value={summary.total} color="text-blue-400" />
            <SummaryCard icon={Zap} title="Active Services" value={summary.active} color="text-green-400" />
            <SummaryCard icon={AlertTriangle} title="Service Errors" value={summary.errors} color="text-red-400" />
            <SummaryCard icon={Activity} title="Average Health" value={`${summary.avgHealth.toFixed(1)}%`} color="text-purple-400" />
        </div>
    );
};

const IntegrationCard = ({ integration, onToggle, onSelect }) => {
  const { Icon: StatusIcon, color: statusColor, text: statusText } = getStatusInfo(integration.status);
  const Icon = getIntegrationIcon(integration.type);
  const cardColors = { Network: 'from-blue-500 to-cyan-500', 'Federated Learning': 'from-purple-500 to-pink-500', IDS: 'from-red-500 to-orange-500', Visualization: 'from-green-500 to-teal-500' };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`bg-gradient-to-br ${cardColors[integration.type]} rounded-2xl p-6 text-white shadow-lg flex flex-col`}>
      <div className="flex items-start justify-between mb-4"><div className="flex items-center space-x-3"><div className="p-3 bg-white/10 rounded-xl"><Icon className="w-6 h-6" /></div><div><h3 className="font-bold">{integration.name}</h3><p className="text-xs opacity-80">{integration.type}</p></div></div><div className="flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full bg-white/10"><StatusIcon className={`w-4 h-4 ${statusColor}`} /><span>{statusText}</span></div></div>
      <div className="space-y-2 text-sm flex-grow">{Object.entries(integration.metrics).map(([key, value]) => (<div key={key} className="flex justify-between items-center"><span className="opacity-80">{key}</span><span className="font-semibold">{value}</span></div>))}</div>
      <div className="flex space-x-2 mt-6"><button onClick={onToggle} className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium flex items-center justify-center space-x-2 disabled:opacity-50" disabled={integration.status === 'PENDING'}>{integration.status === 'ACTIVE' ? <><Pause className="w-4 h-4"/><span>Stop</span></> : <><Play className="w-4 h-4"/><span>Start</span></>}</button><button onClick={onSelect} className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium flex items-center justify-center space-x-2"><Eye className="w-4 h-4" /><span>Details</span></button></div>
    </motion.div>
  );
};

const IntegrationListItem = ({ integration, onToggle, onSelect }) => {
    const { Icon: StatusIcon, color: statusColor, text: statusText } = getStatusInfo(integration.status);
    const Icon = getIntegrationIcon(integration.type);
    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center bg-gray-800/50 p-4 rounded-lg border border-gray-700/80 hover:bg-gray-800 transition-colors">
            <div className="p-3 bg-gray-700/50 rounded-lg mr-4"><Icon className="w-6 h-6 text-blue-400"/></div>
            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3"><p className="font-semibold text-white">{integration.name}</p><p className="text-xs text-gray-400">{integration.type}</p></div>
                <div className="col-span-2 flex items-center space-x-2"><StatusIcon className={`w-5 h-5 ${statusColor}`}/><span>{statusText}</span></div>
                <div className="col-span-2 text-sm text-gray-300"><Clock className="w-4 h-4 inline mr-2"/>{new Date(integration.last_update).toLocaleTimeString()}</div>
                <div className="col-span-3 text-sm text-gray-300">{Object.entries(integration.metrics).map(([k,v]) => `${k}: ${v}`).join(', ')}</div>
                <div className="col-span-2 flex justify-end space-x-2">
                    <button onClick={onToggle} className="p-2 bg-gray-700 hover:bg-blue-600 rounded-md disabled:opacity-50" disabled={integration.status === 'PENDING'}>{integration.status === 'ACTIVE' ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}</button>
                    <button onClick={onSelect} className="p-2 bg-gray-700 hover:bg-blue-600 rounded-md"><Eye className="w-4 h-4"/></button>
                </div>
            </div>
        </motion.div>
    );
};

const IntegrationDetailModal = () => {
    const { selectedIntegration, selectIntegration } = useIntegrationsStore();
    if (!selectedIntegration) return null;
    const { Icon: StatusIcon, color: statusColor, text: statusText } = getStatusInfo(selectedIntegration.status);
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => selectIntegration(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-800 rounded-xl p-8 w-full max-w-2xl border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700"><h3 className="text-2xl font-bold text-white">{selectedIntegration.name}</h3><button onClick={() => selectIntegration(null)} className="text-gray-400 hover:text-white"><X /></button></div>
                <div className="space-y-6"><p className="text-gray-300">{selectedIntegration.description}</p><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-gray-400">Status</p><div className={`flex items-center space-x-2 font-semibold ${statusColor}`}><StatusIcon className="w-5 h-5"/><span>{statusText}</span></div></div><div><p className="text-gray-400">Type</p><p className="text-white font-semibold">{selectedIntegration.type}</p></div><div><p className="text-gray-400">Version</p><p className="text-white font-semibold">{selectedIntegration.version}</p></div><div><p className="text-gray-400">Health Score</p><p className="text-white font-semibold">{selectedIntegration.healthScore}%</p></div><div><p className="text-gray-400">Last Update</p><p className="text-white font-semibold">{new Date(selectedIntegration.last_update).toLocaleString()}</p></div>{Object.entries(selectedIntegration.metrics).map(([key, value]) => (<div key={key}><p className="text-gray-400">{key}</p><p className="text-white font-semibold">{value}</p></div>))}</div></div>
            </motion.div>
        </div>
    );
};


// 4. MAIN PAGE COMPONENT
// ============================================================================
const Integrations: React.FC = () => {
  const { integrations, loading, error, fetchIntegrations, toggleIntegration, selectIntegration, selectedIntegration, viewMode } = useIntegrationsStore();

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen font-sans">
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }}/>
      <div className="space-y-8">
        <IntegrationsHeader />
        <SummaryMetrics />
        
        <AnimatePresence mode="wait">
            <motion.div key={viewMode}>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({length: 4}).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {integrations.map(integration => <IntegrationCard key={integration.id} integration={integration} onToggle={() => toggleIntegration(integration.id)} onSelect={() => selectIntegration(integration)} />)}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {integrations.map(integration => <IntegrationListItem key={integration.id} integration={integration} onToggle={() => toggleIntegration(integration.id)} onSelect={() => selectIntegration(integration)} />)}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>

        {error && <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}
      </div>
      <AnimatePresence>{selectedIntegration && <IntegrationDetailModal />}</AnimatePresence>
    </div>
  );
};

export default Integrations;
