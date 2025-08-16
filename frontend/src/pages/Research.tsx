import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  FlaskConical, 
  Brain, 
  BookOpen, 
  TrendingUp,
  Plus,
  Play,
  Pause,
  BarChart3,
  Settings,
  Award,
  Users,
  Target,
  Zap
} from 'lucide-react';
import { MetricCard } from '../components/Cards/MetricCard';
import MetricsChart from '../components/Charts/MetricsChart';
import { DataTable } from '../components/Tables/DataTable';
import { researchAPI } from '../services/api';
import toast from 'react-hot-toast';

const Research: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    datasets: [] as string[],
    algorithms: ['FedAvg'],
  });

  // Research projects
  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ['research-projects'],
    queryFn: () => researchAPI.getProjects(),
  });

  // Research algorithms
  const { data: algorithms } = useQuery({
    queryKey: ['research-algorithms'],
    queryFn: () => researchAPI.getEnterpriseAlgorithms(),
  });

  // Research statistics
  const { data: stats } = useQuery({
    queryKey: ['research-stats'],
    queryFn: () => researchAPI.getStatistics(),
  });

  // Publications
  const { data: publications } = useQuery({
    queryKey: ['research-publications'],
    queryFn: () => researchAPI.getPublications(),
  });

  const createProject = async () => {
    try {
      await researchAPI.createProject(newProject);
      toast.success('Research project created successfully');
      setShowCreateModal(false);
      setNewProject({
        name: '',
        description: '',
        datasets: [],
        algorithms: ['FedAvg'],
      });
      refetchProjects();
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const runExperiment = async (projectId: string) => {
    try {
      await researchAPI.runExperiment(projectId, {
        algorithm: 'FedAvg',
        dataset: 'CICIDS2017'
      });
      toast.success('Experiment started');
    } catch (error) {
      toast.error('Failed to start experiment');
    }
  };

  // Prepare algorithm performance chart
  const algorithmData = {
    labels: algorithms?.data?.algorithms?.map((alg: any) => alg.name) || [],
    datasets: [{
      label: 'Convergence Rate',
      data: algorithms?.data?.algorithms?.map((alg: any) => 
        alg.performance_metrics?.convergence_rate * 100
      ) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
    }, {
      label: 'Privacy Preservation',
      data: algorithms?.data?.algorithms?.map((alg: any) => 
        alg.performance_metrics?.privacy_preservation * 100
      ) || [],
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
    }]
  };

  // Prepare projects table
  const projectsColumns = [
    { 
      key: 'name', 
      label: 'Project Name', 
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
            {row.description}
          </p>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
          value === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        }`}>
          {value.toUpperCase()}
        </span>
      )
    },
    { 
      key: 'progress', 
      label: 'Progress', 
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {value}%
          </span>
        </div>
      )
    },
    { 
      key: 'created_at', 
      label: 'Created', 
      sortable: true,
      render: (value: string) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
            AI Research Laboratory
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Advanced federated learning research, experimentation & algorithm development
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
          
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Lab Settings</span>
          </button>
        </div>
      </motion.div>

      {/* Research Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Active Projects"
          value={stats?.data?.active_projects || projects?.data?.length || 0}
          subtitle="Research initiatives"
          icon={FlaskConical}
          color="purple"
        />
        
        <MetricCard
          title="Total Experiments"
          value={stats?.data?.total_experiments || 0}
          subtitle="ML experiments run"
          icon={Brain}
          color="blue"
        />
        
        <MetricCard
          title="Publications"
          value={publications?.data?.total_publications || 0}
          subtitle="Research papers"
          icon={BookOpen}
          color="green"
        />
        
        <MetricCard
          title="Average Accuracy"
          value={`${((stats?.data?.average_accuracy || 0) * 100).toFixed(1)}%`}
          subtitle="Across all experiments"
          icon={TrendingUp}
          color="cyan"
          trend={{ value: 3.2, direction: 'up' }}
        />
      </div>

      {/* Algorithm Performance */}
      {algorithms?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <MetricsChart
            type="bar"
            data={algorithmData}
            title="FL Algorithm Performance Comparison"
            height={350}
          />
          
          <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Algorithm Categories
            </h3>
            <div className="space-y-4">
              {algorithms.data.algorithms?.slice(0, 6).map((algorithm: any, index: number) => (
                <motion.div
                  key={algorithm.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {algorithm.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {algorithm.category}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {(algorithm.performance_metrics?.convergence_rate * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {algorithm.implementation_status}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Research Projects */}
      <DataTable
        title="Research Projects"
        subtitle="Active and completed research initiatives"
        data={projects?.data || []}
        columns={projectsColumns}
        searchable={true}
        exportable={true}
        refreshable={true}
        onRefresh={() => refetchProjects()}
        onRowClick={setSelectedProject}
        pageSize={8}
      />

      {/* Publications */}
      {publications?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Recent Publications
          </h3>
          
          <div className="space-y-4">
            {publications.data.publications?.map((pub: any, index: number) => (
              <motion.div
                key={pub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {pub.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {pub.authors?.join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {pub.journal} • {pub.year} • Impact Factor: {pub.impact_factor}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {pub.citations} citations
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                      DOI: {pub.doi}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create Research Project
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Project description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Algorithms
                </label>
                <select
                  multiple
                  value={newProject.algorithms}
                  onChange={(e) => setNewProject({ 
                    ...newProject, 
                    algorithms: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  size={4}
                >
                  {algorithms?.data?.algorithms?.map((alg: any) => (
                    <option key={alg.name} value={alg.name}>{alg.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={createProject}
                disabled={!newProject.name || !newProject.description}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Create Project
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedProject(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedProject.name}
              </h3>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Project Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Description
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedProject.description}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedProject.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {selectedProject.status?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Progress
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${selectedProject.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedProject.progress || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Experiment Results
                </h4>
                {selectedProject.results?.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedProject.results.map((result: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {result.experiment_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {result.algorithm}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {(result.accuracy * 100).toFixed(2)}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {result.training_time}s
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No experiments yet</p>
                    <button
                      onClick={() => runExperiment(selectedProject.id)}
                      className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Run First Experiment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Research;