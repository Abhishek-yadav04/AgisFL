import React, { useEffect, useMemo } from 'react';
import {
  Brain, Download, SlidersHorizontal, Search, X, Check, BarChart, Shield, Zap, ArrowUpDown, List, LayoutGrid, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { Toaster, toast } from 'react-hot-toast';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// 1. STATE MANAGEMENT (Zustand Store)
// ============================================================================
// Manages all state for the algorithm explorer, including data, filters,
// sorting, and UI state like the selected algorithm and view mode.

type AlgorithmStatus = "Production" | "Testing" | "Experimental";
type AlgorithmCategory = "Privacy" | "Efficiency" | "Robustness" | "General";

interface PerformanceMetrics {
  accuracy: number;
  convergence_rate: number;
  communication_efficiency: number;
  robustness: number;
  privacy_preservation: number;
}

interface Algorithm {
  id: string;
  name: string;
  description: string;
  status: AlgorithmStatus;
  category: AlgorithmCategory;
  version: string;
  performance_metrics: PerformanceMetrics;
}

interface AlgorithmState {
  algorithms: Algorithm[];
  loading: boolean;
  error: string | null;
  selectedAlgorithm: Algorithm | null;
  filters: {
    searchTerm: string;
    status: AlgorithmStatus | 'all';
  };
  sort: {
    key: keyof PerformanceMetrics | 'name';
    direction: 'asc' | 'desc';
  };
  viewMode: 'grid' | 'list';
  fetchAlgorithms: () => Promise<void>;
  selectAlgorithm: (algorithm: Algorithm | null) => void;
  setFilter: (filterName: keyof AlgorithmState['filters'], value: string) => void;
  setSort: (key: keyof PerformanceMetrics | 'name') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
}

// Mock API to simulate fetching algorithm data
const mockApi = {
  fetch: async (): Promise<Algorithm[]> => {
    await new Promise(res => setTimeout(res, 1500));
    if (Math.random() < 0.05) throw new Error("Failed to connect to Research API");
    return [
        { id: 'fedavg', name: 'Federated Averaging (FedAvg)', description: 'The foundational algorithm for FL, averaging model weights from clients.', status: 'Production', category: 'General', version: '1.0', performance_metrics: { accuracy: 0.85, convergence_rate: 0.7, communication_efficiency: 0.6, robustness: 0.5, privacy_preservation: 0.3 }},
        { id: 'fedprox', name: 'Federated Proximal (FedProx)', description: 'An extension of FedAvg that adds a proximal term to handle statistical heterogeneity across clients.', status: 'Production', category: 'Robustness', version: '1.2', performance_metrics: { accuracy: 0.87, convergence_rate: 0.65, communication_efficiency: 0.6, robustness: 0.8, privacy_preservation: 0.3 }},
        { id: 'fednova', name: 'Federated Nova (FedNova)', description: 'A normalized averaging method that improves fairness and handles non-IID data more effectively.', status: 'Testing', category: 'Robustness', version: '0.9', performance_metrics: { accuracy: 0.88, convergence_rate: 0.75, communication_efficiency: 0.65, robustness: 0.85, privacy_preservation: 0.4 }},
        { id: 'scaffold', name: 'SCAFFOLD', description: 'Corrects for client-drift using control variates, leading to faster convergence and better accuracy.', status: 'Testing', category: 'Efficiency', version: '1.1', performance_metrics: { accuracy: 0.90, convergence_rate: 0.9, communication_efficiency: 0.8, robustness: 0.7, privacy_preservation: 0.4 }},
        { id: 'dp-fedavg', name: 'DP-FedAvg', description: 'Integrates differential privacy into FedAvg by adding noise to client updates to provide formal privacy guarantees.', status: 'Production', category: 'Privacy', version: '1.3', performance_metrics: { accuracy: 0.82, convergence_rate: 0.6, communication_efficiency: 0.5, robustness: 0.6, privacy_preservation: 0.9 }},
        { id: 'fed-transformer', name: 'Federated Transformer', description: 'An experimental approach to train large-scale Transformer models in a federated setting for NLP tasks.', status: 'Experimental', category: 'General', version: '0.1', performance_metrics: { accuracy: 0.91, convergence_rate: 0.4, communication_efficiency: 0.2, robustness: 0.5, privacy_preservation: 0.3 }},
    ];
  }
};

const useAlgorithmStore = create<AlgorithmState>((set, get) => ({
  algorithms: [],
  loading: true,
  error: null,
  selectedAlgorithm: null,
  filters: { searchTerm: '', status: 'all' },
  sort: { key: 'accuracy', direction: 'desc' },
  viewMode: 'grid',
  fetchAlgorithms: async () => {
    set({ loading: true, error: null });
    try {
      const data = await mockApi.fetch();
      set({ algorithms: data, loading: false });
    } catch (e) {
      const err = e as Error;
      set({ error: err.message, loading: false });
    }
  },
  selectAlgorithm: (algorithm) => set({ selectedAlgorithm: algorithm }),
  setFilter: (filterName, value) => set(state => ({ filters: { ...state.filters, [filterName]: value } })),
  setSort: (key) => {
    const { sort } = get();
    const direction = sort.key === key && sort.direction === 'desc' ? 'asc' : 'desc';
    set({ sort: { key, direction } });
  },
  setViewMode: (mode) => set({ viewMode: mode }),
}));


// 2. REUSABLE UI & HELPER COMPONENTS
// ============================================================================

const getStatusBadge = (status: AlgorithmStatus) => {
  const styles = {
    Production: 'bg-green-600/20 text-green-400 border-green-500/30',
    Testing: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
    Experimental: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>{status}</span>;
};

const MetricBar = ({ label, value, color }) => (
    <div className="w-full">
        <div className="flex justify-between text-xs text-gray-300 mb-1"><span>{label}</span><span>{(value * 100).toFixed(0)}%</span></div>
        <div className="w-full bg-gray-700/50 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value * 100}%` }}></div></div>
    </div>
);

const SkeletonCard = () => (<div className="bg-gray-800/50 rounded-xl p-6 space-y-4 animate-pulse"><div className="flex justify-between items-center"><div className="h-5 bg-gray-700 rounded w-3/5"></div><div className="h-5 bg-gray-700 rounded w-1/4"></div></div><div className="h-12 bg-gray-700 rounded"></div><div className="space-y-3"><div className="h-4 bg-gray-700 rounded"></div><div className="h-4 bg-gray-700 rounded"></div></div></div>);


// 3. COMPONENT SECTIONS
// ============================================================================

const Header = () => (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white">FL Algorithm Research Hub</h1>
        <p className="text-gray-400 mt-1">Explore, compare, and evaluate federated learning algorithms.</p>
    </motion.div>
);

const Controls = () => {
    const { filters, setFilter, setViewMode, viewMode } = useAlgorithmStore();
    return (
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="relative w-full md:w-1/3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/><input type="text" placeholder="Search algorithms..." value={filters.searchTerm} onChange={e => setFilter('searchTerm', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"/></div>
            <div className="flex items-center space-x-3">
                <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value="all">All Statuses</option><option value="Production">Production</option><option value="Testing">Testing</option><option value="Experimental">Experimental</option></select>
                <div className="flex items-center bg-gray-800 rounded-lg p-1"><button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}><LayoutGrid className="w-5 h-5"/></button><button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}><List className="w-5 h-5"/></button></div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"><Download className="w-4 h-4"/><span>Export</span></button>
            </div>
        </div>
    );
};

