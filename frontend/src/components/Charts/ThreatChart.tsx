import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface ThreatData {
  timestamp: string;
  threats: number;
  packets: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
  severity?: string;
  type?: string;
}

interface ThreatChartProps {
  data: ThreatData[];
  type: 'line' | 'bar' | 'pie' | 'area' | 'severity';
  title: string;
  showSeverity?: boolean;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c', 
  medium: '#ca8a04',
  low: '#16a34a'
};

const ThreatChart: React.FC<ThreatChartProps> = ({ data, type, title, showSeverity = false }) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="timestamp" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="threats" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            />
            {!showSeverity && (
              <Line 
                type="monotone" 
                dataKey="packets" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            )}
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="timestamp" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="threats" 
              stackId="1"
              stroke="#ef4444" 
              fill="#ef4444"
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="packets" 
              stackId="2"
              stroke="#3b82f6" 
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </AreaChart>
        );
      
      case 'severity':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="timestamp" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="critical" stackId="a" fill={SEVERITY_COLORS.critical} radius={[0, 0, 0, 0]} />
            <Bar dataKey="high" stackId="a" fill={SEVERITY_COLORS.high} radius={[0, 0, 0, 0]} />
            <Bar dataKey="medium" stackId="a" fill={SEVERITY_COLORS.medium} radius={[0, 0, 0, 0]} />
            <Bar dataKey="low" stackId="a" fill={SEVERITY_COLORS.low} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="timestamp" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="threats" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="packets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      
      case 'pie':
        const pieData = data.map((item, index) => ({
          name: item.timestamp,
          value: item.threats,
          fill: COLORS[index % COLORS.length]
        }));
        
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Chart type not supported</p>
          </div>
        );
    }
  };

  const chartContent = renderChart();
  
  return (
    <div className="glass-dark rounded-2xl p-6 shadow-2xl border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {showSeverity && (
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SEVERITY_COLORS.critical }}></div>
              <span className="text-gray-300">Critical</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SEVERITY_COLORS.high }}></div>
              <span className="text-gray-300">High</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SEVERITY_COLORS.medium }}></div>
              <span className="text-gray-300">Medium</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SEVERITY_COLORS.low }}></div>
              <span className="text-gray-300">Low</span>
            </div>
          </div>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartContent || (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No data available</p>
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ThreatChart;