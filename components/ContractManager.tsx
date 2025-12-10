
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { LeaseContract, MaintenanceContract, Stakeholder, Property, Unit, LeaseType, ManagementItem, ContractTargetType, LeaseFinancialTerm } from '../types';
import { FileText, Calendar, DollarSign, Plus, X, ArrowUpRight, ArrowDownLeft, Shuffle, Wrench, Briefcase, Edit2, Trash2, Calculator, Percent, CheckCircle } from 'lucide-react';

interface ContractManagerProps {
  leaseContracts: LeaseContract[];
  maintenanceContracts: MaintenanceContract[];
  stakeholders: Stakeholder[];
  properties: Property[];
  units: Unit[];
  onAddLease: (contract: LeaseContract) => void;
  onUpdateLease: (contract: LeaseContract) => void;
  onAddMaintenance: (contract: MaintenanceContract) => void;
  onUpdateMaintenance: (contract: MaintenanceContract) => void;
  formatMoney: (amount: number) => string;
  formatNumberInput: (num: number | undefined | null) => string;
  parseNumberInput: (str: string) => number;
  formatMoneyInput: (amount: number | undefined | null) => string;
  parseMoneyInput: (str: string) => number;
  moneyLabel: string;
}

const ITEM_LABELS: Record<ManagementItem, string> = {
  ELECTRICITY: '전기',
  WATER: '수도',
  GAS: '가스',
  INTERNET: '인터넷',
  TV: 'TV수신료',
  CLEANING: '청소비',
  ELEVATOR: '승강기유지비',
  SECURITY: '보안/경비',
  PARKING: '주차비'
};

