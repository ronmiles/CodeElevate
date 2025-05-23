import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface SolutionInfoMessageProps {
  type: 'example' | 'error' | 'success' | 'info';
  children: React.ReactNode;
}

const SolutionInfoMessage: React.FC<SolutionInfoMessageProps> = ({
  type,
  children,
}) => {
  let bgClass = '';
  let textClass = '';
  let borderClass = '';
  let Icon = Info;

  switch (type) {
    case 'example':
      bgClass = 'bg-gradient-to-r from-amber-900 to-yellow-900';
      textClass = 'text-amber-100';
      borderClass = 'border-amber-800';
      Icon = Info;
      break;
    case 'error':
      bgClass = 'bg-gradient-to-r from-red-900 to-rose-900';
      textClass = 'text-red-100';
      borderClass = 'border-red-800';
      Icon = AlertTriangle;
      break;
    case 'success':
      bgClass = 'bg-gradient-to-r from-green-900 to-emerald-900';
      textClass = 'text-green-100';
      borderClass = 'border-green-800';
      Icon = Info;
      break;
    case 'info':
    default:
      bgClass = 'bg-gradient-to-r from-blue-900 to-indigo-900';
      textClass = 'text-blue-100';
      borderClass = 'border-blue-800';
      Icon = Info;
      break;
  }

  return (
    <div
      className={`p-4 ${bgClass} ${textClass} rounded-lg mb-4 text-sm flex items-start border ${borderClass}`}
    >
      <Icon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium mb-1">
          {type === 'example'
            ? 'Learning Tip'
            : type === 'error'
            ? 'Error'
            : type === 'success'
            ? 'Success'
            : 'Information'}
        </p>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default SolutionInfoMessage;
