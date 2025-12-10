import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Stakeholder, StakeholderRole, StakeholderType, LeaseContract, MaintenanceContract } from '../types';
import { User, Phone, Mail, Building, Briefcase, Plus, Search, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface StakeholderManagerProps {
  stakeholders: Stakeholder[];
  onAddStakeholder: (sh: Stakeholder) => void;
  onUpdateStakeholder: (sh: Stakeholder) => void;
  leaseContracts: LeaseContract[];
  maintenanceContracts: MaintenanceContract[];
  formatMoney: (amount: number) => string;
  moneyLabel?: string;
}

export const StakeholderManager: React.FC<StakeholderManagerProps> = ({ 
  stakeholders, onAddStakeholder, onUpdateStakeholder, leaseContracts, maintenanceContracts, formatMoney 
}) => {
  const [filterRole, setFilterRole] = useState<StakeholderRole | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Stakeholder>>({
    name: '', type: 'INDIVIDUAL', roles: ['TENANT'], registrationNumber: '', contact: { phone: '', email: '', address: '' }, representative: ''
  });

  const filtered = stakeholders.filter(s => {
    const matchesRole = filterRole === 'ALL' || s.roles.includes(filterRole);
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.contact.phone.includes(searchTerm);
    return matchesRole && matchesSearch;
  });

  const handleOpenAdd = () => {
    setSelectedStakeholderId(null);
    setFormData({ name: '', type: 'INDIVIDUAL', roles: ['TENANT'], registrationNumber: '', contact: { phone: '', email: '', address: '' }, representative: '' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sh: Stakeholder) => {
    setSelectedStakeholderId(sh.id);
    setFormData({ ...sh });
    setIsFormOpen(true);
  };

  const handleOpenHistory = (id: string) => {
    setSelectedStakeholderId(id);
    setIsHistoryOpen(true);
  };
  
  const handleSave = () => {
    if (!formData.name || !formData.contact?.phone) return alert('이름과 연락처는 필수입니다.');
    
    const person: Stakeholder = {
      id: selectedStakeholderId || `sh${Date.now()}`,
      name: formData.name!,
      type: formData.type as StakeholderType,
      roles: formData.roles as StakeholderRole[],
      registrationNumber: formData.registrationNumber || '',
      contact: formData.contact as any,
      representative: formData.representative
    };

    if (selectedStakeholderId) {
      onUpdateStakeholder(person);
    } else {
      onAddStakeholder(person);
    }
    setIsFormOpen(false);
  };

  const getStakeholderContracts = (shId: string) => {
    const leases = leaseContracts.filter(c => c.tenantId === shId);
    const maintenances = maintenanceContracts.filter(c => c.vendorId === shId);
    return { leases, maintenances };
  };

  const getRoleBadge = (role: StakeholderRole) => {
    switch (role) {
      case 'TENANT': return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-xs rounded-full font-medium">임차인</span>;
      case 'LANDLORD': return <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 text-xs rounded-full font-medium">임대인</span>;
      case 'MANAGER': return <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 text-xs rounded-full font-medium">관리인</span>;
      case 'VENDOR': return <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 text-xs rounded-full font-medium">용역업체</span>;
      case 'SAFETY_OFFICER': return <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 text-xs rounded-full font-medium">안전관리</span>;
      default: return null;
    }
  };

  const selectedStakeholderForHistory = stakeholders.find(s => s.id === selectedStakeholderId);
  const historyData = selectedStakeholderId ? getStakeholderContracts(selectedStakeholderId) : { leases: [], maintenances: [] };

  // Helper to get active active financial term for display
  const getActiveTerm = (c: LeaseContract) => {
      // Find current active term or latest
      const today = new Date();
      today.setHours(0,0,0,0);
      const activeTerm = c.financialTerms.find(t => {
          const start = new Date(t.startDate);
          const end = new Date(t.endDate);
          return today >= start && today <= end;
      });
      if(activeTerm) return activeTerm;
      
      const terms = [...c.financialTerms].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      return terms[0] || { deposit: 0, monthlyRent: 0 };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">인물 및 업체 관리</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="이름, 연락처 검색" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
          </div>
          <button onClick={handleOpenAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 shadow-sm">
            <Plus size={16} /> 등록
          </button>
        </div>
      </div>

      {isFormOpen && typeof document !== 'undefined' && createPortal(
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-2xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
             <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 p-1.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={20}/></button>
             <h3 className="font-bold text-lg mb-6 text-gray-800 border-b pb-2">
               {selectedStakeholderId ? '정보 수정' : '신규 이해관계자 등록'}
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
               <div>
                 <label className="text-xs font-semibold text-gray-600 block mb-1">구분</label>
                 <select className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as StakeholderType})}>
                   <option value="INDIVIDUAL">개인</option>
                   <option value="CORPORATE">법인/사업자</option>
                 </select>
               </div>
               <div>
                 <label className="text-xs font-semibold text-gray-600 block mb-1">역할</label>
                 <select className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.roles?.[0]} onChange={e => setFormData({...formData, roles: [e.target.value as StakeholderRole]})}>
                   <option value="TENANT">임차인</option>
                   <option value="LANDLORD">임대인</option>
                   <option value="MANAGER">관리인</option>
                   <option value="VENDOR">용역/유지보수업체</option>
                   <option value="SAFETY_OFFICER">안전관리자</option>
                 </select>
               </div>
               <div><label className="text-xs font-semibold text-gray-600 block mb-1">이름/상호명</label><input className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
               {formData.type === 'CORPORATE' && (
                 <div><label className="text-xs font-semibold text-gray-600 block mb-1">대표자명</label><input className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.representative} onChange={e => setFormData({...formData, representative: e.target.value})} /></div>
               )}
               <div><label className="text-xs font-semibold text-gray-600 block mb-1">등록번호</label><input className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} /></div>
               <div><label className="text-xs font-semibold text-gray-600 block mb-1">연락처</label><input className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.contact?.phone} onChange={e => setFormData({...formData, contact: {...formData.contact!, phone: e.target.value}})} /></div>
               <div><label className="text-xs font-semibold text-gray-600 block mb-1">이메일</label><input className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.contact?.email} onChange={e => setFormData({...formData, contact: {...formData.contact!, email: e.target.value}})} /></div>
               <div className="md:col-span-2 lg:col-span-3">
                  <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-gray-600 block">주소/메모</label>
                  </div>
                  <input className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.contact?.address} onChange={e => setFormData({...formData, contact: {...formData.contact!, address: e.target.value}})} placeholder="주소 또는 특이사항 입력" />
               </div>
             </div>
             <div className="mt-8 flex justify-end gap-2">
               <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium">취소</button>
               <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-medium shadow-sm">
                 {selectedStakeholderId ? '수정 저장' : '등록'}
               </button>
             </div>
           </div>
         </div>,
         document.body
      )}

      {isHistoryOpen && selectedStakeholderForHistory && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-2xl w-full max-w-4xl relative max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <div>
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600"/>
                  계약 이력 조회
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-bold text-gray-800">{selectedStakeholderForHistory.name}</span>님과 관련된 모든 계약 내역입니다.
                </p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-gray-100"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto bg-white rounded-b-lg">
              {historyData.leases.length === 0 && historyData.maintenances.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <AlertCircle size={48} className="mx-auto mb-3 text-gray-300"/>
                  <p>등록된 계약 정보가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {historyData.leases.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-indigo-700 mb-3 bg-indigo-50 inline-block px-3 py-1 rounded-full">임대/임차 계약</h4>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                            <tr>
                              <th className="p-3">계약기간</th>
                              <th className="p-3">유형</th>
                              <th className="p-3 text-right">보증금/월세 (최근)</th>
                              <th className="p-3 text-center">상태</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {historyData.leases.map(lease => {
                              const activeTerm = getActiveTerm(lease);
                              return (
                              <tr key={lease.id} className="hover:bg-gray-50">
                                <td className="p-3 text-gray-900">
                                  {lease.term.startDate} ~ {lease.term.endDate}
                                </td>
                                <td className="p-3">
                                  {lease.type === 'LEASE_OUT' ? '임대(수입)' : lease.type === 'LEASE_IN' ? '임차(지출)' : '전대'}
                                </td>
                                <td className="p-3 font-medium text-right">
                                  {formatMoney(activeTerm.deposit)} / {formatMoney(activeTerm.monthlyRent)}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${lease.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    {lease.status === 'ACTIVE' ? '진행중' : '종료'}
                                  </span>
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {historyData.maintenances.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-orange-700 mb-3 bg-orange-50 inline-block px-3 py-1 rounded-full">유지보수/용역 계약</h4>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                            <tr>
                              <th className="p-3">계약기간</th>
                              <th className="p-3">서비스유형</th>
                              <th className="p-3 text-right">월 비용</th>
                              <th className="p-3 text-center">상태</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {historyData.maintenances.map(mc => (
                              <tr key={mc.id} className="hover:bg-gray-50">
                                <td className="p-3 text-gray-900">
                                  {mc.term.startDate} ~ {mc.term.endDate}
                                </td>
                                <td className="p-3">{mc.serviceType}</td>
                                <td className="p-3 font-medium text-right">{formatMoney(mc.monthlyCost)}</td>
                                <td className="p-3 text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${mc.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    {mc.status === 'ACTIVE' ? '진행중' : '종료'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-0 border-b border-gray-200">
        {[
          { id: 'ALL', label: '전체' },
          { id: 'TENANT', label: '임차인' },
          { id: 'LANDLORD', label: '임대인' },
          { id: 'MANAGER', label: '관리자' },
          { id: 'VENDOR', label: '용역/유지보수' },
        ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setFilterRole(tab.id as any)}
             className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap border-t border-r border-l ${
               filterRole === tab.id 
               ? 'text-indigo-700 border-indigo-100 bg-white border-b-white -mb-px' 
               : 'text-gray-500 border-transparent bg-gray-50 hover:bg-gray-100 hover:text-gray-700'
             }`}
           >
             {tab.label}
           </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(person => (
          <div key={person.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border ${
                   person.type === 'CORPORATE' ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                 }`}>
                   {person.type === 'CORPORATE' ? <Building size={18} /> : <User size={18} />}
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-800">{person.name}</h3>
                   <div className="flex gap-1 mt-1">{person.roles.map(r => <span key={r}>{getRoleBadge(r)}</span>)}</div>
                 </div>
              </div>
            </div>
            <div className="space-y-2 mt-4 text-sm text-gray-600 bg-gray-50/50 p-3 rounded-md border border-gray-100">
              <div className="flex items-center gap-2">
                <Briefcase size={14} className="text-gray-400" />
                <span className="font-medium text-gray-700">{person.registrationNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                <span className="font-medium text-gray-700">{person.contact.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <span className="truncate">{person.contact.email}</span>
              </div>
            </div>
            <div className="mt-4 pt-0 flex gap-2">
              <button onClick={() => handleOpenEdit(person)} className="flex-1 py-2 text-xs border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50 transition-colors">정보 수정</button>
              <button onClick={() => handleOpenHistory(person.id)} className="flex-1 py-2 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-medium hover:bg-indigo-100 transition-colors">계약 내역</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};