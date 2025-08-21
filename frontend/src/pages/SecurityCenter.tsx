import React from 'react';
import {
  Shield, AlertTriangle, Lock, Target, Settings, Eye, Search, X,
  BarChart, Calendar, Hash, Info, ListFilter
} from 'lucide-react';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { create } from 'zustand';

// 1. STATE MANAGEMENT (Zustand Store)
// ============================================================================
// Centralizes state logic, making it scalable and easier to manage across components.
// Avoids prop drilling and provides a single source of truth.

interface SecurityThreat {
  id: string;
  timestamp: string;
  threat_type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  source_ip: string;
  target_ip: string;
  description: string;
  status: 'ACTIVE' | 'MITIGATED' | 'INVESTIGATING';
  confidence_score: number;
  mitigation_action: string;
  protocol: string;
  payload_size: number;
}

interface SecurityMetrics {
  total_threats: number;
  active_threats: number;
  blocked_attacks: number;
  security_score: number;
  vulnerability_score: number;
  firewall_rules: number;
  ids_alerts: number;
  suspicious_ips: number;
}

interface SecurityState {
  threats: SecurityThreat[];
  metrics: SecurityMetrics | null;
  loading: boolean;
  error: string | null;
  selectedThreat: SecurityThreat | null;
  filters: {
    severity: string;
    status: string;
    searchTerm: string;
  };
  fetchSecurityData: () => Promise<void>;
  selectThreat: (threat: SecurityThreat | null) => void;
  setFilter: (filterName: keyof SecurityState['filters'], value: string) => void;
}

const useSecurityStore = create<SecurityState>((set, get) => ({
  threats: [],
  metrics: null,
  loading: true,
  error: null,
  selectedThreat: null,
  filters: {
    severity: 'all',
    status: 'all',
    searchTerm: '',
  },
  fetchSecurityData: async () => {
    set({ loading: true, error: null });
    try {
      // Mock API calls with a delay to simulate network latency
      await new Promise(res => setTimeout(res, 1000));

      // In a real app, you would fetch from your API endpoints
      // const metricsResponse = await fetch('/api/security/metrics');
      // const threatsResponse = await fetch('/api/security/threats');
      // if (!metricsResponse.ok || !threatsResponse.ok) {
      //   throw new Error('Failed to fetch security data');
      // }
      // const metricsData = await metricsResponse.json();
      // const threatsData = await threatsResponse.json();

      // Using enhanced fallback data for a richer demo
      const metricsData: SecurityMetrics = {
        total_threats: 178,
        active_threats: 18,
        blocked_attacks: 92,
        security_score: 89,
        vulnerability_score: 76,
        firewall_rules: 2540,
        ids_alerts: 312,
        suspicious_ips: 48
      };
      const threatsData: SecurityThreat[] = [
        { id: 'TH-001', timestamp: new Date(Date.now() - 3600000).toISOString(), threat_type: 'DDoS Attack', severity: 'HIGH', source_ip: '203.0.113.0/24', target_ip: '10.0.0.1', description: 'Distributed denial of service attack detected against primary web server.', status: 'MITIGATED', confidence_score: 98, mitigation_action: 'Activated Cloudflare DDoS protection and blocked source CIDR range.', protocol: 'UDP', payload_size: 1500 },
        { id: 'TH-002', timestamp: new Date().toISOString(), threat_type: 'Port Scan', severity: 'MEDIUM', source_ip: '198.51.100.12', target_ip: '10.0.0.50', description: 'Nmap scan detected targeting multiple common ports.', status: 'ACTIVE', confidence_score: 85, mitigation_action: 'IP temporarily blocked at firewall. Monitoring for further activity.', protocol: 'TCP', payload_size: 60 },
        { id: 'TH-003', timestamp: new Date(Date.now() - 7200000).toISOString(), threat_type: 'SQL Injection Attempt', severity: 'HIGH', source_ip: '192.0.2.200', target_ip: '10.0.1.10', description: 'Attempted SQL injection on login endpoint.', status: 'MITIGATED', confidence_score: 99, mitigation_action: 'WAF rule triggered and blocked the request. IP blacklisted.', protocol: 'HTTP', payload_size: 256 },
        { id: 'TH-004', timestamp: new Date(Date.now() - 900000).toISOString(), threat_type: 'Malware Beaconing', severity: 'MEDIUM', source_ip: '10.0.5.23', target_ip: 'malware-c2.badguy.net', description: 'Internal host beaconing to a known malware command and control server.', status: 'INVESTIGATING', confidence_score: 92, mitigation_action: 'Host quarantined. Incident response team notified.', protocol: 'DNS', payload_size: 78 },
        { id: 'TH-005', timestamp: new Date(Date.now() - 18000000).toISOString(), threat_type: 'Anomalous Login', severity: 'LOW', source_ip: '203.0.113.55', target_ip: 'auth.agisfl.com', description: 'Login from a new geographic location for user `admin`.', status: 'MITIGATED', confidence_score: 70, mitigation_action: 'Session terminated. User prompted for MFA verification.', protocol: 'HTTPS', payload_size: 1204 },
        { id: 'TH-006', timestamp: new Date(Date.now() - 86400000).toISOString(), threat_type: 'Outdated TLS Version', severity: 'LOW', source_ip: 'N/A', target_ip: '10.0.2.15', description: 'Server configured with deprecated TLS 1.0.', status: 'ACTIVE', confidence_score: 100, mitigation_action: 'Scheduled for patching in next maintenance window.', protocol: 'TLS', payload_size: 0 },
      ];

      set({ metrics: metricsData, threats: threatsData, loading: false });
    } catch (error) {
      const err = error as Error;
      console.error('Failed to fetch security data:', err);
      set({ error: err.message, loading: false });
    }
  },
  selectThreat: (threat) => set({ selectedThreat: threat }),
  setFilter: (filterName, value) => {
    set(state => ({
      filters: {
        ...state.filters,
        [filterName]: value,
      },
    }));
  },
}));

