import React from 'react';

interface DebugInfoProps {
  data: any;
  title: string;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ data, title }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      <pre className="text-xs overflow-auto max-h-32">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default DebugInfo;