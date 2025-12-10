
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { StatsCard } from './StatsCard';
import { Building2, Users, Wallet, AlertTriangle, FileCheck, Wrench } from 'lucide-react';
import { DashboardFinancials, LeaseContract, Property } from '../types';

interface DashboardProps {
  financials: DashboardFinancials;
  properties: Property[];
  contracts: LeaseContract[];
  maintenanceCount: number;
  formatMoney: (amount: number) => string;
}

export const Dashboard: React.FC<DashboardProps> = ({ financials, properties, contracts, maintenanceCount, formatMoney }) => {
  const revenueData = [
    { name: '1월', collected: 42000000, pending: 3000000 },
    { name: '2월', collected: 43500000, pending: 1500000 },
    { name: '3월', collected: 42800000, pending: 2200000 },
    { name: '4월', collected: 45000000, pending: 1000000 },
    { name: '5월', collected: 46000000, pending: 0 },
    { name: '6월', collected: financials.collectedAmount, pending: financials.overdueAmount },
  ];

  const occupancyData = [
    { name: '임대중', value: contracts.filter(c => c.status === 'ACTIVE').length },
    { name: '공실', value: 3 },
  ];
  const COLORS = ['#4f46e5', '#e5e7eb'];

  const expiringContracts = contracts.filter(c => {
    if (c.status !== 'ACTIVE') return false;
    const daysLeft = Math.ceil((new Date(c.term.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 60;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="총 자산"
          value={`${properties.length}개소`}
          subValue={`건물 총 ${properties.reduce((sum, p) => sum + (p.buildings?.length || 0), 0)}개 동`}
          icon={<Building2 size={20} />}
        />
        <StatsCard
          title="수납 현황"
          value={`${Math.round(financials.collectionRate)}%`}
          subValue={`미수: ${formatMoney(financials.overdueAmount)}`}
          icon={<Wallet size={20} />}
          trend="2.5%"
          trendUp={true}
        />
        <StatsCard
          title="계약 만료"
          value={`${expiringContracts.length} 건`}
          subValue="60일 내 도래"
          icon={<FileCheck size={20} />}
          trend="주의"
          trendUp={false}
        />
        <StatsCard
          title="유지보수"
          value={`${maintenanceCount} 건`}
          subValue="진행 중"
          icon={<Wrench size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">월별 수납 현황</h3>
            <div className="flex gap-4 text-xs mt-2 sm:mt-0">
              <span className="flex items-center"><div className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></div>수납</span>
              <span className="flex items-center"><div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>미수</span>
            </div>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} tickFormatter={(val) => val > 0 ? (val/1000000).toFixed(0)+'M' : '0'} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatMoney(value)}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="collected" stackId="a" fill="#4f46e5" barSize={30} radius={[0, 0, 4, 4]} />
                <Bar dataKey="pending" stackId="a" fill="#f87171" barSize={30} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">임대 현황</h3>
          <div className="h-48 sm:h-64 mb-6 relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={occupancyData}
                   cx="50%"
                   cy="50%"
                   innerRadius="60%"
                   outerRadius="80%"
                   fill="#8884d8"
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {occupancyData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '12px' }}/>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