// 2. REUSABLE UI COMPONENTS
// ============================================================================
// Breaking the UI into smaller, focused components improves readability,
// reusability, and makes the codebase easier to maintain.

const MetricCard = ({ icon: Icon, title, value, colorClass }) => (
  <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/80 hover:border-blue-500/50 hover:bg-gray-800 transition-all duration-300 shadow-lg">
    <div className="flex items-center space-x-4">
      <div className={`p-3 rounded-lg bg-gray-700/50 ${colorClass}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const Badge = ({ text, colorClasses }) => (
  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${colorClasses}`}>
    {text}
  </span>
);

const getSeverityBadge = (severity: SecurityThreat['severity']) => {
  switch (severity) {
    case 'HIGH': return 'bg-red-600/20 text-red-400 border-red-500/30';
    case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
    case 'LOW': return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
    default: return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusBadge = (status: SecurityThreat['status']) => {
  switch (status) {
    case 'ACTIVE': return 'bg-red-600/20 text-red-400 border-red-500/30 animate-pulse';
    case 'MITIGATED': return 'bg-green-600/20 text-green-400 border-green-500/30';
    case 'INVESTIGATING': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
    default: return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
  }
};

const SkeletonLoader = () => (
    <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-24 bg-gray-800 rounded-xl"></div>
            <div className="h-24 bg-gray-800 rounded-xl"></div>
            <div className="h-24 bg-gray-800 rounded-xl"></div>
            <div className="h-24 bg-gray-800 rounded-xl"></div>
        </div>
        <div className="h-40 bg-gray-800 rounded-xl"></div>
        <div className="h-96 bg-gray-800 rounded-xl"></div>
    </div>
);


// 3. COMPONENT SECTIONS
// ============================================================================
// Each major part of the page is its own component for clarity.

const SecurityHeader = () => (
  <div className="flex items-center justify-between pb-4 border-b border-gray-700/50">
    <div>
      <h1 className="text-3xl font-bold text-white">Security Center</h1>
      <p className="text-gray-400 mt-1">Central hub for threat intelligence, monitoring, and response.</p>
    </div>
    <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg">
      <Settings className="w-5 h-5" />
      <span>Manage Settings</span>
    </button>
  </div>
);

const SecurityMetricsOverview = () => {
  const metrics = useSecurityStore((state) => state.metrics);
  if (!metrics) return null;

  const metricCards = [
    { icon: Shield, title: 'Security Score', value: `${metrics.security_score}%`, colorClass: 'text-blue-400' },
    { icon: AlertTriangle, title: 'Active Threats', value: metrics.active_threats, colorClass: 'text-red-400' },
    { icon: Lock, title: 'Blocked Attacks', value: metrics.blocked_attacks, colorClass: 'text-green-400' },
    { icon: Target, title: 'Vulnerability Score', value: `${metrics.vulnerability_score}%`, colorClass: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map(card => <MetricCard key={card.title} {...card} />)}
    </div>
  );
};

const ThreatDistributionChart = () => {
    const threats = useSecurityStore((state) => state.threats);
    const data = [
        { name: 'High', count: threats.filter(t => t.severity === 'HIGH').length, fill: '#F87171' },
        { name: 'Medium', count: threats.filter(t => t.severity === 'MEDIUM').length, fill: '#FBBF24' },
        { name: 'Low', count: threats.filter(t => t.severity === 'LOW').length, fill: '#60A5FA' },
    ];

    return (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/80">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><BarChart className="w-5 h-5 mr-2 text-gray-400"/>Threat Distribution by Severity</h3>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="name" stroke="#A0AEC0" />
                        <YAxis stroke="#A0AEC0" />
                        <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const ThreatFilters = () => {
  const { filters, setFilter } = useSecurityStore();

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/80">
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
        <div className="flex-grow w-full md:w-auto">
          <label className="relative text-gray-400 focus-within:text-gray-200 block">
            <Search className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-3" />
            <input
              type="text"
              placeholder="Search by IP, type, or description..."
              value={filters.searchTerm}
              onChange={(e) => setFilter('searchTerm', e.target.value)}
              className="bg-gray-700/50 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </label>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 mr-2">Severity:</label>
          <select value={filters.severity} onChange={(e) => setFilter('severity', e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 mr-2">Status:</label>
          <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="ACTIVE">Active</option>
            <option value="MITIGATED">Mitigated</option>
            <option value="INVESTIGATING">Investigating</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const ThreatsTable = () => {
  const { threats, filters, selectThreat } = useSecurityStore();

  const filteredThreats = threats.filter(threat => {
    const searchTermLower = filters.searchTerm.toLowerCase();
    return (
      (filters.severity === 'all' || threat.severity === filters.severity) &&
      (filters.status === 'all' || threat.status === filters.status) &&
      (filters.searchTerm === '' ||
        threat.threat_type.toLowerCase().includes(searchTermLower) ||
        threat.source_ip.toLowerCase().includes(searchTermLower) ||
        threat.description.toLowerCase().includes(searchTermLower))
    );
  });
  
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/80 overflow-hidden">
        <div className="px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center"><ListFilter className="w-5 h-5 mr-2 text-gray-400"/>Live Threat Feed</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-700/50">
                    <tr>
                        {['Timestamp', 'Threat Type', 'Severity', 'Source IP', 'Status', 'Confidence', 'Actions'].map(h => (
                            <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {filteredThreats.length > 0 ? filteredThreats.map((threat) => (
                        <tr key={threat.id} className="hover:bg-gray-700/30 transition-colors" onClick={() => selectThreat(threat)} style={{cursor: 'pointer'}}>
                            <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">{new Date(threat.timestamp).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-white font-medium">{threat.threat_type}</td>
                            <td className="px-6 py-4"><Badge text={threat.severity} colorClasses={getSeverityBadge(threat.severity)} /></td>
                            <td className="px-6 py-4 text-sm text-white font-mono">{threat.source_ip}</td>
                            <td className="px-6 py-4"><Badge text={threat.status} colorClasses={getStatusBadge(threat.status)} /></td>
                            <td className="px-6 py-4 text-sm text-gray-300">{threat.confidence_score}%</td>
                            <td className="px-6 py-4">
                                <button onClick={(e) => { e.stopPropagation(); selectThreat(threat); }} className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded-lg" title="View Details">
                                    <Eye className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={7} className="text-center py-12 text-gray-400">
                                <p>No threats match the current filters.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

const ThreatDetailModal = () => {
    const { selectedThreat, selectThreat } = useSecurityStore();
    if (!selectedThreat) return null;

    const detailItems = [
        { label: 'Threat ID', value: selectedThreat.id, icon: Hash },
        { label: 'Timestamp', value: new Date(selectedThreat.timestamp).toLocaleString(), icon: Calendar },
        { label: 'Threat Type', value: selectedThreat.threat_type, icon: AlertTriangle },
        { label: 'Severity', value: <Badge text={selectedThreat.severity} colorClasses={getSeverityBadge(selectedThreat.severity)} />, icon: Shield },
        { label: 'Source IP', value: selectedThreat.source_ip, icon: Target, mono: true },
        { label: 'Target IP', value: selectedThreat.target_ip, icon: Target, mono: true },
        { label: 'Status', value: <Badge text={selectedThreat.status} colorClasses={getStatusBadge(selectedThreat.status)} />, icon: Info },
        { label: 'Confidence Score', value: `${selectedThreat.confidence_score}%`, icon: Target },
        { label: 'Protocol', value: selectedThreat.protocol, icon: Info },
        { label: 'Payload Size', value: `${selectedThreat.payload_size} bytes`, icon: Info },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => selectThreat(null)}>
            <div className="bg-gray-800 rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <h3 className="text-2xl font-bold text-white flex items-center"><Info className="w-6 h-6 mr-3 text-blue-400"/>Threat Details</h3>
                    <button onClick={() => selectThreat(null)} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"><X /></button>
                </div>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {detailItems.map(item => (
                            <div key={item.label} className="flex items-start">
                                <item.icon className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0"/>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">{item.label}</label>
                                    <div className={`text-white text-base ${item.mono ? 'font-mono' : ''}`}>{item.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <p className="text-white bg-gray-700/50 p-3 rounded-lg">{selectedThreat.description}</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Mitigation Action</label>
                        <p className="text-white bg-gray-700/50 p-3 rounded-lg">{selectedThreat.mitigation_action}</p>
                    </div>
                    
                    <div className="flex space-x-4 pt-6">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">Take Action</button>
                        <button onClick={() => selectThreat(null)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// 4. MAIN PAGE COMPONENT
// ============================================================================
// This component now acts as a layout container, assembling the smaller
// pieces. The core logic is handled by the Zustand store.

const SecurityCenter: React.FC = () => {
  const { loading, error, fetchSecurityData } = useSecurityStore();

  React.useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-6">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Failed to Load Security Data</h2>
        <p className="text-gray-400">{error}</p>
        <button onClick={fetchSecurityData} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen font-sans">
        <div className="space-y-6">
            <SecurityHeader />
            <SecurityMetricsOverview />
            <ThreatDistributionChart />
            <ThreatFilters />
            <ThreatsTable />
        </div>
        <ThreatDetailModal />
    </div>
  );
};

export default SecurityCenter;
