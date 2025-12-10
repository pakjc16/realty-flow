
import React, { useState, useMemo } from 'react';
import { Property, ValuationHistory, MarketComparable, AreaUnit } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Plus, MapPin, Calculator, Building, Layers, Search, Save, X, Edit2, Trash2, ArrowRight, CheckSquare, Square, RotateCcw } from 'lucide-react';

interface ValuationManagerProps {
  properties: Property[];
  valuations: ValuationHistory[];
  comparables: MarketComparable[];
  onAddValuation: (val: ValuationHistory) => void;
  onUpdateValuation: (val: ValuationHistory) => void;
  onDeleteValuation: (id: string) => void;
  onAddComparable: (comp: MarketComparable) => void;
  formatMoney: (amount: number) => string;
  formatArea: (areaM2: number) => string;
  formatNumberInput: (num: number | undefined | null) => string;
  parseNumberInput: (str: string) => number;
  formatMoneyInput: (amount: number | undefined | null) => string;
  parseMoneyInput: (str: string) => number;
  moneyLabel: string;
  areaUnit: AreaUnit;
}

export const ValuationManager: React.FC<ValuationManagerProps> = ({
  properties, valuations, comparables, onAddValuation, onUpdateValuation, onDeleteValuation, onAddComparable, formatMoney, formatArea, formatNumberInput, parseNumberInput, formatMoneyInput, parseMoneyInput, moneyLabel, areaUnit
}) => {
  // MULTI-SELECT STATE
  const [selectedPropIds, setSelectedPropIds] = useState<string[]>(properties.map(p => p.id));
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MARKET_RENT'>('OVERVIEW');

  // Input States
  const [editingValuationId, setEditingValuationId] = useState<string | null>(null);
  const [valuationForm, setValuationForm] = useState<Partial<ValuationHistory>>({ year: new Date().getFullYear(), officialValue: 0, marketValue: 0 });
  const [targetForValuation, setTargetForValuation] = useState<{id: string, type: 'LOT' | 'BUILDING'} | null>(null);
  
  const [newComp, setNewComp] = useState<Partial<MarketComparable>>({ 
    name: '', address: '', date: new Date().toISOString().split('T')[0], 
    deposit: 0, monthlyRent: 0, adminFee: 0, area: 0, floor: 1, distance: 0 
  });

  const togglePropertySelection = (id: string) => {
    setSelectedPropIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedPropIds.length === properties.length) {
      setSelectedPropIds([]);
    } else {
      setSelectedPropIds(properties.map(p => p.id));
    }
  };

  // --- Aggregate Logic ---
  const aggregatedData = useMemo(() => {
    if (selectedPropIds.length === 0) return [];
    
    const selectedProperties = properties.filter(p => selectedPropIds.includes(p.id));
    
    // Collect all relevant valuation entries
    const relatedLotIds = selectedProperties.flatMap(p => p.lots.map(l => l.id));
    const relatedBldgIds = selectedProperties.flatMap(p => p.buildings.map(b => b.id));
    const allTargetIds = [...relatedLotIds, ...relatedBldgIds];
    
    const relevantValuations = valuations.filter(v => allTargetIds.includes(v.targetId));
    const years = Array.from(new Set(relevantValuations.map(v => v.year))).sort();

    return years.map(year => {
        let totalOfficialLand = 0;
        let totalMarketLand = 0;
        let totalOfficialBldg = 0;
        let totalMarketBldg = 0;

        selectedProperties.forEach(prop => {
            // Sum Lots
            prop.lots.forEach(lot => {
                const val = relevantValuations.find(v => v.targetId === lot.id && v.year === year);
                if (val) {
                    totalOfficialLand += val.officialValue * lot.area;
                    totalMarketLand += (val.marketValue || 0) * lot.area;
                }
            });
            // Sum Buildings
            prop.buildings.forEach(b => {
                const val = relevantValuations.find(v => v.targetId === b.id && v.year === year);
                if (val) {
                    totalOfficialBldg += val.officialValue; 
                    totalMarketBldg += (val.marketValue || 0);
                }
            });
        });

        return {
            year,
            officialLand: totalOfficialLand,
            marketLand: totalMarketLand,
            officialBldg: totalOfficialBldg,
            marketBldg: totalMarketBldg,
            totalMarket: totalMarketLand + totalMarketBldg,
            totalOfficial: totalOfficialLand + totalOfficialBldg
        };
    });
  }, [selectedPropIds, properties, valuations]);

  const latestStats = aggregatedData.length > 0 ? aggregatedData[aggregatedData.length - 1] : { officialLand: 0, marketLand: 0, officialBldg: 0, marketBldg: 0, totalMarket: 0, totalOfficial: 0 };

  // NOC Calculation
  const calculateNOC = (deposit: number, rent: number, admin: number, area: number) => {
    if (!area || area === 0) return 0;
    
    const py = area * 0.3025;
    const size = areaUnit === 'PYEONG' ? py : area;
    
    const interestRate = 0.05; // 5% assumption
    const monthlyInterest = (deposit * interestRate) / 12;
    const totalMonthlyCost = rent + admin + monthlyInterest;
    
    return Math.round(totalMonthlyCost / size);
  };

  // --- Handlers ---
  const openAddValuation = (targetId: string, type: 'LOT' | 'BUILDING') => {
    setEditingValuationId(null);
    setTargetForValuation({ id: targetId, type });
    setValuationForm({ year: new Date().getFullYear(), officialValue: 0, marketValue: 0, note: '' });
  };

  const openEditValuation = (val: ValuationHistory, type: 'LOT' | 'BUILDING') => {
    setEditingValuationId(val.id);
    setTargetForValuation({ id: val.targetId, type });
    setValuationForm({ ...val });
  };

  const handleSaveValuation = () => {
    if (!targetForValuation) return;
    
    const newVal: ValuationHistory = {
      id: editingValuationId || `val${Date.now()}`,
      targetId: targetForValuation.id,
      targetType: targetForValuation.type,
      year: Number(valuationForm.year),
      officialValue: Number(valuationForm.officialValue),
      marketValue: Number(valuationForm.marketValue),
      note: valuationForm.note
    };

    if (editingValuationId) {
      onUpdateValuation(newVal);
    } else {
      onAddValuation(newVal);
    }
    setTargetForValuation(null);
    setEditingValuationId(null);
  };

  const handleDeleteValuation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('정말 삭제하시겠습니까?')) {
        onDeleteValuation(id);
        if (editingValuationId === id) {
            setTargetForValuation(null);
            setEditingValuationId(null);
        }
    }
  };

  const handleSaveComp = () => {
    if (selectedPropIds.length === 0) return alert('비교할 자산을 선택해주세요.');
    if (!newComp.name) return alert('명칭은 필수입니다.');
    
    // Assign to first selected property for now, or could ask user
    const targetPropId = selectedPropIds[0];

    onAddComparable({
      id: `comp${Date.now()}`,
      propertyId: targetPropId,
      name: newComp.name!,
      address: newComp.address,
      date: newComp.date!,
      deposit: Number(newComp.deposit),
      monthlyRent: Number(newComp.monthlyRent),
      adminFee: Number(newComp.adminFee),
      area: Number(newComp.area),
      floor: Number(newComp.floor),
      distance: Number(newComp.distance),
      note: newComp.note
    });
    setNewComp({ name: '', address:'', date: new Date().toISOString().split('T')[0], deposit: 0, monthlyRent: 0, adminFee: 0, area: 0, floor: 1, distance: 0, note: '' });
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* SIDEBAR: Multi-Select Property Selector */}
      <div className="w-full lg:w-64 bg-white rounded-lg border border-gray-200 shadow-sm flex-shrink-0 h-fit">
         <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
               <Building size={16} className="text-indigo-600"/> 자산 선택
            </h3>
            <button onClick={toggleAll} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                {selectedPropIds.length === properties.length ? '전체 해제' : '전체 선택'}
            </button>
         </div>
         <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
            {properties.map(p => (
               <div 
                  key={p.id} 
                  onClick={() => togglePropertySelection(p.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${selectedPropIds.includes(p.id) ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'}`}
               >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedPropIds.includes(p.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                      {selectedPropIds.includes(p.id) && <CheckSquare size={12} className="text-white"/>}
                  </div>
                  <span className={selectedPropIds.includes(p.id) ? 'text-indigo-900' : 'text-gray-600'}>{p.name}</span>
               </div>
            ))}
         </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedPropIds.length > 0 ? (
          <div className="space-y-6">
             {/* HEADER */}
             <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                   <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Layers size={24} className="text-indigo-600"/>
                      통합 자산 가치 평가
                   </h2>
                   <p className="text-sm text-gray-500 mt-1">
                      선택된 {selectedPropIds.length}개 자산의 합산 가치 및 비교 분석
                   </p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                   <button onClick={() => setActiveTab('OVERVIEW')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'OVERVIEW' ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>자산 가치 합산</button>
                   <button onClick={() => setActiveTab('MARKET_RENT')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'MARKET_RENT' ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>임대 시세 분석</button>
                </div>
             </div>

             {activeTab === 'OVERVIEW' && (
               <>
                 {/* SUMMARY CARDS */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
                       <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">총 대지 가치 (공시지가 합계)</p>
                       <div className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(latestStats.officialLand)}</div>
                       <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <TrendingUp size={12}/> 시장 추정: {formatMoney(latestStats.marketLand)}
                       </div>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
                       <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">총 건물 가치 (시가표준액 합계)</p>
                       <div className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(latestStats.officialBldg)}</div>
                       <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <TrendingUp size={12}/> 시장 추정: {formatMoney(latestStats.marketBldg)}
                       </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-5 rounded-lg shadow-md text-white">
                       <p className="text-xs font-bold text-indigo-200 uppercase tracking-wide">포트폴리오 총 추정 가치</p>
                       <div className="text-3xl font-bold mt-1">{formatMoney(latestStats.totalMarket)}</div>
                       <p className="text-xs text-indigo-200 mt-2 opacity-80">
                          공시가 대비 {(latestStats.totalOfficial > 0 ? (latestStats.totalMarket / latestStats.totalOfficial * 100) : 0).toFixed(0)}% 수준
                       </p>
                    </div>
                 </div>

                 {/* CHART */}
                 <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">포트폴리오 가치 변동 추이</h3>
                    <div className="h-72">
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={aggregatedData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                             <XAxis 
                                dataKey="year" 
                                type="category"
                                padding={{ left: 30, right: 30 }}
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill:'#6b7280', fontSize:12}} 
                                dy={10}
                             />
                             <YAxis axisLine={false} tickLine={false} tick={{fill:'#6b7280', fontSize:12}} width={80} tickFormatter={(val) => (val/100000000).toFixed(0)+'억'}/>
                             <Tooltip 
                                contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                                formatter={(val:number) => [formatMoney(val), '']}
                             />
                             <Legend wrapperStyle={{paddingTop:'20px'}}/>
                             <Line type="monotone" dataKey="totalOfficial" name="공시가 합계" stroke="#6366f1" strokeWidth={3} dot={{r:4, strokeWidth:2}} activeDot={{r:6}}/>
                             <Line type="monotone" dataKey="totalMarket" name="시장가 합계" stroke="#10b981" strokeWidth={3} dot={{r:4, strokeWidth:2}} activeDot={{r:6}}/>
                          </LineChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 {/* DETAILED LIST BY PROPERTY */}
                 <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 text-lg">자산별 상세 평가 내역</h3>
                    {properties.filter(p => selectedPropIds.includes(p.id)).map(prop => {
                        const isTargetHere = targetForValuation && (
                            prop.lots.some(l => l.id === targetForValuation.id) ||
                            prop.buildings.some(b => b.id === targetForValuation.id)
                        );

                        return (
                        <div key={prop.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
                            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <MapPin size={16} className="text-gray-500"/> {prop.name}
                                </h4>
                            </div>
                            
                            {/* Inline Form if this property's asset is being edited/added */}
                            {isTargetHere && (
                                <div className="p-4 bg-indigo-50 border-b border-indigo-100 animate-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-indigo-800 text-sm flex items-center gap-2">
                                            {editingValuationId ? <Edit2 size={16}/> : <Plus size={16}/>} 
                                            {editingValuationId ? '평가 내역 수정' : '신규 평가 추가'} ({targetForValuation?.type === 'LOT' ? '토지' : '건물'})
                                        </h4>
                                        <button onClick={() => setTargetForValuation(null)} className="text-gray-500 hover:text-gray-700"><X size={18}/></button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">기준 연도</label>
                                            <input type="number" className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={valuationForm.year} onChange={e => setValuationForm({...valuationForm, year: Number(e.target.value)})}/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">
                                                {targetForValuation?.type === 'LOT' ? '공시지가 (원/m²)' : '시가표준액 (원)'}
                                            </label>
                                            <input type="text" className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={formatNumberInput(valuationForm.officialValue)} onChange={e => setValuationForm({...valuationForm, officialValue: parseNumberInput(e.target.value)})}/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">
                                                {targetForValuation?.type === 'LOT' ? '시장 추정가 (원/m²)' : '시장 추정가 (원)'}
                                            </label>
                                            <input type="text" className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={formatNumberInput(valuationForm.marketValue)} onChange={e => setValuationForm({...valuationForm, marketValue: parseNumberInput(e.target.value)})}/>
                                        </div>
                                        <div className="flex gap-2">
                                            {editingValuationId && <button onClick={() => setTargetForValuation(null)} className="flex-1 bg-white border border-gray-300 text-gray-600 font-bold text-sm py-2.5 rounded shadow-sm hover:bg-gray-50">취소</button>}
                                            <button onClick={handleSaveValuation} className="flex-1 bg-indigo-600 text-white font-bold text-sm py-2.5 px-4 rounded shadow-sm hover:bg-indigo-700">
                                                {editingValuationId ? '수정 저장' : '저장'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <input type="text" placeholder="비고" className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded text-xs outline-none" value={valuationForm.note || ''} onChange={e => setValuationForm({...valuationForm, note: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100 text-xs uppercase">
                                        <tr>
                                            <th className="p-3 pl-4">대상</th>
                                            <th className="p-3">규모</th>
                                            <th className="p-3 text-right">최근 공시가</th>
                                            <th className="p-3 text-right">최근 시장가</th>
                                            <th className="p-3 text-center">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {/* Lots */}
                                        {prop.lots.map(lot => {
                                            const vals = valuations.filter(v => v.targetId === lot.id).sort((a,b) => b.year - a.year);
                                            const latest = vals[0];
                                            return (
                                                <React.Fragment key={lot.id}>
                                                    <tr className="hover:bg-gray-50 group">
                                                        <td className="p-3 pl-4">
                                                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                                                <Layers size={14} className="text-gray-400"/>
                                                                {lot.address.dong} {lot.address.bonbun}-{lot.address.bubun}
                                                            </div>
                                                            <div className="text-xs text-gray-500 ml-6">{lot.jimok}</div>
                                                        </td>
                                                        <td className="p-3 text-gray-600">{formatArea(lot.area)}</td>
                                                        <td className="p-3 text-right">
                                                            {latest ? (
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{formatMoney(latest.officialValue)}<span className="text-xs text-gray-400 font-normal">/㎡</span></div>
                                                                    <div className="text-xs text-gray-400">({latest.year}년)</div>
                                                                </div>
                                                            ) : <span className="text-gray-300">-</span>}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            {latest && latest.marketValue ? (
                                                                <div className="font-medium text-emerald-600">{formatMoney(latest.marketValue)}<span className="text-xs text-emerald-400 font-normal">/㎡</span></div>
                                                            ) : <span className="text-gray-300">-</span>}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button onClick={() => openAddValuation(lot.id, 'LOT')} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="새 평가 추가"><Plus size={16}/></button>
                                                        </td>
                                                    </tr>
                                                    {/* History Expansion */}
                                                    {vals.length > 0 && (
                                                        <tr className="bg-gray-50/50">
                                                            <td colSpan={5} className="p-2 pl-10">
                                                                <div className="flex gap-2 flex-wrap">
                                                                    {vals.map(v => (
                                                                        <div key={v.id} className="text-xs bg-white border border-gray-200 rounded px-2 py-1 flex items-center gap-2 group/tag shadow-sm hover:shadow-md transition-shadow">
                                                                            <span className="font-bold text-gray-700 bg-gray-100 px-1 rounded">{v.year}년</span>
                                                                            <span className="text-gray-600">{formatMoney(v.officialValue)}</span>
                                                                            <div className="flex border-l border-gray-200 pl-1 ml-1 gap-1">
                                                                                <button onClick={() => openEditValuation(v, 'LOT')} className="text-indigo-400 hover:text-indigo-600 transition-colors" title="수정"><Edit2 size={12}/></button>
                                                                                <button onClick={(e) => handleDeleteValuation(v.id, e)} className="text-red-400 hover:text-red-600 transition-colors" title="삭제"><Trash2 size={12}/></button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                        {/* Buildings */}
                                        {prop.buildings.map(b => {
                                            const vals = valuations.filter(v => v.targetId === b.id).sort((a,b) => b.year - a.year);
                                            const latest = vals[0];
                                            return (
                                                <React.Fragment key={b.id}>
                                                    <tr className="hover:bg-gray-50 group">
                                                        <td className="p-3 pl-4">
                                                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                                                <Building size={14} className="text-gray-400"/>
                                                                {b.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 ml-6">{b.spec.mainUsage}</div>
                                                        </td>
                                                        <td className="p-3 text-gray-600">연면적 {formatArea(b.spec.grossFloorArea)}</td>
                                                        <td className="p-3 text-right">
                                                            {latest ? (
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{formatMoney(latest.officialValue)}</div>
                                                                    <div className="text-xs text-gray-400">({latest.year}년)</div>
                                                                </div>
                                                            ) : <span className="text-gray-300">-</span>}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            {latest && latest.marketValue ? (
                                                                <div className="font-medium text-emerald-600">{formatMoney(latest.marketValue)}</div>
                                                            ) : <span className="text-gray-300">-</span>}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button onClick={() => openAddValuation(b.id, 'BUILDING')} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="새 평가 추가"><Plus size={16}/></button>
                                                        </td>
                                                    </tr>
                                                    {vals.length > 0 && (
                                                        <tr className="bg-gray-50/50">
                                                            <td colSpan={5} className="p-2 pl-10">
                                                                <div className="flex gap-2 flex-wrap">
                                                                    {vals.map(v => (
                                                                        <div key={v.id} className="text-xs bg-white border border-gray-200 rounded px-2 py-1 flex items-center gap-2 group/tag shadow-sm hover:shadow-md transition-shadow">
                                                                            <span className="font-bold text-gray-700 bg-gray-100 px-1 rounded">{v.year}년</span>
                                                                            <span className="text-gray-600">{formatMoney(v.officialValue)}</span>
                                                                            <div className="flex border-l border-gray-200 pl-1 ml-1 gap-1">
                                                                                <button onClick={() => openEditValuation(v, 'BUILDING')} className="text-indigo-400 hover:text-indigo-600 transition-colors" title="수정"><Edit2 size={12}/></button>
                                                                                <button onClick={(e) => handleDeleteValuation(v.id, e)} className="text-red-400 hover:text-red-600 transition-colors" title="삭제"><Trash2 size={12}/></button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        );
                    })}
                 </div>
               </>
             )}

             {activeTab === 'MARKET_RENT' && (
                <div className="space-y-6">
                   {/* Comps Registration - GRID LAYOUT */}
                   <div className="bg-white rounded-lg border border-orange-100 shadow-sm p-6">
                      <h4 className="font-bold text-orange-800 mb-6 flex items-center gap-2 text-lg border-b border-orange-100 pb-2">
                         <Calculator size={20}/> 임대 시세 사례 등록
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                         <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">사례명 (건물명)</label>
                            <input type="text" className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="예: 역삼동 스타빌딩" value={newComp.name} onChange={e => setNewComp({...newComp, name: e.target.value})}/>
                         </div>
                         <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">상세 주소</label>
                            <input type="text" className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="주소 입력" value={newComp.address || ''} onChange={e => setNewComp({...newComp, address: e.target.value})}/>
                         </div>
                         
                         <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">전용면적</label>
                            <div className="relative">
                               <input type="text" className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="0" value={formatNumberInput(newComp.area)} onChange={e => setNewComp({...newComp, area: parseNumberInput(e.target.value)})}/>
                               <span className="absolute right-3 top-2.5 text-xs text-gray-400">m²</span>
                            </div>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">해당 층수</label>
                            <input type="number" className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="1" value={newComp.floor} onChange={e => setNewComp({...newComp, floor: Number(e.target.value)})}/>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">조사일</label>
                            <input type="date" className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={newComp.date} onChange={e => setNewComp({...newComp, date: e.target.value})}/>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">거리 (m)</label>
                            <input type="number" className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="직선거리" value={newComp.distance} onChange={e => setNewComp({...newComp, distance: Number(e.target.value)})}/>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                         <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">보증금</label>
                            <input type="text" className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={formatMoneyInput(newComp.deposit)} onChange={e => setNewComp({...newComp, deposit: parseMoneyInput(e.target.value)})}/>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">월 임대료</label>
                            <input type="text" className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={formatMoneyInput(newComp.monthlyRent)} onChange={e => setNewComp({...newComp, monthlyRent: parseMoneyInput(e.target.value)})}/>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">월 관리비</label>
                            <input type="text" className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={formatMoneyInput(newComp.adminFee)} onChange={e => setNewComp({...newComp, adminFee: parseMoneyInput(e.target.value)})}/>
                         </div>
                      </div>

                      <div className="flex justify-end">
                         <button onClick={handleSaveComp} className="px-8 py-3 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700 shadow-md transition-colors flex items-center gap-2">
                            <Plus size={18}/> 사례 데이터 추가
                         </button>
                      </div>
                   </div>

                   {/* Comps Table */}
                   <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                         <div>
                            <h3 className="font-bold text-gray-800">임대 시세 비교 분석</h3>
                            <p className="text-xs text-gray-500 mt-1">* NOC: (월임대료 + 관리비 + 보증금운용수익) / 전용평(3.3㎡)</p>
                         </div>
                      </div>
                      <div className="overflow-x-auto">
                         <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                               <tr>
                                  <th className="p-4">사례명 (위치)</th>
                                  <th className="p-4 text-center">거리</th>
                                  <th className="p-4 text-right">전용면적</th>
                                  <th className="p-4 text-right">보증금</th>
                                  <th className="p-4 text-right">월 임대료</th>
                                  <th className="p-4 text-right">관리비</th>
                                  <th className="p-4 text-right bg-indigo-50 text-indigo-700 border-l border-indigo-100">
                                     NOC (/{areaUnit === 'PYEONG' ? '평' : '㎡'})
                                  </th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                               {comparables.filter(c => selectedPropIds.includes(c.propertyId)).map(comp => {
                                  const noc = calculateNOC(comp.deposit, comp.monthlyRent, comp.adminFee, comp.area);
                                  return (
                                     <tr key={comp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                           <div className="font-bold text-gray-900">{comp.name}</div>
                                           <div className="text-xs text-gray-500">{comp.address} ({comp.floor}층)</div>
                                        </td>
                                        <td className="p-4 text-center text-gray-500">{comp.distance}m</td>
                                        <td className="p-4 text-right text-gray-900">
                                            <div>{formatArea(comp.area)}</div>
                                        </td>
                                        <td className="p-4 text-right text-gray-600">{formatMoney(comp.deposit)}</td>
                                        <td className="p-4 text-right font-medium text-gray-900">{formatMoney(comp.monthlyRent)}</td>
                                        <td className="p-4 text-right text-gray-600">{formatMoney(comp.adminFee)}</td>
                                        <td className="p-4 text-right font-bold text-indigo-700 bg-indigo-50/30 border-l border-indigo-100">
                                            {formatNumberInput(noc)}원
                                        </td>
                                     </tr>
                                  );
                               })}
                               {comparables.filter(c => selectedPropIds.includes(c.propertyId)).length === 0 && (
                                  <tr><td colSpan={7} className="p-10 text-center text-gray-400">선택된 자산에 등록된 시세 비교 사례가 없습니다.</td></tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </div>
             )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
             <div className="text-center">
                <Search size={48} className="mx-auto mb-4 text-gray-200"/>
                <p>평가할 자산을 왼쪽 목록에서 선택해주세요.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
