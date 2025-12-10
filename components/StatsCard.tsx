
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  subValue?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, trendUp, subValue }) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
          {subValue && <p className="text-sm text-gray-400 mt-1">{subValue}</p>}
        </div>
        <div className="p-2.5 bg-indigo-50 rounded-md text-indigo-600">
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center text-xs font-medium">
          <span className={`${trendUp ? 'text-green-600' : 'text-red-600'} flex items-center`}>
             {trendUp ? '▲' : '▼'} {trend}
          </span>
          <span className="text-gray-400 ml-1.5">전월 대비</span>
        </div>
      )}
    </div>
  );
};
