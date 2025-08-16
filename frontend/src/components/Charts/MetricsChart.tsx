import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MetricsChartProps {
  type: 'line' | 'bar' | 'doughnut';
  data: any;
  title?: string;
  height?: number;
  gradient?: boolean;
  realTime?: boolean;
}

const MetricsChart: React.FC<MetricsChartProps> = ({
  type,
  data,
  title,
  height = 300,
  gradient = true,
  realTime = false
}) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: type !== 'doughnut',
        position: 'top' as const,
        labels: {
          color: '#9CA3AF',
          font: {
            size: 12,
            weight: '500',
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        intersect: false,
        mode: 'index' as const,
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          },
        },
        beginAtZero: true,
      },
    } : undefined,
    elements: {
      point: {
        radius: realTime ? 0 : 4,
        hoverRadius: 6,
      },
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      bar: {
        borderRadius: 4,
        borderSkipped: false,
      },
    },
    animation: {
      duration: realTime ? 0 : 750,
      easing: 'easeInOutQuart' as const,
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  // Apply gradients if enabled
  const processedData = gradient && type === 'line' ? {
    ...data,
    datasets: data.datasets?.map((dataset: any, index: number) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradientFill = ctx.createLinearGradient(0, 0, 0, height);
        const color = dataset.borderColor || `hsl(${index * 60}, 70%, 50%)`;
        gradientFill.addColorStop(0, `${color}40`);
        gradientFill.addColorStop(1, `${color}00`);
        
        return {
          ...dataset,
          backgroundColor: gradientFill,
          fill: true,
        };
      }
      return dataset;
    })
  } : data;

  const ChartComponent = type === 'line' ? Line : type === 'bar' ? Bar : Doughnut;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {realTime && (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium">Live</span>
            </div>
          )}
        </div>
      )}
      
      <div style={{ height }}>
        <ChartComponent data={processedData} options={chartOptions} />
      </div>
    </motion.div>
  );
};

export default MetricsChart;