const AlgorithmCard = ({ algorithm, onSelect }) => (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={onSelect} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/80 hover:border-blue-500/50 hover:bg-gray-800 transition-all duration-300 cursor-pointer flex flex-col justify-between">
        <div><div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-white">{algorithm.name}</h3>{getStatusBadge(algorithm.status)}</div><p className="text-sm text-gray-400 mb-6 line-clamp-2">{algorithm.description}</p></div>
        <div className="space-y-3"><MetricBar label="Accuracy" value={algorithm.performance_metrics.accuracy} color="bg-green-500"/><MetricBar label="Robustness" value={algorithm.performance_metrics.robustness} color="bg-blue-500"/><MetricBar label="Efficiency" value={algorithm.performance_metrics.communication_efficiency} color="bg-purple-500"/></div>
    </motion.div>
);

const AlgorithmListItem = ({ algorithm, onSelect, sortKey }) => {
    const metrics = [
        { key: 'accuracy', Icon: Check, color: 'text-green-400' },
        { key: 'robustness', Icon: Shield, color: 'text-blue-400' },
        { key: 'communication_efficiency', Icon: Zap, color: 'text-purple-400' },
        { key: 'privacy_preservation', Icon: Eye, color: 'text-yellow-400' },
    ];
    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} onClick={onSelect} className="flex items-center bg-gray-800/50 p-4 rounded-lg border border-gray-700/80 hover:bg-gray-800 transition-colors cursor-pointer">
            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4"><p className="font-semibold text-white">{algorithm.name}</p>{getStatusBadge(algorithm.status)}</div>
                {metrics.map(m => (
                    <div key={m.key} className={`col-span-2 flex items-center space-x-2 ${sortKey === m.key ? 'font-bold text-white' : 'text-gray-300'}`}>
                        <m.Icon className={`w-4 h-4 ${m.color}`}/><span>{(algorithm.performance_metrics[m.key as keyof PerformanceMetrics] * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const AlgorithmListHeader = () => {
    const { sort, setSort } = useAlgorithmStore();
    const headers = [
        { key: 'name', label: 'Algorithm', col: 'col-span-4' },
        { key: 'accuracy', label: 'Accuracy', col: 'col-span-2' },
        { key: 'robustness', label: 'Robustness', col: 'col-span-2' },
        { key: 'communication_efficiency', label: 'Efficiency', col: 'col-span-2' },
        { key: 'privacy_preservation', label: 'Privacy', col: 'col-span-2' },
    ];
    return (
        <div className="flex items-center p-4">
            <div className="flex-1 grid grid-cols-12 gap-4 items-center text-xs text-gray-400 uppercase font-bold">
                {headers.map(h => (
                    <div key={h.key} className={`${h.col} cursor-pointer hover:text-white`} onClick={() => setSort(h.key as any)}>
                        {h.label} {sort.key === h.key && <ArrowUpDown className="w-3 h-3 inline ml-1"/>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const AlgorithmDetailModal = () => {
    const { selectedAlgorithm, selectAlgorithm } = useAlgorithmStore();
    if (!selectedAlgorithm) return null;
    
    const radarData = Object.entries(selectedAlgorithm.performance_metrics).map(([name, value]) => ({
        subject: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: value * 100,
        fullMark: 100,
    }));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => selectAlgorithm(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-800 rounded-xl p-8 w-full max-w-4xl border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700"><h3 className="text-2xl font-bold text-white">{selectedAlgorithm.name}</h3><button onClick={() => selectAlgorithm(null)} className="text-gray-400 hover:text-white"><X /></button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6"><p className="text-gray-300">{selectedAlgorithm.description}</p><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-gray-400">Status</p>{getStatusBadge(selectedAlgorithm.status)}</div><div><p className="text-gray-400">Category</p><p className="font-semibold text-white">{selectedAlgorithm.category}</p></div><div><p className="text-gray-400">Version</p><p className="font-semibold text-white">{selectedAlgorithm.version}</p></div></div></div>
                    <div><h4 className="font-semibold text-white mb-4 text-center">Performance Profile</h4><ResponsiveContainer width="100%" height={300}><RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}><PolarGrid stroke="#4A5568"/><PolarAngleAxis dataKey="subject" stroke="#A0AEC0" tick={{ fontSize: 12 }}/><PolarRadiusAxis angle={30} domain={[0, 100]} stroke="none"/><Radar name={selectedAlgorithm.name} dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} /><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}/></RadarChart></ResponsiveContainer></div>
                </div>
            </motion.div>
        </div>
    );
};


// 4. MAIN PAGE COMPONENT
// ============================================================================
const FLAlgorithms: React.FC = () => {
  const { algorithms, loading, error, fetchAlgorithms, selectAlgorithm, selectedAlgorithm, filters, sort, viewMode } = useAlgorithmStore();

  useEffect(() => { fetchAlgorithms(); }, [fetchAlgorithms]);

  const filteredAndSorted = useMemo(() => {
    return algorithms
      .filter(a => 
        (a.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) || a.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) &&
        (filters.status === 'all' || a.status === filters.status)
      )
      .sort((a, b) => {
        const valA = sort.key === 'name' ? a.name : a.performance_metrics[sort.key as keyof PerformanceMetrics];
        const valB = sort.key === 'name' ? b.name : b.performance_metrics[sort.key as keyof PerformanceMetrics];
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [algorithms, filters, sort]);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen font-sans">
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }}/>
      <div className="space-y-8">
        <Header />
        <Controls />
        {error && <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}
        <AnimatePresence mode="wait">
            <motion.div key={viewMode}>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({length: 6}).map((_, i) => <SkeletonCard key={i} />)}</div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredAndSorted.map(alg => <AlgorithmCard key={alg.id} algorithm={alg} onSelect={() => selectAlgorithm(alg)} />)}</div>
                ) : (
                    <div className="space-y-3"><AlgorithmListHeader />{filteredAndSorted.map(alg => <AlgorithmListItem key={alg.id} algorithm={alg} onSelect={() => selectAlgorithm(alg)} sortKey={sort.key} />)}</div>
                )}
            </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence>{selectedAlgorithm && <AlgorithmDetailModal />}</AnimatePresence>
    </div>
  );
};

export default FLAlgorithms;
