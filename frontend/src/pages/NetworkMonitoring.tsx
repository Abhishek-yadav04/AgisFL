import React, { useEffect, useRef } from 'react';
import {
  Activity, Shield, AlertTriangle, Eye, Play, Pause, Settings, Download, Search, X,
  BarChart, PieChart as PieChartIcon, Server, Zap
} from 'lucide-react';
import {
  LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { create } from 'zustand';

// 1. STATE MANAGEMENT (Zustand Store)
// ============================================================================
// Centralizes state for network monitoring, enabling real-time updates and
// complex state logic to be managed cleanly.

interface NetworkPacket {
  id: string;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'HTTP';
  length: number;
  flags: string;
  suspicious_score: number;
  threat_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

interface NetworkStats {
  total_packets: number;
  suspicious_packets: number;
  bandwidth_utilization: number;
  active_connections: number;
  packet_loss: number;
  latency_ms: number;
  protocols: Record<string, number>;
}

interface NetworkState {
  packets: NetworkPacket[];
  stats: NetworkStats | null;
  historicalBandwidth: { time: string; usage: number }[];
  isMonitoring: boolean;
  loading: boolean;
  error: string | null;
  selectedPacket: NetworkPacket | null;
  filters: {
    protocol: string;
    threatLevel: string;
    searchTerm: string;
  };
  toggleMonitoring: () => void;
  fetchInitialData: () => Promise<void>;
  selectPacket: (packet: NetworkPacket | null) => void;
  setFilter: (filterName: keyof NetworkState['filters'], value: string) => void;
}

const useNetworkStore = create<NetworkState>((set, get) => ({
  packets: [],
  stats: null,
  historicalBandwidth: Array.from({ length: 20 }, (_, i) => ({ time: `${i}`, usage: 0 })),
  isMonitoring: false,
  loading: true,
  error: null,
  selectedPacket: null,
  filters: {
    protocol: 'all',
    threatLevel: 'all',
    searchTerm: '',
  },
  toggleMonitoring: () => set(state => ({ isMonitoring: !state.isMonitoring })),
  fetchInitialData: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(res => setTimeout(res, 1200));
      const initialStats: NetworkStats = {
        total_packets: 125830,
        suspicious_packets: 256,
        bandwidth_utilization: 45.2,
        active_connections: 450,
        packet_loss: 0.5,
        latency_ms: 15.3,
        protocols: { TCP: 65, UDP: 22, ICMP: 5, DNS: 8 }
      };
      const initialPackets: NetworkPacket[] = [
        { id: 'PKT-001', timestamp: new Date().toISOString(), source_ip: '192.168.1.105', destination_ip: '104.16.249.249', protocol: 'TCP', length: 1500, flags: 'SYN, ACK', suspicious_score: 10, threat_level: 'NONE' },
        { id: 'PKT-002', timestamp: new Date(Date.now() - 500).toISOString(), source_ip: '10.0.0.50', destination_ip: '8.8.8.8', protocol: 'DNS', length: 78, flags: 'QUERY', suspicious_score: 5, threat_level: 'NONE' },
        { id: 'PKT-003', timestamp: new Date(Date.now() - 1000).toISOString(), source_ip: '203.0.113.12', destination_ip: '10.0.0.1', protocol: 'UDP', length: 1024, flags: 'FRAG', suspicious_score: 75, threat_level: 'MEDIUM' },
      ];
      set({ stats: initialStats, packets: initialPackets, loading: false });
    } catch (error) {
      const err = error as Error;
      set({ error: err.message, loading: false });
    }
  },
  selectPacket: (packet) => set({ selectedPacket: packet }),
  setFilter: (filterName, value) => {
    set(state => ({
      filters: {
        ...state.filters,
        [filterName]: value,
      },
    }));
  },
}));


// 2. REUSABLE UI & HELPER COMPONENTS
// ============================================================================

const MetricCard = ({ icon: Icon, title, value, unit, colorClass }) => (
  <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/80 hover:border-blue-500/50 hover:bg-gray-800 transition-all duration-300 shadow-lg">
    <div className="flex items-center space-x-4">
      <div className={`p-3 rounded-lg bg-gray-700/50 ${colorClass}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value} <span className="text-lg text-gray-400">{unit}</span></p>
      </div>
    </div>
  </div>
);

const Badge = ({ text, colorClasses }) => (
  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${colorClasses}`}>
    {text}
  </span>
);

