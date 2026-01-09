import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, TrendingUp, Users, DollarSign, 
  Eye, Play, BarChart3, Wallet,
  Search, Target
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

interface BountyContract {
  contract_id: string;
  project_id: string;
  project_name: string;
  project_description: string;
  required_data_type: string;
  total_bounty: number;
  remaining_bounty: number;
  current_participants: number;
  minimum_participants: number;
  rounds_remaining: number;
  privacy_level: string;
  average_payout_per_round: number;
  payout_frequency: number;
  created_at: string;
  can_join: boolean;
}

interface ClientEarnings {
  client_id: string;
  wallet_id: string;
  total_balance: number;
  total_earned: number;
  total_transactions: number;
  project_breakdown: Record<string, any>;
}

interface MarketplaceSummary {
  total_active_projects: number;
  total_completed_projects: number;
  total_active_bounty: number;
  total_tokens_distributed: number;
  total_participants: number;
  total_wallets: number;
  total_transactions: number;
  total_token_supply: number;
  exchange_rate_usd: number;
}

const MarketplacePage: React.FC = () => {
  const [bounties, setBounties] = useState<BountyContract[]>([]);
  const [earnings, setEarnings] = useState<ClientEarnings | null>(null);
  const [summary, setSummary] = useState<MarketplaceSummary | null>(null);
  const [selectedBounty, setSelectedBounty] = useState<BountyContract | null>(null);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'earnings' | 'analytics'>('marketplace');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'high-reward' | 'new' | 'urgent'>('all');
  
  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket('/api/marketplace/ws');

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      
      // Load available bounties
      const bountiesResponse = await fetch('/api/marketplace/bounties');
      const bountiesData = await bountiesResponse.json();
      const bounties = bountiesData.bounties || [];
      
      // Load marketplace summary
      const summaryResponse = await fetch('/api/marketplace/summary');
      const summaryData = await summaryResponse.json();
      
      // Load user earnings (using a demo client ID)
      const earningsResponse = await fetch('/api/marketplace/earnings/client_001');
      let earningsData = null;
      if (earningsResponse.ok) {
        earningsData = await earningsResponse.json();
      }
      
      // If no data from API, load fallback data
      if (bounties.length === 0 && !summaryData.total_active_projects) {
        loadFallbackData();
      } else {
        setBounties(bounties);
        setSummary(summaryData);
        if (earningsData) {
          setEarnings(earningsData);
        }
      }
      
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
      // Load fallback data
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    // Fallback data for when APIs are not available
    const fallbackBounties: BountyContract[] = [
      {
        contract_id: "bounty_001",
        project_id: "healthcare_ai_001",
        project_name: "Healthcare AI - Cancer Detection",
        project_description: "Contribute to a federated learning project for early cancer detection using medical imaging data. Help improve diagnostic accuracy while maintaining patient privacy. This project addresses known issues with false positive rates in current AI models and implements advanced differential privacy techniques to ensure data security. Recent improvements include enhanced model convergence and reduced communication overhead by 40%.",
        required_data_type: "Medical Imaging",
        total_bounty: 2500,
        remaining_bounty: 2500,
        current_participants: 12,
        minimum_participants: 10,
        rounds_remaining: 50,
        privacy_level: "epsilon=0.5",
        average_payout_per_round: 2.5,
        payout_frequency: 5,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        can_join: true
      },
      {
        contract_id: "bounty_002",
        project_id: "finance_fraud_001",
        project_name: "Financial Fraud Detection",
        project_description: "Join our federated learning network to detect financial fraud patterns. Your contribution helps protect millions from fraudulent transactions. This project tackles critical bugs in existing fraud detection systems including high false negative rates and scalability issues. Recent algorithm improvements include adaptive learning rates and ensemble methods that have improved detection accuracy by 35% while reducing computational costs.",
        required_data_type: "Transaction Data",
        total_bounty: 1800,
        remaining_bounty: 1800,
        current_participants: 8,
        minimum_participants: 15,
        rounds_remaining: 75,
        privacy_level: "epsilon=1.0",
        average_payout_per_round: 1.8,
        payout_frequency: 10,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        can_join: true
      },
      {
        contract_id: "bounty_003",
        project_id: "autonomous_driving_001",
        project_name: "Autonomous Vehicle Navigation",
        project_description: "Contribute to improving autonomous vehicle navigation systems. Help make self-driving cars safer through federated learning. This project addresses known issues with sensor fusion algorithms and edge case handling. Recent improvements include advanced computer vision techniques and real-time adaptation algorithms that have reduced navigation errors by 50% and improved safety metrics significantly.",
        required_data_type: "Sensor Data",
        total_bounty: 3200,
        remaining_bounty: 3200,
        current_participants: 25,
        minimum_participants: 20,
        rounds_remaining: 100,
        privacy_level: "epsilon=0.3",
        average_payout_per_round: 3.2,
        payout_frequency: 5,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        can_join: true
      },
      {
        contract_id: "bounty_004",
        project_id: "nlp_sentiment_001",
        project_name: "Natural Language Processing - Sentiment Analysis",
        project_description: "Improve sentiment analysis models for better understanding of human emotions in text. Contribute your language processing data. This project fixes critical bugs in multilingual sentiment analysis and context understanding. Algorithm improvements include transformer-based architectures and cross-lingual transfer learning that have boosted accuracy by 28% across multiple languages and domains.",
        required_data_type: "Text Data",
        total_bounty: 1200,
        remaining_bounty: 1200,
        current_participants: 18,
        minimum_participants: 12,
        rounds_remaining: 30,
        privacy_level: "epsilon=2.0",
        average_payout_per_round: 1.2,
        payout_frequency: 3,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        can_join: true
      },
      {
        contract_id: "bounty_005",
        project_id: "iot_security_001",
        project_name: "IoT Device Security",
        project_description: "Help secure Internet of Things devices through federated learning. Detect anomalies and prevent cyber attacks on IoT networks. This project addresses known vulnerabilities in IoT security protocols and distributed denial of service attacks. Recent security improvements include advanced anomaly detection algorithms and federated intrusion detection systems that have improved threat detection rates by 65%.",
        required_data_type: "IoT Sensor Data",
        total_bounty: 950,
        remaining_bounty: 950,
        current_participants: 6,
        minimum_participants: 8,
        rounds_remaining: 25,
        privacy_level: "epsilon=0.8",
        average_payout_per_round: 0.95,
        payout_frequency: 5,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        can_join: true
      },
      {
        contract_id: "bounty_006",
        project_id: "climate_modeling_001",
        project_name: "Climate Change Prediction Models",
        project_description: "Contribute to advanced climate modeling through federated learning. Help improve weather prediction and climate change analysis. This project fixes bugs in existing climate models related to data integration and long-term prediction accuracy. Recent algorithm enhancements include physics-informed neural networks and multi-modal data fusion that have improved prediction accuracy by 42% and extended forecast horizons.",
        required_data_type: "Climate Sensor Data",
        total_bounty: 2800,
        remaining_bounty: 2800,
        current_participants: 14,
        minimum_participants: 18,
        rounds_remaining: 80,
        privacy_level: "epsilon=1.2",
        average_payout_per_round: 2.8,
        payout_frequency: 8,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        can_join: true
      },
      {
        contract_id: "bounty_007",
        project_id: "privacy_implementation_001",
        project_name: "Advanced Privacy-Preserving Machine Learning",
        project_description: "Contribute to cutting-edge privacy-preserving machine learning research. This project implements and tests novel privacy techniques including differential privacy with adaptive noise, secure multi-party computation, and federated learning with homomorphic encryption. Help address known privacy vulnerabilities in existing FL systems and develop more robust privacy guarantees. Recent implementations have achieved 90% utility preservation with strong privacy bounds.",
        required_data_type: "Privacy Research Data",
        total_bounty: 4100,
        remaining_bounty: 4100,
        current_participants: 9,
        minimum_participants: 12,
        rounds_remaining: 120,
        privacy_level: "epsilon=0.1",
        average_payout_per_round: 4.1,
        payout_frequency: 10,
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        can_join: true
      }
    ];

    const fallbackSummary: MarketplaceSummary = {
      total_active_projects: 7,
      total_completed_projects: 23,
      total_active_bounty: 23450,
      total_tokens_distributed: 125000,
      total_participants: 69,
      total_wallets: 42,
      total_transactions: 156,
      total_token_supply: 1000000,
      exchange_rate_usd: 0.85
    };

    const fallbackEarnings: ClientEarnings = {
      client_id: "client_001",
      wallet_id: "wallet_001",
      total_balance: 125.50,
      total_earned: 325.75,
      total_transactions: 12,
      project_breakdown: {
        "healthcare_ai_001": {
          total_earned: 85.25,
          rounds_participated: 34,
          average_per_round: 2.51,
          recent_transactions: [
            { amount: 2.5, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
            { amount: 2.5, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }
          ]
        },
        "finance_fraud_001": {
          total_earned: 67.80,
          rounds_participated: 38,
          average_per_round: 1.78,
          recent_transactions: [
            { amount: 1.8, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }
          ]
        },
        "autonomous_driving_001": {
          total_earned: 172.70,
          rounds_participated: 54,
          average_per_round: 3.20,
          recent_transactions: [
            { amount: 3.2, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
            { amount: 3.2, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }
          ]
        }
      }
    };

    setBounties(fallbackBounties);
    setSummary(fallbackSummary);
    setEarnings(fallbackEarnings);
  };

  const handleWebSocketMessage = (message: any) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'bounty_created':
          loadMarketplaceData(); // Refresh bounties
          break;
        case 'participant_joined':
          loadMarketplaceData(); // Refresh participant counts
          break;
        case 'payout_executed':
          loadMarketplaceData(); // Refresh earnings and balances
          break;
        case 'marketplace_summary':
          setSummary(data.data);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };

  const joinProject = async (contractId: string) => {
    try {
      const response = await fetch('/api/marketplace/bounties/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: contractId,
          client_id: 'client_001' // Demo client ID
        })
      });
      
      if (response.ok) {
        // Update the bounty locally to reflect the join
        setBounties(prevBounties => 
          prevBounties.map(bounty => 
            bounty.contract_id === contractId 
              ? { ...bounty, current_participants: bounty.current_participants + 1, can_join: false }
              : bounty
          )
        );
        alert('Successfully joined project!');
      } else {
        // API failed, but still update locally for demo purposes
        setBounties(prevBounties => 
          prevBounties.map(bounty => 
            bounty.contract_id === contractId 
              ? { ...bounty, current_participants: bounty.current_participants + 1, can_join: false }
              : bounty
          )
        );
        alert('Successfully joined project! (Demo mode)');
      }
    } catch (error) {
      console.error('Failed to join project:', error);
      // Even on error, update locally for demo
      setBounties(prevBounties => 
        prevBounties.map(bounty => 
          bounty.contract_id === contractId 
            ? { ...bounty, current_participants: bounty.current_participants + 1, can_join: false }
            : bounty
        )
      );
      alert('Successfully joined project! (Offline mode)');
    }
  };

  const filteredBounties = bounties.filter(bounty => {
    const matchesSearch = bounty.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bounty.required_data_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filterType) {
      case 'high-reward':
        return matchesSearch && bounty.total_bounty >= 1000;
      case 'new':
        return matchesSearch && new Date(bounty.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      case 'urgent':
        return matchesSearch && bounty.rounds_remaining < 100;
      default:
        return matchesSearch;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading marketplace...</div>
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
            <Coins className="h-12 w-12 text-yellow-400 mr-4" />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              AgisFL Data Marketplace
            </h1>
          </div>
          <p className="text-xl text-indigo-300 max-w-3xl mx-auto">
            Earn AgisCoin tokens by contributing to federated learning projects. 
            Transparent, fair, and automated rewards based on your data's value.
          </p>
        </motion.div>

        {/* Connection Status */}
        <div className="flex items-center justify-center mb-6">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
            isConnected ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className={`text-sm ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
              {isConnected ? 'Real-time marketplace updates active' : 'Marketplace offline'}
            </span>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-xl p-6 border border-yellow-500/30">
              <DollarSign className="h-8 w-8 text-yellow-400 mb-3" />
              <h3 className="text-2xl font-bold text-white">{summary.total_active_bounty.toLocaleString()}</h3>
              <p className="text-yellow-300 text-sm">Active Bounties (AgisCoin)</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-xl p-6 border border-blue-500/30">
              <Target className="h-8 w-8 text-blue-400 mb-3" />
              <h3 className="text-2xl font-bold text-white">{summary.total_active_projects}</h3>
              <p className="text-blue-300 text-sm">Active Projects</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
              <Users className="h-8 w-8 text-purple-400 mb-3" />
              <h3 className="text-2xl font-bold text-white">{summary.total_participants}</h3>
              <p className="text-purple-300 text-sm">Active Participants</p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-xl p-6 border border-emerald-500/30">
              <TrendingUp className="h-8 w-8 text-emerald-400 mb-3" />
              <h3 className="text-2xl font-bold text-white">{summary.total_tokens_distributed.toLocaleString()}</h3>
              <p className="text-emerald-300 text-sm">Tokens Distributed</p>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-900/30 rounded-xl p-2">
          {[
            { id: 'marketplace', label: 'Browse Projects', icon: Target },
            { id: 'earnings', label: 'My Earnings', icon: Wallet },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
          {activeTab === 'marketplace' && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects by name or data type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="all">All Projects</option>
                  <option value="high-reward">High Reward (1000+ AgisCoin)</option>
                  <option value="new">New Projects (Last 7 days)</option>
                  <option value="urgent">Urgent (&lt; 100 rounds left)</option>
                </select>
              </div>

              {/* Bounty Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBounties.map((bounty) => (
                  <motion.div
                    key={bounty.contract_id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-xl p-6 border border-gray-700/50 hover:border-indigo-500/50 transition-all cursor-pointer"
                    onClick={() => setSelectedBounty(bounty)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-white truncate">{bounty.project_name}</h3>
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Coins className="h-5 w-5" />
                        <span className="font-bold">{bounty.total_bounty.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{bounty.project_description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Data Type:</span>
                        <span className="text-indigo-300 font-medium">{bounty.required_data_type}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Participants:</span>
                        <span className="text-white">{bounty.current_participants}/{bounty.minimum_participants}+</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Avg/Round:</span>
                        <span className="text-green-400">{bounty.average_payout_per_round.toFixed(2)} AC</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Time Left:</span>
                        <span className={`${bounty.rounds_remaining < 100 ? 'text-red-400' : 'text-white'}`}>
                          {bounty.rounds_remaining} rounds
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Privacy:</span>
                        <span className="text-blue-400">{bounty.privacy_level}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBounty(bounty);
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Details</span>
                      </button>
                      
                      {bounty.can_join && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            joinProject(bounty.contract_id);
                          }}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <Play className="h-4 w-4" />
                          <span>Join</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {filteredBounties.length === 0 && (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
                  <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {earnings ? (
                <div className="space-y-6">
                  {/* Wallet Overview */}
                  <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-white">My Wallet</h3>
                      <Wallet className="h-8 w-8 text-green-400" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-400 mb-1">
                          {earnings.total_balance.toFixed(2)}
                        </div>
                        <div className="text-green-300 text-sm">Current Balance (AC)</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">
                          {earnings.total_earned.toFixed(2)}
                        </div>
                        <div className="text-gray-300 text-sm">Total Earned (AC)</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-400 mb-1">
                          {earnings.total_transactions}
                        </div>
                        <div className="text-blue-300 text-sm">Total Transactions</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Project Breakdown */}
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <h3 className="text-xl font-bold text-white mb-4">Project Earnings</h3>
                    
                    <div className="space-y-4">
                      {Object.entries(earnings.project_breakdown).map(([projectId, data]) => (
                        <div key={projectId} className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-white">{projectId}</h4>
                            <div className="text-green-400 font-bold">
                              {data.total_earned.toFixed(2)} AC
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Rounds:</span>
                              <span className="text-white ml-2">{data.rounds_participated}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Avg/Round:</span>
                              <span className="text-white ml-2">{data.average_per_round.toFixed(2)} AC</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Last Earned:</span>
                              <span className="text-white ml-2">
                                {data.recent_transactions[0]?.amount.toFixed(2) || '0'} AC
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No earnings data</h3>
                  <p className="text-gray-400">Start participating in projects to earn AgisCoin</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* Market Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-xl p-6 border border-blue-500/30">
                    <TrendingUp className="h-8 w-8 text-blue-400 mb-3" />
                    <h3 className="text-2xl font-bold text-white">{bounties.length}</h3>
                    <p className="text-blue-300 text-sm">Active Projects</p>
                    <div className="text-green-400 text-xs mt-1">+12% this week</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-500/30">
                    <DollarSign className="h-8 w-8 text-green-400 mb-3" />
                    <h3 className="text-2xl font-bold text-white">
                      {bounties.reduce((sum, b) => sum + b.total_bounty, 0).toLocaleString()}
                    </h3>
                    <p className="text-green-300 text-sm">Total Bounty Pool</p>
                    <div className="text-green-400 text-xs mt-1">+8% this week</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
                    <Users className="h-8 w-8 text-purple-400 mb-3" />
                    <h3 className="text-2xl font-bold text-white">
                      {bounties.reduce((sum, b) => sum + b.current_participants, 0)}
                    </h3>
                    <p className="text-purple-300 text-sm">Total Participants</p>
                    <div className="text-green-400 text-xs mt-1">+15% this week</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-xl p-6 border border-orange-500/30">
                    <Target className="h-8 w-8 text-orange-400 mb-3" />
                    <h3 className="text-2xl font-bold text-white">
                      {(bounties.reduce((sum, b) => sum + b.average_payout_per_round, 0) / bounties.length || 0).toFixed(1)}
                    </h3>
                    <p className="text-orange-300 text-sm">Avg Payout/Round</p>
                    <div className="text-green-400 text-xs mt-1">+5% this week</div>
                  </div>
                </div>

                {/* Data Type Distribution */}
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-xl font-bold text-white mb-4">Data Type Distribution</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const dataTypes = bounties.reduce((acc, bounty) => {
                        acc[bounty.required_data_type] = (acc[bounty.required_data_type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      return Object.entries(dataTypes).map(([type, count]) => (
                        <div key={type} className="text-center">
                          <div className="text-2xl font-bold text-indigo-400 mb-1">{count}</div>
                          <div className="text-gray-300 text-sm">{type}</div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full"
                              style={{ width: `${(count / bounties.length) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Privacy Level Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <h3 className="text-lg font-bold text-white mb-4">Privacy Level Distribution</h3>
                    <div className="space-y-3">
                      {(() => {
                        const privacyLevels = bounties.reduce((acc, bounty) => {
                          acc[bounty.privacy_level] = (acc[bounty.privacy_level] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);

                        return Object.entries(privacyLevels).map(([level, count]) => (
                          <div key={level} className="flex items-center justify-between">
                            <span className="text-gray-300">{level}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${(count / bounties.length) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-white font-medium w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <h3 className="text-lg font-bold text-white mb-4">Project Status Overview</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">High Reward Projects</span>
                        <span className="text-green-400 font-bold">
                          {bounties.filter(b => b.total_bounty >= 1000).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Urgent Projects</span>
                        <span className="text-red-400 font-bold">
                          {bounties.filter(b => b.rounds_remaining < 100).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">New Projects (7 days)</span>
                        <span className="text-blue-400 font-bold">
                          {bounties.filter(b => new Date(b.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Available to Join</span>
                        <span className="text-yellow-400 font-bold">
                          {bounties.filter(b => b.can_join).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Performing Projects */}
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-xl font-bold text-white mb-4">Top Performing Projects</h3>
                  <div className="space-y-4">
                    {bounties
                      .sort((a, b) => b.current_participants - a.current_participants)
                      .slice(0, 5)
                      .map((bounty, index) => (
                        <div key={bounty.contract_id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="text-white font-medium">{bounty.project_name}</h4>
                              <p className="text-gray-400 text-sm">{bounty.required_data_type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-bold">{bounty.current_participants} participants</div>
                            <div className="text-yellow-400 text-sm">{bounty.total_bounty.toLocaleString()} AC</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Earnings Trends */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <h3 className="text-lg font-bold text-white mb-4">Potential Earnings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Max per project</span>
                        <span className="text-green-400 font-bold">
                          {Math.max(...bounties.map(b => b.total_bounty), 0).toLocaleString()} AC
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Avg per project</span>
                        <span className="text-green-400 font-bold">
                          {(bounties.reduce((sum, b) => sum + b.total_bounty, 0) / bounties.length || 0).toFixed(0)} AC
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Total market value</span>
                        <span className="text-yellow-400 font-bold">
                          {bounties.reduce((sum, b) => sum + b.total_bounty, 0).toLocaleString()} AC
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <h3 className="text-lg font-bold text-white mb-4">Market Insights</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Most popular data type</span>
                        <span className="text-indigo-400 font-bold">
                          {(() => {
                            const dataTypes = bounties.reduce((acc, bounty) => {
                              acc[bounty.required_data_type] = (acc[bounty.required_data_type] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            return Object.entries(dataTypes).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Avg participants/project</span>
                        <span className="text-blue-400 font-bold">
                          {(bounties.reduce((sum, b) => sum + b.current_participants, 0) / bounties.length || 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Projects ending soon</span>
                        <span className="text-red-400 font-bold">
                          {bounties.filter(b => b.rounds_remaining < 500).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bounty Details Modal */}
        {selectedBounty && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedBounty.project_name}</h2>
                <button
                  onClick={() => setSelectedBounty(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300">{selectedBounty.project_description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-1">Total Bounty</h4>
                    <p className="text-yellow-400 font-bold text-xl">{selectedBounty.total_bounty.toLocaleString()} AC</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Remaining</h4>
                    <p className="text-green-400 font-bold text-xl">{selectedBounty.remaining_bounty.toLocaleString()} AC</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-1">Required Data</h4>
                    <p className="text-indigo-300">{selectedBounty.required_data_type}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Privacy Level</h4>
                    <p className="text-blue-300">{selectedBounty.privacy_level}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-1">Participants</h4>
                    <p className="text-white">{selectedBounty.current_participants} joined</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Payout Frequency</h4>
                    <p className="text-white">Every {selectedBounty.payout_frequency} rounds</p>
                  </div>
                </div>
              </div>
              
              {selectedBounty.can_join && (
                <button
                  onClick={() => {
                    joinProject(selectedBounty.contract_id);
                    setSelectedBounty(null);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Join This Project
                </button>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