export const ContractManager: React.FC<ContractManagerProps> = ({ 
  leaseContracts, maintenanceContracts, stakeholders, properties, units, onAddLease, onUpdateLease, onAddMaintenance, onUpdateMaintenance, formatMoney, formatNumberInput, parseNumberInput, formatMoneyInput, parseMoneyInput, moneyLabel
}) => {
  const [activeTab, setActiveTab] = useState<'LEASE' | 'MAINTENANCE'>('LEASE');
  const [isAdding, setIsAdding] = useState(false);
  const [formType, setFormType] = useState<'LEASE' | 'MAINTENANCE'>('LEASE');
  const [editingContractId, setEditingContractId] = useState<string | null>(null);

  // Lease Form State
  const [newLease, setNewLease] = useState<Partial<LeaseContract>>({
    type: 'LEASE_OUT',
    targetType: 'UNIT',
    targetId: '',
    term: { contractDate: '', startDate: '', endDate: '', extensionType: 'NEW' },
    financialTerms: [],
    conditions: []
  });

  // Financial Term Management State
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [newTerm, setNewTerm] = useState<Partial<LeaseFinancialTerm>>({
     startDate: '', endDate: '', deposit: 0, monthlyRent: 0, vatIncluded: false, 
     paymentDay: 1, paymentType: 'POSTPAID', adminFee: 0, managementItems: [], note: ''
  });

  // Rent Calculator State
  const [increaseRate, setIncreaseRate] = useState<string>('5');
  const [showCalculator, setShowCalculator] = useState(false);

  // Maintenance Form State
  const [newMaintenance, setNewMaintenance] = useState<Partial<MaintenanceContract>>({
    serviceType: 'CLEANING',
    targetType: 'PROPERTY',
    targetId: '',
    monthlyCost: 0,
    term: { startDate: '', endDate: '' },
    details: ''
  });
  
  const [selectedPropId, setSelectedPropId] = useState('');
  const [selectedBldgId, setSelectedBldgId] = useState('');
  
  const selectedProperty = properties.find(p => p.id === selectedPropId);
  const buildings = selectedProperty ? selectedProperty.buildings : [];
  const filteredUnits = selectedBldgId ? units.filter(u => u.buildingId === selectedBldgId) : [];
  
  const vendorStakeholders = stakeholders.filter(s => s.roles.includes('VENDOR') || s.roles.includes('MANAGER'));
  
  const findName = (id: string) => stakeholders.find(s => s.id === id)?.name || '미지정';
  
  const findTargetName = (type: ContractTargetType, id: string) => {
      if (type === 'PROPERTY') return properties.find(p => p.id === id)?.name || '알 수 없음';
      if (type === 'BUILDING') {
          for(const p of properties) {
              const b = p.buildings.find(b => b.id === id);
              if(b) return `${p.name} ${b.name}`;
          }
      }
      if (type === 'UNIT') {
          const u = units.find(u => u.id === id);
          if(u) {
              const p = properties.find(p => p.id === u.propertyId);
              const b = p?.buildings.find(b => b.id === u.buildingId);
              return `${p?.name} ${b?.name} ${u.unitNumber}호`;
          }
      }
      return '알 수 없음';
  };

  // --- Financial Term Handlers ---
  const handleManagementItemToggle = (item: ManagementItem) => {
    const currentItems = newTerm.managementItems || [];
    const newItems = currentItems.includes(item) ? currentItems.filter(i => i !== item) : [...currentItems, item];
    setNewTerm({ ...newTerm, managementItems: newItems });
  };

  const handleApplyIncrease = () => {
    // Find the latest term to base the increase on
    const currentTerms = newLease.financialTerms || [];
    if (currentTerms.length === 0) {
        alert('이전 계약 내역이 없어 인상률을 적용할 수 없습니다. 첫 계약 정보를 직접 입력해주세요.');
        return;
    }
    // Sort by date desc
    const sortedTerms = [...currentTerms].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const baseTerm = sortedTerms[0];
    
    const rate = parseFloat(increaseRate);
    if (isNaN(rate)) {
        alert('올바른 인상률(숫자)을 입력해주세요.');
        return;
    }

    const newDeposit = Math.floor((baseTerm.deposit * (1 + rate / 100)) / 1000) * 1000; // Round to nearest 1000
    const newRent = Math.floor((baseTerm.monthlyRent * (1 + rate / 100)) / 1000) * 1000;

    setNewTerm({
        ...newTerm,
        deposit: newDeposit,
        monthlyRent: newRent,
        adminFee: baseTerm.adminFee, // Usually admin fee doesn't increase by rate automatically
        vatIncluded: baseTerm.vatIncluded,
        paymentDay: baseTerm.paymentDay,
        paymentType: baseTerm.paymentType,
        managementItems: [...baseTerm.managementItems],
        note: `직전 대비 ${rate}% 인상 적용`
    });
    alert(`직전 조건 대비 ${rate}% 인상된 금액이 적용되었습니다.\n(천원 단위 절사)`);
  };

  const handleSaveTerm = () => {
    if(!newTerm.startDate || !newTerm.endDate) return alert('적용 시작일과 종료일은 필수입니다.');
    
    let updatedTerms = [...(newLease.financialTerms || [])];
    if(editingTermId) {
       updatedTerms = updatedTerms.map(t => t.id === editingTermId ? { ...newTerm, id: editingTermId } as LeaseFinancialTerm : t);
    } else {
       updatedTerms.push({ ...newTerm, id: `ft${Date.now()}` } as LeaseFinancialTerm);
    }
    // Sort by date descending (Newest first)
    updatedTerms.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    setNewLease({ ...newLease, financialTerms: updatedTerms });
    setNewTerm({ startDate: '', endDate: '', deposit: 0, monthlyRent: 0, vatIncluded: false, paymentDay: 1, paymentType: 'POSTPAID', adminFee: 0, managementItems: [], note: '' });
    setEditingTermId(null);
  };

  const handleEditTerm = (term: LeaseFinancialTerm) => {
    setEditingTermId(term.id);
    setNewTerm({...term, managementItems: [...term.managementItems]});
  };

  const handleDeleteTerm = (id: string) => {
    if(!confirm('삭제하시겠습니까?')) return;
    setNewLease({ ...newLease, financialTerms: newLease.financialTerms?.filter(t => t.id !== id) });
  };

  // --- Contract Handlers ---
  const handleEditLease = (contract: LeaseContract) => {
    setFormType('LEASE');
    setEditingContractId(contract.id);
    setNewLease({
      ...contract,
      term: { ...contract.term },
      financialTerms: contract.financialTerms.map(t => ({...t, managementItems: [...t.managementItems]})),
      conditions: [...contract.conditions]
    });
    setNewTerm({ startDate: '', endDate: '', deposit: 0, monthlyRent: 0, vatIncluded: false, paymentDay: 1, paymentType: 'POSTPAID', adminFee: 0, managementItems: [], note: '' });

    // Determine Property/Building ID
    let propId = '';
    let bldgId = '';
    if (contract.targetType === 'PROPERTY') propId = contract.targetId;
    else if (contract.targetType === 'BUILDING') {
      const p = properties.find(p => p.buildings.some(b => b.id === contract.targetId));
      if (p) { propId = p.id; bldgId = contract.targetId; }
    } else if (contract.targetType === 'UNIT') {
      const u = units.find(u => u.id === contract.targetId);
      if (u) { propId = u.propertyId; bldgId = u.buildingId; }
    }
    
    setSelectedPropId(propId);
    setSelectedBldgId(bldgId);
    setIsAdding(true);
  };

  const handleEditMaintenance = (contract: MaintenanceContract) => {
    setFormType('MAINTENANCE');
    setEditingContractId(contract.id);
    setNewMaintenance({ ...contract, term: { ...contract.term } });

    let propId = '';
    let bldgId = '';
    if (contract.targetType === 'PROPERTY') propId = contract.targetId;
    else if (contract.targetType === 'BUILDING') {
      const p = properties.find(p => p.buildings.some(b => b.id === contract.targetId));
      if (p) { propId = p.id; bldgId = contract.targetId; }
    } else if (contract.targetType === 'UNIT') {
      const u = units.find(u => u.id === contract.targetId);
      if (u) { propId = u.propertyId; bldgId = u.buildingId; }
    }

    setSelectedPropId(propId);
    setSelectedBldgId(bldgId);
    setIsAdding(true);
  };

  const handleSaveLease = () => {
    let targetId = '';
    if(newLease.targetType === 'PROPERTY') targetId = selectedPropId;
    if(newLease.targetType === 'BUILDING') targetId = selectedBldgId;
    if(newLease.targetType === 'UNIT') targetId = newLease.targetId || '';

    if(!targetId || !newLease.tenantId || !newLease.term?.startDate) return alert('필수 정보(대상, 계약자, 기간)를 입력하세요.');
    if(!newLease.financialTerms || newLease.financialTerms.length === 0) return alert('최소 1개 이상의 임대 조건을 등록해야 합니다.');

    const contract: LeaseContract = {
      id: editingContractId || `lc${Date.now()}`,
      type: newLease.type || 'LEASE_OUT',
      targetType: newLease.targetType || 'UNIT',
      targetId: targetId,
      tenantId: newLease.tenantId,
      status: 'ACTIVE',
      term: newLease.term as any,
      financialTerms: newLease.financialTerms,
      conditions: newLease.conditions || []
    };
    
    editingContractId ? onUpdateLease(contract) : onAddLease(contract);
    resetForms();
  };

  const handleSaveMaintenance = () => {
    let targetId = '';
    if(newMaintenance.targetType === 'PROPERTY') targetId = selectedPropId;
    if(newMaintenance.targetType === 'BUILDING') targetId = selectedBldgId;
    if(newMaintenance.targetType === 'UNIT') targetId = newMaintenance.targetId || '';

    if(!targetId || !newMaintenance.vendorId || !newMaintenance.term?.startDate) return alert('필수 정보(대상, 업체, 기간)를 입력하세요.');

    const contract: MaintenanceContract = {
      id: editingContractId || `mc${Date.now()}`,
      targetType: newMaintenance.targetType || 'PROPERTY',
      targetId: targetId,
      vendorId: newMaintenance.vendorId!,
      serviceType: newMaintenance.serviceType as any,
      status: 'ACTIVE',
      term: newMaintenance.term as any,
      monthlyCost: Number(newMaintenance.monthlyCost),
      details: newMaintenance.details || ''
    };
    
    editingContractId ? onUpdateMaintenance(contract) : onAddMaintenance(contract);
    resetForms();
  };

  const resetForms = () => {
    setIsAdding(false);
    setEditingContractId(null);
    setFormType('LEASE');
    setNewLease({
      type: 'LEASE_OUT', targetType: 'UNIT',
      term: { contractDate: '', startDate: '', endDate: '', extensionType: 'NEW' },
      financialTerms: [], conditions: []
    });
    setNewMaintenance({ serviceType: 'CLEANING', targetType: 'PROPERTY', monthlyCost: 0, term: { startDate: '', endDate: '' }, details: '' });
    setSelectedPropId('');
    setSelectedBldgId('');
    setNewTerm({ startDate: '', endDate: '', deposit: 0, monthlyRent: 0, vatIncluded: false, paymentDay: 1, paymentType: 'POSTPAID', adminFee: 0, managementItems: [], note: '' });
    setEditingTermId(null);
    setShowCalculator(false);
  };

  // Helper to find active financial term
  const getActiveTerm = (c: LeaseContract) => {
      // Find latest term where today falls within start and end date
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const activeTerm = c.financialTerms.find(t => {
          const start = new Date(t.startDate);
          const end = new Date(t.endDate);
          return today >= start && today <= end;
      });
      
      if (activeTerm) return activeTerm;
      
      // Fallback to latest start date if none active or all future/past
      return [...c.financialTerms].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">계약 종합 관리</h2>
          <p className="text-sm text-gray-500">임대차 및 시설 유지보수 계약 현황</p>
        </div>
        <button 
          onClick={() => { resetForms(); setIsAdding(true); }}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all active:scale-95 w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> 신규 계약 등록
        </button>
      </div>

      {isAdding && typeof document !== 'undefined' && createPortal(
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setIsAdding(false)}>
           <div className="bg-white w-full max-w-5xl rounded-xl border border-gray-200 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start sm:items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
               <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900 whitespace-nowrap">
                      {editingContractId ? '계약 정보 수정' : '신규 계약서'}
                    </h3>
                    {!editingContractId && (
                       <div className="flex bg-gray-200 rounded p-1 gap-1">
                          <button onClick={() => setFormType('LEASE')} className={`px-2 py-0.5 rounded text-xs font-bold ${formType === 'LEASE' ? 'bg-white shadow text-indigo-700' : 'text-gray-500'}`}>임대차</button>
                          <button onClick={() => setFormType('MAINTENANCE')} className={`px-2 py-0.5 rounded text-xs font-bold ${formType === 'MAINTENANCE' ? 'bg-white shadow text-indigo-700' : 'text-gray-500'}`}>용역</button>
                       </div>
                    )}
               </div>
               <button onClick={resetForms} className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
              {formType === 'LEASE' ? (
                <div className="space-y-8">
                  <section>
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-2">1. 임대차 유형</h4>
                    <div className="grid grid-cols-3 gap-3">
                        {['LEASE_OUT', 'LEASE_IN', 'SUBLEASE'].map(type => (
                          <button key={type} onClick={() => setNewLease({...newLease, type: type as any})} className={`p-2.5 rounded-lg border text-center transition-all ${newLease.type === type ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 text-gray-600 bg-white'}`}>
                            {type === 'LEASE_OUT' ? '임대(수입)' : type === 'LEASE_IN' ? '임차(지출)' : '전대'}
                          </button>
                        ))}
                    </div>
                  </section>
                  <hr className="border-gray-100"/>
                  <section>
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-3">2. 대상 및 당사자</h4>
                    <div className="flex gap-4 p-3 bg-gray-50 rounded-lg mb-4">
                       <span className="text-xs font-bold text-gray-600 mt-1">범위:</span>
                       <div className="flex gap-4">
                          {['PROPERTY', 'BUILDING', 'UNIT'].map(t => (
                             <label key={t} className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" checked={newLease.targetType === t} onChange={() => setNewLease({...newLease, targetType: t as any})} className="text-indigo-600"/>
                                <span className="text-sm text-gray-700">{t === 'PROPERTY' ? '단지/토지' : t === 'BUILDING' ? '건물(동)' : '호실'}</span>
                             </label>
                          ))}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">단지</label>
                          <select className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white text-gray-900" value={selectedPropId} onChange={e => {setSelectedPropId(e.target.value); setSelectedBldgId(''); }}>
                            <option value="">선택</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        {(newLease.targetType === 'BUILDING' || newLease.targetType === 'UNIT') && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">동</label>
                            <select className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white text-gray-900" disabled={!selectedPropId} value={selectedBldgId} onChange={e => setSelectedBldgId(e.target.value)}>
                              <option value="">선택</option>
                              {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                          </div>
                        )}
                        {newLease.targetType === 'UNIT' && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">호실</label>
                            <select className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white text-gray-900" disabled={!selectedBldgId} value={newLease.targetId} onChange={e => setNewLease({...newLease, targetId: e.target.value})}>
                              <option value="">선택</option>
                              {filteredUnits.map(u => <option key={u.id} value={u.id}>{u.unitNumber}호</option>)}
                            </select>
                          </div>
                        )}
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">계약 상대방</label>
                          <select className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white text-gray-900" value={newLease.tenantId} onChange={e => setNewLease({...newLease, tenantId: e.target.value})}>
                            <option value="">선택</option>
                            {stakeholders.map(s => (<option key={s.id} value={s.id}>{s.name} ({s.type === 'CORPORATE' ? '법인' : '개인'})</option>))}
                          </select>
                        </div>
                        <div className="md:col-span-1"><label className="text-xs font-semibold text-gray-600 mb-1 block">계약일</label><input type="date" className="w-full border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" value={newLease.term?.contractDate} onChange={e => setNewLease({...newLease, term: {...newLease.term!, contractDate: e.target.value}})} /></div>
                        <div className="md:col-span-1"><label className="text-xs font-semibold text-gray-600 mb-1 block">총 계약 시작일</label><input type="date" className="w-full border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" value={newLease.term?.startDate} onChange={e => setNewLease({...newLease, term: {...newLease.term!, startDate: e.target.value}})} /></div>
                        <div className="md:col-span-1"><label className="text-xs font-semibold text-gray-600 mb-1 block">총 계약 종료일</label><input type="date" className="w-full border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" value={newLease.term?.endDate} onChange={e => setNewLease({...newLease, term: {...newLease.term!, endDate: e.target.value}})} /></div>
                    </div>
                  </section>
                  <hr className="border-gray-100"/>
                  
                  {/* FINANCIAL TERMS TABLE */}
                  <section>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wide">4. 임대 조건 이력</h4>
                      {!editingTermId && (newLease.financialTerms?.length || 0) > 0 && (
                          <button onClick={() => setShowCalculator(!showCalculator)} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 bg-indigo-50 rounded">
                              <Calculator size={14}/> 인상률 계산
                          </button>
                      )}
                    </div>
                    
                    {/* RENT CALCULATOR */}
                    {showCalculator && !editingTermId && (
                       <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 flex items-center gap-2 animate-in slide-in-from-top-2">
                           <span className="text-xs font-bold text-indigo-800">직전 계약 대비</span>
                           <input type="number" value={increaseRate} onChange={e => setIncreaseRate(e.target.value)} className="w-16 p-1 text-sm border border-indigo-300 rounded text-center font-bold text-indigo-700 focus:outline-indigo-500 bg-white" placeholder="5" />
                           <span className="text-xs font-bold text-indigo-800">% 인상 적용</span>
                           <button onClick={handleApplyIncrease} className="ml-auto bg-indigo-600 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-indigo-700 flex items-center gap-1">
                              <CheckCircle size={12}/> 계산 및 입력
                           </button>
                       </div>
                    )}

                    {/* TERM INPUT FORM */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 shadow-sm">
                       <h5 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                           {editingTermId ? <Edit2 size={14}/> : <Plus size={14}/>} 
                           {editingTermId ? '조건 수정' : '새로운 기간 조건 추가'}
                       </h5>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                           <div>
                              <label className="text-xs text-gray-500 mb-1 block">적용 기간 (시작 ~ 종료)</label>
                              <div className="flex gap-2">
                                <input type="date" className="w-full border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" value={newTerm.startDate} onChange={e => setNewTerm({...newTerm, startDate: e.target.value})}/>
                                <input type="date" className="w-full border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" value={newTerm.endDate} onChange={e => setNewTerm({...newTerm, endDate: e.target.value})}/>
                              </div>
                           </div>
                           <div><label className="text-xs text-gray-500 mb-1 block">보증금 ({moneyLabel})</label><input type="text" className="w-full border border-gray-300 p-2 rounded text-sm font-bold text-gray-900 bg-white" value={formatMoneyInput(newTerm.deposit)} onChange={e => setNewTerm({...newTerm, deposit: parseMoneyInput(e.target.value)})}/></div>
                           <div><label className="text-xs text-gray-500 mb-1 block">월차임 ({moneyLabel})</label><input type="text" className="w-full border border-gray-300 p-2 rounded text-sm font-bold text-gray-900 bg-white" value={formatMoneyInput(newTerm.monthlyRent)} onChange={e => setNewTerm({...newTerm, monthlyRent: parseMoneyInput(e.target.value)})}/></div>
                           <div><label className="text-xs text-gray-500 mb-1 block">관리비 ({moneyLabel})</label><input type="text" className="w-full border border-gray-300 p-2 rounded text-sm font-bold text-gray-900 bg-white" value={formatMoneyInput(newTerm.adminFee)} onChange={e => setNewTerm({...newTerm, adminFee: parseMoneyInput(e.target.value)})}/></div>
                       </div>
                       <div className="mb-3">
                          <label className="text-xs text-gray-500 mb-1 block">관리비 포함 항목</label>
                          <div className="flex flex-wrap gap-2">
                             {(Object.keys(ITEM_LABELS) as ManagementItem[]).map(item => (
                                <label key={item} className="flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-gray-200 hover:border-gray-300">
                                  <input type="checkbox" checked={newTerm.managementItems?.includes(item)} onChange={() => handleManagementItemToggle(item)} className="text-indigo-600 rounded"/>
                                  <span className="text-xs text-gray-700">{ITEM_LABELS[item]}</span>
                                </label>
                             ))}
                          </div>
                       </div>
                       <div className="flex justify-between items-center">
                          <input type="text" placeholder="비고 (예: 2년차 5% 인상, 묵시적 갱신 등)" className="border border-gray-300 p-2 rounded text-sm flex-1 mr-3 bg-white text-gray-900" value={newTerm.note || ''} onChange={e => setNewTerm({...newTerm, note: e.target.value})} />
                          <div className="flex gap-2">
                             {editingTermId && <button onClick={() => {setEditingTermId(null); setNewTerm({ startDate: '', endDate: '', deposit: 0, monthlyRent: 0, vatIncluded: false, paymentDay: 1, paymentType: 'POSTPAID', adminFee: 0, managementItems: [], note: '' });}} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded font-bold">취소</button>}
                             <button onClick={handleSaveTerm} className="px-4 py-1.5 bg-gray-800 text-white text-xs rounded font-bold hover:bg-black transition-colors">
                                {editingTermId ? '저장' : '추가'}
                             </button>
                          </div>
                       </div>
                    </div>

                    {/* TERMS LIST */}
                    <div className="border border-gray-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px]">
                           <thead className="bg-gray-50 text-gray-600 font-semibold text-xs border-b border-gray-200">
                              <tr>
                                 <th className="p-3 text-center w-16">차수</th>
                                 <th className="p-3">적용 기간</th>
                                 <th className="p-3 text-right">보증금</th>
                                 <th className="p-3 text-right">월차임</th>
                                 <th className="p-3 text-right">관리비</th>
                                 <th className="p-3">비고</th>
                                 <th className="p-3 text-center w-20">관리</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {(() => {
                                 // Sort for display (Newest first) but calculate order based on chronological
                                 const terms = (newLease.financialTerms || []);
                                 const sortedTerms = [...terms].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                                 
                                 return sortedTerms.map((term, idx) => {
                                    // Calculate chronological order
                                    const chronologicalIndex = terms.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).findIndex(t => t.id === term.id);
                                    
                                    return (
                                     <tr key={term.id} className={idx === 0 ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}>
                                        <td className="p-3 text-center font-medium text-gray-500">
                                            {chronologicalIndex + 1}차
                                        </td>
                                        <td className="p-3 font-medium text-gray-800">
                                            {term.startDate} ~ {term.endDate}
                                            {idx === 0 && <span className="ml-2 text-[10px] text-white bg-indigo-500 px-1.5 py-0.5 rounded-full font-bold">현재</span>}
                                        </td>
                                        <td className="p-3 text-right text-gray-600">{formatMoney(term.deposit)}</td>
                                        <td className="p-3 text-right font-bold text-gray-900">{formatMoney(term.monthlyRent)}</td>
                                        <td className="p-3 text-right text-gray-600">{formatMoney(term.adminFee)}</td>
                                        <td className="p-3 text-xs text-gray-500 max-w-[200px] truncate">{term.note}</td>
                                        <td className="p-3 text-center flex justify-center gap-1">
                                           <button onClick={() => handleEditTerm(term)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 size={14}/></button>
                                           <button onClick={() => handleDeleteTerm(term.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                                        </td>
                                     </tr>
                                  );
                                 });
                              })()}
                              
                              {(!newLease.financialTerms || newLease.financialTerms.length === 0) && (
                                 <tr><td colSpan={7} className="p-6 text-center text-sm text-gray-400">등록된 임대 조건이 없습니다.</td></tr>
                              )}
                           </tbody>
                        </table>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-6">
                   {/* Maintenance Form (Simplified reuse) */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">계약 대상</label>
                        <select className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white text-gray-900" value={selectedPropId} onChange={e => setSelectedPropId(e.target.value)}>
                             <option value="">단지 선택</option>
                             {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1">업체</label>
                         <select className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white text-gray-900" value={newMaintenance.vendorId} onChange={e => setNewMaintenance({...newMaintenance, vendorId: e.target.value})}>
                            <option value="">선택</option>
                            {vendorStakeholders.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1">월 비용 ({moneyLabel})</label>
                         <input type="text" className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white text-gray-900" value={formatMoneyInput(newMaintenance.monthlyCost)} onChange={e => setNewMaintenance({...newMaintenance, monthlyCost: parseMoneyInput(e.target.value)})}/>
                      </div>
                      <div><label className="text-xs font-semibold text-gray-600 mb-1 block">시작일</label><input type="date" className="w-full border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" value={newMaintenance.term?.startDate} onChange={e => setNewMaintenance({...newMaintenance, term: {...newMaintenance.term!, startDate: e.target.value}})} /></div>
                      <div><label className="text-xs font-semibold text-gray-600 mb-1 block">종료일</label><input type="date" className="w-full border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" value={newMaintenance.term?.endDate} onChange={e => setNewMaintenance({...newMaintenance, term: {...newMaintenance.term!, endDate: e.target.value}})} /></div>
                      <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-600 mb-1 block">상세 내용</label><input type="text" className="w-full border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" value={newMaintenance.details} onChange={e => setNewMaintenance({...newMaintenance, details: e.target.value})} /></div>
                   </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 rounded-b-xl">
               <button onClick={() => setIsAdding(false)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 shadow-sm">취소</button>
               <button onClick={formType === 'LEASE' ? handleSaveLease : handleSaveMaintenance} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md">
                 {editingContractId ? '수정사항 저장' : '계약 체결 및 저장'}
               </button>
            </div>
           </div>
         </div>,
         document.body
      )}

      {/* Contract List (Tabs) */}
      <div className="flex bg-white rounded-t-lg border border-gray-200 border-b-0 overflow-hidden w-fit">
         <button onClick={() => setActiveTab('LEASE')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'LEASE' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'text-gray-500 hover:bg-gray-50'}`}>
           <FileText size={16}/> 임대차 계약 ({leaseContracts.length})
         </button>
         <div className="w-px bg-gray-200 h-6 my-auto"></div>
         <button onClick={() => setActiveTab('MAINTENANCE')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'MAINTENANCE' ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-500' : 'text-gray-500 hover:bg-gray-50'}`}>
           <Wrench size={16}/> 용역/유지보수 ({maintenanceContracts.length})
         </button>
      </div>

      <div className="bg-white rounded-b-lg rounded-tr-lg border border-gray-200 shadow-sm overflow-hidden flex-1">
         <div className="overflow-x-auto h-full">
            <table className="w-full text-sm text-left whitespace-nowrap table-auto">
               <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                 <tr>
                    <th className="p-4 font-semibold w-24">유형</th>
                    <th className="p-4 font-semibold">계약 대상</th>
                    <th className="p-4 font-semibold">계약자/업체</th>
                    <th className="p-4 font-semibold">기간 (현재 적용 구간)</th>
                    <th className="p-4 font-semibold text-right">금액</th>
                    <th className="p-4 font-semibold text-center w-24">상태</th>
                    <th className="p-4 font-semibold text-center w-20">관리</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {activeTab === 'LEASE' ? (
                     leaseContracts.map(contract => {
                        const activeTerm = getActiveTerm(contract);
                        return (
                        <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                           <td className="p-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                                 contract.type === 'LEASE_OUT' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                 contract.type === 'LEASE_IN' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 
                                 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}>
                                {contract.type === 'LEASE_OUT' ? '임대(수입)' : contract.type === 'LEASE_IN' ? '임차(지출)' : '전대'}
                              </span>
                           </td>
                           <td className="p-4 font-medium text-gray-900">
                             {findTargetName(contract.targetType, contract.targetId)}
                           </td>
                           <td className="p-4 text-gray-600">{findName(contract.tenantId)}</td>
                           <td className="p-4">
                             <div className="font-bold text-gray-800">{activeTerm.startDate} ~ {activeTerm.endDate}</div>
                             <div className="text-xs text-gray-400 mt-0.5">(총 계약: {contract.term.startDate} ~ {contract.term.endDate})</div>
                           </td>
                           <td className="p-4 text-right font-medium text-gray-800">
                             {formatMoney(activeTerm.deposit)} / {formatMoney(activeTerm.monthlyRent)}
                           </td>
                           <td className="p-4 text-center">
                             <span className={`inline-block w-2 h-2 rounded-full mr-2 ${contract.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                             <span className="text-xs text-gray-500">{contract.status === 'ACTIVE' ? '진행중' : '종료'}</span>
                           </td>
                           <td className="p-4 text-center">
                              <button onClick={() => handleEditLease(contract)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Edit2 size={16}/></button>
                           </td>
                        </tr>
                     )})
                  ) : (
                     maintenanceContracts.map(contract => (
                        <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                           <td className="p-4">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                {contract.serviceType}
                              </span>
                           </td>
                           <td className="p-4 font-medium text-gray-900">{findTargetName(contract.targetType, contract.targetId)}</td>
                           <td className="p-4 text-gray-600">{findName(contract.vendorId)}</td>
                           <td className="p-4 text-gray-600">{contract.term.startDate} ~ {contract.term.endDate}</td>
                           <td className="p-4 text-right font-medium text-gray-800">{formatMoney(contract.monthlyCost)}</td>
                           <td className="p-4 text-center">
                             <span className={`inline-block w-2 h-2 rounded-full mr-2 ${contract.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                             <span className="text-xs text-gray-500">{contract.status === 'ACTIVE' ? '진행중' : '종료'}</span>
                           </td>
                           <td className="p-4 text-center">
                              <button onClick={() => handleEditMaintenance(contract)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Edit2 size={16}/></button>
                           </td>
                        </tr>
                     ))
                  )}
                  {activeTab === 'LEASE' && leaseContracts.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-gray-400">등록된 임대차 계약이 없습니다.</td></tr>}
                  {activeTab === 'MAINTENANCE' && maintenanceContracts.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-gray-400">등록된 용역 계약이 없습니다.</td></tr>}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
    