const getThreatBadge = (level: NetworkPacket['threat_level']) => {
  switch (level) {
    case 'HIGH': return 'bg-red-600/20 text-red-400 border-red-500/30';
    case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
    case 'LOW': return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
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
        <div className="h-64 bg-gray-800 rounded-xl"></div>
        <div className="h-96 bg-gray-800 rounded-xl"></div>
    </div>
);


// 3. COMPONENT SECTIONS
// ============================================================================

const NetworkHeader = () => {
  const { isMonitoring, toggleMonitoring } = useNetworkStore();
  
  return (
    <div className="flex items-center justify-between pb-4 border-b border-gray-700/50">
      <div>
        <h1 className="text-3xl font-bold text-white">Network Monitoring</h1>
        <p className="text-gray-400 mt-1 flex items-center">
          <span className={`mr-2 h-3 w-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
          {isMonitoring ? 'Live packet capture is active' : 'Monitoring is paused'}
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <button className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Download className="w-5 h-5" />
          <span>Export PCAP</span>
        </button>
        <button onClick={toggleMonitoring} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors w-44 justify-center ${isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
          {isMonitoring ? <><Pause className="w-5 h-5" /><span>Stop Capture</span></> : <><Play className="w-5 h-5" /><span>Start Capture</span></>}
        </button>
      </div>
    </div>
  );
};

const NetworkStatsOverview = () => {
  const stats = useNetworkStore((state) => state.stats);
  if (!stats) return null;

  const statCards = [
    { icon: Activity, title: 'Bandwidth', value: stats.bandwidth_utilization.toFixed(1), unit: '%', colorClass: 'text-purple-400' },
    { icon: AlertTriangle, title: 'Suspicious', value: stats.suspicious_packets.toLocaleString(), unit: 'pkts', colorClass: 'text-red-400' },
    { icon: Server, title: 'Connections', value: stats.active_connections.toLocaleString(), unit: '', colorClass: 'text-green-400' },
    { icon: Zap, title: 'Latency', value: stats.latency_ms.toFixed(1), unit: 'ms', colorClass: 'text-yellow-400' },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map(card => <MetricCard key={card.title} {...card} />)}
    </div>
  );
};

const RealTimeBandwidthChart = () => {
    const { historicalBandwidth, isMonitoring } = useNetworkStore();

    return (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/80 h-80">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><BarChart className="w-5 h-5 mr-2 text-gray-400"/>Real-Time Bandwidth Utilization (%)</h3>
            <ResponsiveContainer>
                <LineChart data={historicalBandwidth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                    <XAxis dataKey="time" stroke="#A0AEC0" tick={{ fontSize: 12 }}/>
                    <YAxis stroke="#A0AEC0" domain={[0, 100]}/>
                    <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                    <Legend />
                    <Line type="monotone" dataKey="usage" stroke="#8884d8" strokeWidth={2} dot={false} isAnimationActive={isMonitoring}/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const ProtocolDistributionChart = () => {
    const stats = useNetworkStore((state) => state.stats);
    if (!stats) return null;

    const data = Object.entries(stats.protocols).map(([name, value]) => ({ name, value }));
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/80 h-80">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><PieChartIcon className="w-5 h-5 mr-2 text-gray-400"/>Protocol Distribution</h3>
            <ResponsiveContainer>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};


const PacketFilters = () => {
  const { filters, setFilter } = useNetworkStore();

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/80">
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
        <div className="flex-grow w-full md:w-auto">
          <label className="relative text-gray-400 focus-within:text-gray-200 block">
            <Search className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-3" />
            <input type="text" placeholder="Search by IP, protocol, or flags..." value={filters.searchTerm} onChange={(e) => setFilter('searchTerm', e.target.value)} className="bg-gray-700/50 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </label>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 mr-2">Protocol:</label>
          <select value={filters.protocol} onChange={(e) => setFilter('protocol', e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="ICMP">ICMP</option>
            <option value="DNS">DNS</option>
            <option value="HTTP">HTTP</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 mr-2">Threat Level:</label>
          <select value={filters.threatLevel} onChange={(e) => setFilter('threatLevel', e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="NONE">None</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const PacketsTable = () => {
  const { packets, filters, selectPacket } = useNetworkStore();
  
  const filteredPackets = packets.filter(p => 
    (filters.protocol === 'all' || p.protocol === filters.protocol) &&
    (filters.threatLevel === 'all' || p.threat_level === filters.threatLevel) &&
    (filters.searchTerm === '' ||
      p.source_ip.includes(filters.searchTerm) ||
      p.destination_ip.includes(filters.searchTerm) ||
      p.protocol.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      p.flags.toLowerCase().includes(filters.searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/80 overflow-hidden">
        <div className="px-6 py-4"><h3 className="text-lg font-semibold text-white">Live Packet Feed</h3></div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-700/50">
                    <tr>
                        {['Timestamp', 'Source IP', 'Destination IP', 'Protocol', 'Length', 'Threat Level', 'Actions'].map(h => (
                            <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {filteredPackets.map(packet => (
                        <tr key={packet.id} className="hover:bg-gray-700/30 cursor-pointer" onClick={() => selectPacket(packet)}>
                            <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">{new Date(packet.timestamp).toLocaleTimeString()}</td>
                            <td className="px-6 py-4 text-sm text-white font-mono">{packet.source_ip}</td>
                            <td className="px-6 py-4 text-sm text-white font-mono">{packet.destination_ip}</td>
                            <td className="px-6 py-4 text-sm text-white">{packet.protocol}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{packet.length} bytes</td>
                            <td className="px-6 py-4"><Badge text={packet.threat_level} colorClasses={getThreatBadge(packet.threat_level)} /></td>
                            <td className="px-6 py-4">
                                <button onClick={(e) => { e.stopPropagation(); selectPacket(packet); }} className="p-1 text-blue-400 hover:text-blue-300" title="View Details"><Eye className="w-5 h-5" /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

const PacketDetailModal = () => {
    const { selectedPacket, selectPacket } = useNetworkStore();
    if (!selectedPacket) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => selectPacket(null)}>
            <div className="bg-gray-800 rounded-xl p-8 w-full max-w-2xl border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <h3 className="text-2xl font-bold text-white">Packet Details</h3>
                    <button onClick={() => selectPacket(null)} className="text-gray-400 hover:text-white"><X /></button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                        { label: 'Packet ID', value: selectedPacket.id },
                        { label: 'Timestamp', value: new Date(selectedPacket.timestamp).toLocaleString() },
                        { label: 'Source IP', value: selectedPacket.source_ip, mono: true },
                        { label: 'Destination IP', value: selectedPacket.destination_ip, mono: true },
                        { label: 'Protocol', value: selectedPacket.protocol },
                        { label: 'Length', value: `${selectedPacket.length} bytes` },
                        { label: 'Flags', value: selectedPacket.flags },
                        { label: 'Suspicious Score', value: `${selectedPacket.suspicious_score}%` },
                    ].map(item => (
                        <div key={item.label}>
                            <p className="text-gray-400">{item.label}</p>
                            <p className={`text-white ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                        </div>
                    ))}
                     <div>
                        <p className="text-gray-400">Threat Level</p>
                        <Badge text={selectedPacket.threat_level} colorClasses={getThreatBadge(selectedPacket.threat_level)} />
                    </div>
                </div>
            </div>
        </div>
    );
};


