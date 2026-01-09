import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Globe, Link, Eye, MessageCircle, Search, Activity
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

interface Federation {
  federation_id: string;
  name: string;
  organization: string;
  description: string;
  capabilities: string[];
  regions: string[];
  endpoint_url: string;
  last_seen: string;
  alliance_status: string;
  alliance_id?: string;
}

interface Alliance {
  alliance_id: string;
  alliance_name: string;
  status: string;
  federation_count: number;
  active_projects: number;
  created_at: string;
  last_activity: string;
}

interface CrossFederationProject {
  project_id: string;
  project_name: string;
  coordinator_federation_id: string;
  participating_federations: string[];
  alliance_id: string;
  aggregation_strategy: string;
  status: string;
  created_at: string;
}

interface NetworkTopology {
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    organization: string;
    status: string;
    capabilities?: string[];
    regions?: string[];
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    alliance_id?: string;
    alliance_name?: string;
    project_id?: string;
    project_name?: string;
    status?: string;
  }>;
  total_federations: number;
  total_alliances: number;
  total_projects: number;
}

const AlliancePage: React.FC = () => {
  const [federations, setFederations] = useState<Federation[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [projects, setProjects] = useState<CrossFederationProject[]>([]);
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  const [activeTab, setActiveTab] = useState<'discovery' | 'alliances' | 'projects' | 'network'>('discovery');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFederation, setSelectedFederation] = useState<Federation | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    target_federation_id: '',
    alliance_name: '',
    governance_rules: {}
  });
  const [selectedAlliance, setSelectedAlliance] = useState<Alliance | null>(null);
  const [showAllianceModal, setShowAllianceModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CrossFederationProject | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  
  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket('/api/alliance/ws');

  useEffect(() => {
    loadAllianceData();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  const loadAllianceData = async () => {
    try {
      setLoading(true);
      
      // Load discovered federations
      const federationsResponse = await fetch('/api/alliance/federation/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const federationsData = await federationsResponse.json();
      const federations = federationsData.federations || [];
      
      // Load alliances
      const alliancesResponse = await fetch('/api/alliance/alliances');
      const alliancesData = await alliancesResponse.json();
      const alliances = alliancesData.alliances || [];
      
      // Load cross-federation projects
      const projectsResponse = await fetch('/api/alliance/projects');
      const projectsData = await projectsResponse.json();
      const projects = projectsData.projects || [];
      
      // Load network topology
      const topologyResponse = await fetch('/api/alliance/network/topology');
      const topologyData = await topologyResponse.json();
      
      // If no data from API, load fallback data
      if (federations.length === 0 && alliances.length === 0 && projects.length === 0) {
        loadFallbackData();
      } else {
        setFederations(federations);
        setAlliances(alliances);
        setProjects(projects);
        setTopology(topologyData);
      }
      
    } catch (error) {
      console.error('Failed to load alliance data:', error);
      // Load fallback data
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    // Fallback data for when APIs are not available
    const fallbackFederations: Federation[] = [
      {
        federation_id: "fed_healthcare_global",
        name: "Global Healthcare Federation",
        organization: "World Health Organization",
        description: "International federation focused on healthcare AI research and medical data analysis. Specializing in disease prediction and treatment optimization.",
        capabilities: ["fedavg", "fedprox", "fednova", "differential_privacy"],
        regions: ["North America", "Europe", "Asia"],
        endpoint_url: "https://healthcare-fed.who.int/api",
        last_seen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        alliance_status: "none"
      },
      {
        federation_id: "fed_finance_secure",
        name: "Secure Finance Network",
        organization: "Global Banking Consortium",
        description: "Secure federated learning network for financial institutions. Focus on fraud detection, risk assessment, and algorithmic trading.",
        capabilities: ["fedavg", "secure_aggregation", "homomorphic_encryption"],
        regions: ["North America", "Europe", "Asia Pacific"],
        endpoint_url: "https://finance-fed.banking.org/api",
        last_seen: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        alliance_status: "none"
      },
      {
        federation_id: "fed_autonomous_vehicles",
        name: "Autonomous Vehicle Alliance",
        organization: "International Auto Consortium",
        description: "Federation of automotive companies working on autonomous vehicle technology through federated learning.",
        capabilities: ["fedavg", "fedprox", "fednova", "real_time_fl"],
        regions: ["North America", "Europe", "Asia"],
        endpoint_url: "https://auto-fed.consortium.org/api",
        last_seen: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        alliance_status: "none"
      },
      {
        federation_id: "fed_research_university",
        name: "Academic Research Network",
        organization: "International University Consortium",
        description: "Network of leading universities collaborating on AI research through federated learning approaches.",
        capabilities: ["fedavg", "fedprox", "fednova", "meta_learning"],
        regions: ["Europe", "North America", "Asia"],
        endpoint_url: "https://research-fed.universities.edu/api",
        last_seen: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        alliance_status: "none"
      },
      {
        federation_id: "fed_iot_devices",
        name: "IoT Device Federation",
        organization: "Global IoT Alliance",
        description: "Federation focused on IoT device intelligence, edge computing, and distributed sensor networks.",
        capabilities: ["fedavg", "edge_computing", "real_time_fl"],
        regions: ["Global"],
        endpoint_url: "https://iot-fed.alliance.org/api",
        last_seen: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        alliance_status: "none"
      },
      {
        federation_id: "fed_government_secure",
        name: "Government Security Network",
        organization: "National Security Agency",
        description: "Secure federation for government agencies working on cybersecurity and threat detection.",
        capabilities: ["fedavg", "secure_aggregation", "homomorphic_encryption", "differential_privacy"],
        regions: ["North America", "Europe"],
        endpoint_url: "https://gov-fed.security.gov/api",
        last_seen: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        alliance_status: "none"
      }
    ];

    const fallbackAlliances: Alliance[] = [
      {
        alliance_id: "alliance_health_finance",
        alliance_name: "Healthcare-Finance Security Alliance",
        status: "active",
        federation_count: 2,
        active_projects: 3,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        alliance_id: "alliance_auto_research",
        alliance_name: "Autonomous Research Consortium",
        status: "active",
        federation_count: 3,
        active_projects: 5,
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ];

    const fallbackProjects: CrossFederationProject[] = [
      {
        project_id: "cross_health_ai_001",
        project_name: "Global Health AI Initiative",
        coordinator_federation_id: "fed_healthcare_global",
        participating_federations: ["fed_healthcare_global", "fed_research_university", "fed_government_secure"],
        alliance_id: "alliance_health_finance",
        aggregation_strategy: "hierarchical_fedavg",
        status: "active",
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        project_id: "cross_auto_iot_001",
        project_name: "Connected Autonomous Systems",
        coordinator_federation_id: "fed_autonomous_vehicles",
        participating_federations: ["fed_autonomous_vehicles", "fed_iot_devices", "fed_research_university"],
        alliance_id: "alliance_auto_research",
        aggregation_strategy: "fedprox",
        status: "active",
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        project_id: "cross_finance_security_001",
        project_name: "Financial Threat Intelligence",
        coordinator_federation_id: "fed_finance_secure",
        participating_federations: ["fed_finance_secure", "fed_government_secure"],
        alliance_id: "alliance_health_finance",
        aggregation_strategy: "secure_aggregation",
        status: "initializing",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const fallbackTopology: NetworkTopology = {
      nodes: [
        {
          id: "fed_healthcare_global",
          name: "Global Healthcare Federation",
          type: "federation",
          organization: "World Health Organization",
          status: "active",
          capabilities: ["fedavg", "fedprox", "fednova", "differential_privacy"],
          regions: ["North America", "Europe", "Asia"]
        },
        {
          id: "fed_finance_secure",
          name: "Secure Finance Network",
          type: "federation",
          organization: "Global Banking Consortium",
          status: "active",
          capabilities: ["fedavg", "secure_aggregation", "homomorphic_encryption"],
          regions: ["North America", "Europe", "Asia Pacific"]
        },
        {
          id: "fed_autonomous_vehicles",
          name: "Autonomous Vehicle Alliance",
          type: "federation",
          organization: "International Auto Consortium",
          status: "active",
          capabilities: ["fedavg", "fedprox", "fednova", "real_time_fl"],
          regions: ["North America", "Europe", "Asia"]
        },
        {
          id: "fed_research_university",
          name: "Academic Research Network",
          type: "federation",
          organization: "International University Consortium",
          status: "active",
          capabilities: ["fedavg", "fedprox", "fednova", "meta_learning"],
          regions: ["Europe", "North America", "Asia"]
        },
        {
          id: "fed_iot_devices",
          name: "IoT Device Federation",
          type: "federation",
          organization: "Global IoT Alliance",
          status: "active",
          capabilities: ["fedavg", "edge_computing", "real_time_fl"],
          regions: ["Global"]
        },
        {
          id: "fed_government_secure",
          name: "Government Security Network",
          type: "federation",
          organization: "National Security Agency",
          status: "active",
          capabilities: ["fedavg", "secure_aggregation", "homomorphic_encryption", "differential_privacy"],
          regions: ["North America", "Europe"]
        }
      ],
      edges: [
        {
          source: "fed_healthcare_global",
          target: "fed_finance_secure",
          type: "alliance",
          alliance_id: "alliance_health_finance",
          alliance_name: "Healthcare-Finance Security Alliance",
          status: "active"
        },
        {
          source: "fed_healthcare_global",
          target: "fed_research_university",
          type: "project",
          project_id: "cross_health_ai_001",
          project_name: "Global Health AI Initiative"
        },
        {
          source: "fed_autonomous_vehicles",
          target: "fed_iot_devices",
          type: "alliance",
          alliance_id: "alliance_auto_research",
          alliance_name: "Autonomous Research Consortium",
          status: "active"
        },
        {
          source: "fed_finance_secure",
          target: "fed_government_secure",
          type: "alliance",
          alliance_id: "alliance_health_finance",
          alliance_name: "Healthcare-Finance Security Alliance",
          status: "active"
        }
      ],
      total_federations: 6,
      total_alliances: 2,
      total_projects: 3
    };

    setFederations(fallbackFederations);
    setAlliances(fallbackAlliances);
    setProjects(fallbackProjects);
    setTopology(fallbackTopology);
  };

  const handleWebSocketMessage = (message: any) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'alliance_proposed':
        case 'alliance_accepted':
        case 'federation_registered':
        case 'cross_federation_project_created':
          loadAllianceData(); // Refresh all data
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };

  const proposeAlliance = async (targetFederationId: string, allianceName: string) => {
    try {
      const response = await fetch('/api/alliance/alliances/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_federation_id: targetFederationId,
          alliance_name: allianceName,
          governance_rules: {
            decision_making: "consensus",
            privacy_requirements: { differential_privacy: true }
          }
        })
      });
      
      if (response.ok) {
        alert('Alliance proposal sent successfully!');
        setShowProposalModal(false);
        loadAllianceData();
      }
    } catch (error) {
      console.error('Failed to propose alliance:', error);
      alert('Failed to send alliance proposal');
    }
  };

  const filteredFederations = federations.filter(federation =>
    federation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    federation.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading alliance network...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <Network className="h-12 w-12 text-blue-400 mr-4" />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Data Alliance Mesh
            </h1>
          </div>
          <p className="text-xl text-indigo-300 max-w-3xl mx-auto">
            Build the network of networks. Connect with other federations to tackle global-scale 
            federated learning challenges through secure, collaborative partnerships.
          </p>
        </motion.div>

        {/* Connection Status */}
        <div className="flex items-center justify-center mb-6">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
            isConnected ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className={`text-sm ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
              {isConnected ? 'Alliance mesh active' : 'Alliance mesh offline'}
            </span>
          </div>
        </div>

        {/* Network Summary */}
        {topology && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-xl p-6 border border-blue-500/30">
              <Globe className="h-8 w-8 text-blue-400 mb-3" />
              <h3 className="text-2xl font-bold text-white">{topology.total_federations}</h3>
              <p className="text-blue-300 text-sm">Known Federations</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
              <Link className="h-8 w-8 text-purple-400 mb-3" />
              <h3 className="text-2xl font-bold text-white">{topology.total_alliances}</h3>
              <p className="text-purple-300 text-sm">Active Alliances</p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-xl p-6 border border-emerald-500/30">
              <Activity className="h-8 w-8 text-emerald-400 mb-3" />
              <h3 className="text-2xl font-bold text-white">{topology.total_projects}</h3>
              <p className="text-emerald-300 text-sm">Cross-Fed Projects</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-xl p-6 border border-orange-500/30">
              <Network className="h-8 w-8 text-orange-400 mb-3" />
              <h3 className="text-2xl font-bold text-white">
                {((2 * topology.total_alliances) / (topology.total_federations * (topology.total_federations - 1)) * 100).toFixed(1)}%
              </h3>
              <p className="text-orange-300 text-sm">Network Density</p>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-900/30 rounded-xl p-2">
          {[
            { id: 'discovery', label: 'Federation Discovery', icon: Globe },
            { id: 'alliances', label: 'My Alliances', icon: Link },
            { id: 'projects', label: 'Cross-Fed Projects', icon: Activity },
            { id: 'network', label: 'Network View', icon: Network }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-indigo-300 hover:text-white hover:bg-indigo-700/30'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'discovery' && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Search Bar */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search federations by name or organization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                
                <button
                  onClick={() => loadAllianceData()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Refresh Discovery
                </button>
              </div>

              {/* Federation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFederations.map((federation) => (
                  <motion.div
                    key={federation.federation_id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-xl p-6 border border-gray-700/50 hover:border-indigo-500/50 transition-all cursor-pointer"
                    onClick={() => setSelectedFederation(federation)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-white truncate">{federation.name}</h3>
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        federation.alliance_status === 'active' ? 'bg-green-900/50 text-green-300' :
                        federation.alliance_status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-gray-900/50 text-gray-300'
                      }`}>
                        {federation.alliance_status === 'none' ? 'Available' : federation.alliance_status}
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4">{federation.organization}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-400 text-sm">Capabilities:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {federation.capabilities.slice(0, 3).map((cap, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-indigo-900/50 text-indigo-300 rounded">
                              {cap}
                            </span>
                          ))}
                          {federation.capabilities.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-900/50 text-gray-300 rounded">
                              +{federation.capabilities.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Regions:</span>
                        <span className="text-white">{federation.regions.join(', ')}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Last Seen:</span>
                        <span className="text-green-400">
                          {new Date(federation.last_seen).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFederation(federation);
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Details</span>
                      </button>
                      
                      {federation.alliance_status === 'none' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProposalForm({
                              target_federation_id: federation.federation_id,
                              alliance_name: `Alliance with ${federation.name}`,
                              governance_rules: {}
                            });
                            setShowProposalModal(true);
                          }}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Propose</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {filteredFederations.length === 0 && (
                <div className="text-center py-12">
                  <Globe className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No federations found</h3>
                  <p className="text-gray-400">Try adjusting your search or refresh discovery</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'alliances' && (
            <motion.div
              key="alliances"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {alliances.map((alliance) => (
                  <div key={alliance.alliance_id} className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{alliance.alliance_name}</h3>
                      <div className={`px-3 py-1 text-sm rounded-full ${
                        alliance.status === 'active' ? 'bg-green-900/50 text-green-300' :
                        alliance.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-red-900/50 text-red-300'
                      }`}>
                        {alliance.status}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Federations:</span>
                        <span className="text-white">{alliance.federation_count}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Active Projects:</span>
                        <span className="text-blue-400">{alliance.active_projects}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white">{new Date(alliance.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <button 
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors"
                      onClick={() => {
                        setSelectedAlliance(alliance);
                        setShowAllianceModal(true);
                      }}
                    >
                      Manage Alliance
                    </button>
                  </div>
                ))}
              </div>
              
              {alliances.length === 0 && (
                <div className="text-center py-12">
                  <Link className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No alliances yet</h3>
                  <p className="text-gray-400">Start by proposing alliances with discovered federations</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {projects.map((project) => (
                  <div key={project.project_id} className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{project.project_name}</h3>
                      <div className={`px-3 py-1 text-sm rounded-full ${
                        project.status === 'active' ? 'bg-green-900/50 text-green-300' :
                        project.status === 'initializing' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-gray-900/50 text-gray-300'
                      }`}>
                        {project.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-gray-400 text-sm">Coordinator:</span>
                        <p className="text-white truncate">{project.coordinator_federation_id}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-sm">Participants:</span>
                        <p className="text-blue-400">{project.participating_federations.length} federations</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-sm">Strategy:</span>
                        <p className="text-indigo-300">{project.aggregation_strategy}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-sm">Created:</span>
                        <p className="text-white">{new Date(project.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                      onClick={() => {
                        setSelectedProject(project);
                        setShowProjectModal(true);
                      }}
                    >
                      View Project Details
                    </button>
                  </div>
                ))}
              </div>
              
              {projects.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No cross-federation projects</h3>
                  <p className="text-gray-400">Create projects that span multiple federations for global collaboration</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'network' && (
            <motion.div
              key="network"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
                  <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                    <Network className="h-6 w-6 mr-3 text-blue-400" />
                    Federation Network Topology
                  </h3>

                  {/* Network Visualization */}
                  <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {federations.map((federation) => (
                        <motion.div
                          key={federation.federation_id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gradient-to-br from-blue-900/30 to-cyan-800/30 border border-blue-700/50 rounded-lg p-4"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span className="text-white font-medium text-sm">{federation.name}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {federation.regions.join(', ')}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Network Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-purple-900/50 to-pink-800/30 backdrop-blur-sm border border-purple-700/50 rounded-lg p-6 text-center">
                      <div className="text-3xl font-bold text-white mb-2">{federations.length}</div>
                      <div className="text-purple-300 text-sm">Total Federations</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/50 to-emerald-800/30 backdrop-blur-sm border border-green-700/50 rounded-lg p-6 text-center">
                      <div className="text-3xl font-bold text-white mb-2">{alliances.length}</div>
                      <div className="text-green-300 text-sm">Active Alliances</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-900/50 to-red-800/30 backdrop-blur-sm border border-orange-700/50 rounded-lg p-6 text-center">
                      <div className="text-3xl font-bold text-white mb-2">{projects.length}</div>
                      <div className="text-orange-300 text-sm">Cross-Fed Projects</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alliance Proposal Modal */}
        {showProposalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-xl p-6 max-w-lg w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Propose Alliance</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-white font-medium mb-2">Alliance Name</label>
                  <input
                    type="text"
                    value={proposalForm.alliance_name}
                    onChange={(e) => setProposalForm({...proposalForm, alliance_name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Target Federation</label>
                  <input
                    type="text"
                    value={proposalForm.target_federation_id}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowProposalModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => proposeAlliance(proposalForm.target_federation_id, proposalForm.alliance_name)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Send Proposal
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Federation Details Modal */}
        {selectedFederation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedFederation.name}</h2>
                <button
                  onClick={() => setSelectedFederation(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-semibold text-white mb-2">Organization</h3>
                  <p className="text-gray-300">{selectedFederation.organization}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300">{selectedFederation.description}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">Capabilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFederation.capabilities.map((cap, idx) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-sm">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">Supported Regions</h3>
                  <p className="text-gray-300">{selectedFederation.regions.join(', ')}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">Endpoint</h3>
                  <p className="text-blue-400 font-mono text-sm">{selectedFederation.endpoint_url}</p>
                </div>
              </div>
              
              {selectedFederation.alliance_status === 'none' && (
                <button
                  onClick={() => {
                    setProposalForm({
                      target_federation_id: selectedFederation.federation_id,
                      alliance_name: `Alliance with ${selectedFederation.name}`,
                      governance_rules: {}
                    });
                    setSelectedFederation(null);
                    setShowProposalModal(true);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Propose Alliance
                </button>
              )}
            </motion.div>
          </div>
        )}

        {/* Alliance Management Modal */}
        {showAllianceModal && selectedAlliance && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Manage Alliance: {selectedAlliance.alliance_name}</h2>
                <button
                  onClick={() => {
                    setShowAllianceModal(false);
                    setSelectedAlliance(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Status</h4>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedAlliance.status === 'active' ? 'bg-green-900/50 text-green-400' :
                      selectedAlliance.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {selectedAlliance.status}
                    </span>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Federations</h4>
                    <span className="text-blue-400 text-xl font-bold">{selectedAlliance.federation_count}</span>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Active Projects</h4>
                  <span className="text-green-400 text-xl font-bold">{selectedAlliance.active_projects}</span>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Created</h4>
                  <span className="text-gray-300">{new Date(selectedAlliance.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
                    View Members
                  </button>
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors">
                    Invite Federation
                  </button>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors">
                    Leave Alliance
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Project Details Modal */}
        {showProjectModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedProject.project_name}</h2>
                <button
                  onClick={() => {
                    setShowProjectModal(false);
                    setSelectedProject(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Coordinator</h4>
                    <span className="text-blue-400">{selectedProject.coordinator_federation_id}</span>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Status</h4>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedProject.status === 'active' ? 'bg-green-900/50 text-green-400' :
                      selectedProject.status === 'initializing' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-gray-900/50 text-gray-400'
                    }`}>
                      {selectedProject.status}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Participating Federations</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.participating_federations.map((fed, idx) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-sm">
                        {fed}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Aggregation Strategy</h4>
                    <span className="text-green-400">{selectedProject.aggregation_strategy}</span>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Created</h4>
                    <span className="text-gray-300">{new Date(selectedProject.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Alliance</h4>
                  <span className="text-purple-400">{selectedProject.alliance_id}</span>
                </div>
                
                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
                    View Progress
                  </button>
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors">
                    Join Project
                  </button>
                  <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors">
                    Download Results
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlliancePage;
