
import React, { useState, useMemo } from 'react';
import { PaymentTransaction, LeaseContract, Stakeholder, Unit, Property } from '../types';
import { Download, RefreshCcw, CheckCircle, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar, Filter, Save, X, Edit2, Clock } from 'lucide-react';

interface FinanceManagerProps {
  transactions: PaymentTransaction[];
  contracts: LeaseContract[];
  stakeholders: Stakeholder[];
  units: Unit[];
  properties: Property[];
  onUpdateStatus: (id: string, status: 'PAID' | 'UNPAID' | 'OVERDUE') => void;
  onUpdateTransaction: (tx: PaymentTransaction) => void;
  onGenerateBills: (txs: PaymentTransaction[]) => void;
  formatMoney: (amount: number) => string;
  formatNumberInput: (num: number | undefined | null) => string;
  parseNumberInput: (str: string) => number;
  formatMoneyInput: (amount: number | undefined | null) => string;
  parseMoneyInput: (str: string) => number;
}

const TX_TYPE_LABELS: Record<string, string> = {
  RENT: '월차임',
  ADMIN_FEE: '일반 관리비',
  MAINTENANCE_COST: '용역/유지보수비',
  DEPOSIT: '보증금'
};

export const FinanceManager: React.FC<FinanceManagerProps> = ({ 
  transactions, contracts, stakeholders, units, properties, onUpdateStatus, onUpdateTransaction, onGenerateBills, formatMoney, formatNumberInput, parseNumberInput, formatMoneyInput, parseMoneyInput
}) => {
  
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [viewMode, setViewMode] = useState<'MONTHLY' | 'CUMULATIVE'>('MONTHLY');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PaymentTransaction>>({});

  const getContractInfo = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return '유지보수/기타';
    
    let targetName = '알 수 없음';
    if(contract.targetType === 'PROPERTY') {
         targetName = properties.find(p => p.id === contract.targetId)?.name || '';
    } else if(contract.targetType === 'BUILDING') {
         for(const p of properties) {
             const b = p.buildings.find(b => b.id === contract.targetId);
             if(b) { targetName = `${p.name} ${b.name}`; break; }
         }
    } else if(contract.targetType === 'UNIT') {
         const u = units.find(u => u.id === contract.targetId);
         if(u) {
             const p = properties.find(p => p.id === u.propertyId);
             const b = p?.buildings.find(b => b.id === u.buildingId);
             targetName = `${p?.name} ${b?.name} ${u.unitNumber}호`;
         }
    }

    const tenant = stakeholders.find(s => s.id === contract.tenantId);
    return `${targetName} (${tenant?.name || '미지정'})`;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (!selectedMonth) return true;
      if (viewMode === 'MONTHLY') {
        return tx.targetMonth === selectedMonth;
      } else {
        return tx.targetMonth <= selectedMonth;
      }
    }).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  }, [transactions, selectedMonth, viewMode]);

  const summary = useMemo(() => {
    const incomeTxs = filteredTransactions.filter(t => t.amount > 0);
    const expenseTxs = filteredTransactions.filter(t => t.amount < 0);
    
    const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const collectedIncome = incomeTxs.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);
    const pendingIncome = incomeTxs.filter(t => t.status !== 'PAID').reduce((sum, t) => sum + t.amount, 0);
    
    const collectionRate = totalIncome > 0 ? (collectedIncome / totalIncome) * 100 : 0;
    const overdueCount = filteredTransactions.filter(t => t.status === 'OVERDUE').length;

    return { totalIncome, totalExpense, collectedIncome, pendingIncome, collectionRate, overdueCount };
  }, [filteredTransactions]);

  const startEdit = (tx: PaymentTransaction) => {
    setEditingTxId(tx.id);
    setEditForm({ ...tx });
  };

  const cancelEdit = () => {
    setEditingTxId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if(!editingTxId) return;
    const original = transactions.find(t => t.id === editingTxId);
    if(original) {
       onUpdateTransaction({ ...original, ...editForm } as PaymentTransaction);
    }
    setEditingTxId(null);
    setEditForm({});
  };

  const isFutureDate = (dateStr: string) => {
    const due = new Date(dateStr);
    const now = new Date();
    // Compare dates only (ignore time)
    return new Date(due.getFullYear(), due.getMonth(), due.getDate()) > new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">납입 및 청구 관리</h2>
          <p className="text-sm text-gray-500">
            {viewMode === 'CUMULATIVE' ? `~ ${selectedMonth} 까지의 누계 현황` : `${selectedMonth} 월별 상세 내역`}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
           <div className="flex items-center gap-2 px-2">
             <Calendar size={16} className="text-gray-500"/>
             <input 
               type="month" 
               className="text-sm bg-transparent outline-none font-medium text-gray-900" 
               value={selectedMonth} 
               onChange={(e) => { setSelectedMonth(e.target.value); }}
             />
           </div>
           <div className="h-6 w-px bg-gray-200 mx-1"></div>
           <button 
             onClick={() => setViewMode(prev => prev === 'MONTHLY' ? 'CUMULATIVE' : 'MONTHLY')} 
             className={`px-3 py-1.5 rounded text-xs font-bold transition-colors whitespace-nowrap ${viewMode === 'CUMULATIVE' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
           >
             {viewMode === 'MONTHLY' ? '전체 누적 보기' : '당월만 보기'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">
                {viewMode === 'CUMULATIVE' ? '총 청구 누계 (수입)' : '당월 청구액 (수입)'}
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded"><TrendingUp size={16}/></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatMoney(summary.totalIncome)}</h3>
          <p className="text-xs text-gray-400 mt-1">임대료 + 관리비</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">
                {viewMode === 'CUMULATIVE' ? '총 지출 누계' : '당월 지출 예정'}
            </span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded"><TrendingDown size={16}/></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatMoney(summary.totalExpense)}</h3>
          <p className="text-xs text-gray-400 mt-1">임차료 + 용역비</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">수납율</span>
            <div className="p-1.5 bg-green-50 text-green-600 rounded"><CheckCircle size={16}/></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{Math.round(summary.collectionRate)}%</h3>
          <p className="text-xs text-gray-400 mt-1">미수/예정: {formatMoney(summary.pendingIncome)}</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">연체</span>
            <div className="p-1.5 bg-red-50 text-red-600 rounded"><AlertCircle size={16}/></div>
          </div>
          <h3 className="text-2xl font-bold text-red-600">{summary.overdueCount}건</h3>
          <p className="text-xs text-gray-400 mt-1">납기일 경과</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <h3 className="font-bold text-gray-800">상세 내역</h3>
          <div className="flex gap-2 w-full sm:w-auto">
             <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
               <Download size={16}/> 엑셀 다운로드
             </button>
             <button onClick={() => onGenerateBills([])} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-bold hover:bg-indigo-100">
               <RefreshCcw size={16}/> 새로고침
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold sticky top-0">
              <tr>
                <th className="p-3">대상월</th>
                <th className="p-3">구분</th>
                <th className="p-3">내역</th>
                <th className="p-3">납부기한</th>
                <th className="p-3 text-right">금액</th>
                <th className="p-3 text-center">상태</th>
                <th className="p-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-gray-400">
                   {viewMode === 'MONTHLY' 
                      ? `${selectedMonth}월에 예정된 수납/지출 내역이 없습니다.` 
                      : '해당 기간의 내역이 없습니다.'}
                </td></tr>
              ) : (
                filteredTransactions.map(tx => {
                   const isEditing = editingTxId === tx.id;
                   const isIncome = tx.amount > 0;
                   const isFuture = isFutureDate(tx.dueDate);
                   
                   return (
                     <tr key={tx.id} className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-indigo-50' : ''}`}>
                       <td className="p-3 text-gray-500">{tx.targetMonth}</td>
                       <td className="p-3">
                          {isIncome ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">수입</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">지출</span>
                          )}
                       </td>
                       <td className="p-3">
                          <div className="font-medium text-gray-900">{getContractInfo(tx.contractId)}</div>
                          <div className="text-xs text-gray-500">{TX_TYPE_LABELS[tx.type] || tx.type}</div>
                       </td>
                       <td className="p-3">
                          {isEditing ? (
                             <input type="date" className="border p-1 rounded bg-white text-gray-900 text-xs" value={editForm.dueDate} onChange={e => setEditForm({...editForm, dueDate: e.target.value})} />
                          ) : (
                             <span className={new Date(tx.dueDate) < new Date() && tx.status !== 'PAID' ? 'text-red-600 font-bold' : 'text-gray-600'}>{tx.dueDate}</span>
                          )}
                       </td>
                       <td className={`p-3 text-right font-medium ${isIncome ? 'text-blue-600' : 'text-rose-600'}`}>
                          {isEditing ? (
                             <input type="text" className="border p-1 rounded bg-white text-gray-900 text-right text-xs w-24" value={formatMoneyInput(Math.abs(editForm.amount || 0))} onChange={e => setEditForm({...editForm, amount: (isIncome ? 1 : -1) * parseMoneyInput(e.target.value)})} />
                          ) : (
                             formatMoney(Math.abs(tx.amount))
                          )}
                       </td>
                       <td className="p-3 text-center">
                          {isEditing ? (
                             <select className="border p-1 rounded bg-white text-gray-900 text-xs" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as any})}>
                                <option value="UNPAID">미납</option>
                                <option value="PAID">완납</option>
                                <option value="OVERDUE">연체</option>
                             </select>
                          ) : (
                             <button 
                               onClick={() => onUpdateStatus(tx.id, tx.status === 'PAID' ? 'UNPAID' : 'PAID')}
                               className={`px-2 py-1 rounded text-xs font-bold border transition-all flex items-center gap-1 mx-auto ${
                                 tx.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 
                                 tx.status === 'OVERDUE' ? 'bg-red-50 text-red-700 border-red-200' : 
                                 isFuture ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                               }`}
                             >
                               {tx.status === 'PAID' ? '완납 확인' : 
                                tx.status === 'OVERDUE' ? <><AlertCircle size={10}/> 연체중</> : 
                                isFuture ? <><Clock size={10}/> 예정</> : '미납'}
                             </button>
                          )}
                       </td>
                       <td className="p-3 text-center">
                          {isEditing ? (
                             <div className="flex items-center justify-center gap-1">
                                <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16}/></button>
                                <button onClick={cancelEdit} className="p-1 text-gray-500 hover:bg-gray-200 rounded"><X size={16}/></button>
                             </div>
                          ) : (
                             <button onClick={() => startEdit(tx)} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                                <Edit2 size={16}/>
                             </button>
                          )}
                       </td>
                     </tr>
                   );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
    