// 4. MAIN PAGE COMPONENT
// ============================================================================
const NetworkMonitoring: React.FC = () => {
  const { loading, error, isMonitoring, fetchInitialData } = useNetworkStore();
  const monitorInterval = useRef<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  
  useEffect(() => {
    if (isMonitoring) {
        monitorInterval.current = window.setInterval(() => {
            useNetworkStore.setState(state => {
                const newBwUsage = Math.random() * 20 + 40; // Simulate new bandwidth data
                const newHistorical = [...state.historicalBandwidth.slice(1), { time: new Date().toLocaleTimeString(), usage: newBwUsage }];
                const newPacket: NetworkPacket = {
                    id: `PKT-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    source_ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
                    destination_ip: `104.20.1.${Math.floor(Math.random() * 254) + 1}`,
                    protocol: ['TCP', 'UDP', 'ICMP', 'DNS'][Math.floor(Math.random() * 4)] as any,
                    length: Math.floor(Math.random() * 1400) + 60,
                    flags: 'PSH, ACK',
                    suspicious_score: Math.floor(Math.random() * 100),
                    threat_level: ['HIGH', 'MEDIUM', 'LOW', 'NONE'][Math.floor(Math.random() * 4)] as any,
                };

                return {
                    ...state,
                    stats: state.stats ? { ...state.stats, bandwidth_utilization: newBwUsage, total_packets: state.stats.total_packets + 1 } : state.stats,
                    historicalBandwidth: newHistorical,
                    packets: [newPacket, ...state.packets.slice(0, 49)], // Keep last 50 packets
                };
            });
        }, 2000);
    } else if (monitorInterval.current) {
        clearInterval(monitorInterval.current);
        monitorInterval.current = null;
    }

    return () => {
        if (monitorInterval.current) clearInterval(monitorInterval.current);
    };
}, [isMonitoring]);


  if (loading) return <SkeletonLoader />;
  if (error) return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen font-sans">
        <div className="space-y-6">
            <NetworkHeader />
            <NetworkStatsOverview />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RealTimeBandwidthChart />
                <ProtocolDistributionChart />
            </div>
            <PacketFilters />
            <PacketsTable />
        </div>
        <PacketDetailModal />
    </div>
  );
};

export default NetworkMonitoring;
