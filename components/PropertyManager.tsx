
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Property, Unit, PropertyType, Lot, Building, JibunAddress } from '../types';
import { MapPin, Box, Layers, Calendar, Plus, X, Building as BuildingIcon, CheckCircle, Trash2, Home, ArrowRight, Menu, FileText, Edit2, RotateCcw, Save } from 'lucide-react';

const Modal = ({ children, onClose }: { children?: React.ReactNode, onClose: () => void }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
        {children}
      </div>
    </div>,
    document.body
  );
};

interface PropertyManagerProps {
  properties: Property[];
  units: Unit[];
  onAddProperty: (prop: Property) => void;
  onUpdateProperty: (prop: Property) => void;
  onUpdateBuilding: (b: Building) => void;
  onAddUnit: (unit: Unit) => void;
  onUpdateUnit: (unit: Unit) => void;
  formatArea: (areaM2: number) => string;
  formatNumberInput: (num: number | undefined | null) => string;
  parseNumberInput: (str: string) => number;
  formatMoneyInput: (amount: number | undefined | null) => string;
  parseMoneyInput: (str: string) => number;
  moneyLabel: string;
}

export const PropertyManager: React.FC<PropertyManagerProps> = ({ 
  properties, units, onAddProperty, onUpdateProperty, onUpdateBuilding, onAddUnit, onUpdateUnit, formatArea, formatNumberInput, parseNumberInput, formatMoneyInput, parseMoneyInput, moneyLabel
}) => {
  const [selectedPropId, setSelectedPropId] = useState<string>(properties[0]?.id || '');
  
  // Modal States
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LAND' | 'BUILDING' | 'UNIT'>('OVERVIEW');
  const [showMobileList, setShowMobileList] = useState(true);

  // --- 1. Property (Site) Form State ---
  const [newProp, setNewProp] = useState<Partial<Property>>({
    type: 'LAND_AND_BUILDING',
    name: '', 
    roadAddress: '', 
    masterAddress: { dong: '', bonbun: '', bubun: '' },
    lots: [],
    buildings: [],
    totalLandArea: 0
  });
  
  // --- 2. Detail Management State ---
  const [editingLotId, setEditingLotId] = useState<string | null>(null);
  const [newLot, setNewLot] = useState<Partial<Lot>>({ address: { dong: '', bonbun: '', bubun: '' }, jimok: '대', area: 0 });
  
  // Building State
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);
  const [newBuilding, setNewBuilding] = useState<Partial<Building>>({
      name: '',
      spec: { buildingArea: 0, grossFloorArea: 0, floorCount: { underground: 0, ground: 1 }, completionDate: '', mainUsage: '', parkingCapacity: 0, elevatorCount: 0 }
  });

  // Unit State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [newUnit, setNewUnit] = useState<Partial<Unit>>({
    unitNumber: '', floor: 1, area: 0, usage: '주거', status: 'VACANT', buildingId: ''
  });

  const selectedProperty = properties.find(p => p.id === selectedPropId);
  const propertyUnits = units.filter(u => u.propertyId === selectedPropId);

  const handlePropertySelect = (id: string) => {
    setSelectedPropId(id);
    setShowMobileList(false);
    setActiveTab('OVERVIEW');
    setEditingLotId(null);
    const prop = properties.find(p => p.id === id);
    if (prop) {
        setNewLot({ address: { dong: prop.masterAddress.dong, bonbun: '', bubun: '' }, jimok: '대', area: 0 });
    }
  };

  const openAddPropertyModal = () => {
    setIsEditMode(false);
    setNewProp({ type: 'LAND_AND_BUILDING', name: '', masterAddress: {dong:'',bonbun:'',bubun:''}, roadAddress: '', lots: [], buildings: [], totalLandArea: 0 });
    setIsPropertyModalOpen(true);
  };

  const openEditPropertyModal = () => {
    if(!selectedProperty) return;
    setIsEditMode(true);
    setNewProp({ ...selectedProperty, masterAddress: { ...selectedProperty.masterAddress } });
    setIsPropertyModalOpen(true);
  };

  const handleSaveProperty = () => {
    if (!newProp.name || !newProp.masterAddress?.dong || !newProp.masterAddress?.bonbun) return alert('자산명과 대표 지번 주소(동, 본번)는 필수입니다.');
    
    if (isEditMode && selectedProperty) {
      const updatedProp: Property = {
        ...selectedProperty,
        ...newProp as Property,
        id: selectedProperty.id, 
        lots: selectedProperty.lots, 
        buildings: selectedProperty.buildings
      };
      onUpdateProperty(updatedProp);
    } else {
      const prop: Property = {
        id: `p${Date.now()}`,
        type: newProp.type as PropertyType,
        name: newProp.name!,
        masterAddress: newProp.masterAddress!,
        roadAddress: newProp.roadAddress,
        lots: [], 
        buildings: [], 
        totalLandArea: 0
      };
      onAddProperty(prop);
      setSelectedPropId(prop.id);
    }
    setIsPropertyModalOpen(false);
    setShowMobileList(false);
  };

  const handleEditLot = (lot: Lot) => {
    setEditingLotId(lot.id);
    setNewLot({ ...lot, address: { ...lot.address } });
  };

  const handleCancelLotEdit = () => {
    setEditingLotId(null);
    setNewLot({ address: { dong: selectedProperty?.masterAddress.dong || '', bonbun: '', bubun: '' }, jimok: '대', area: 0 });
  };

  const handleSaveLot = () => {
     if(!selectedProperty) return;
     if(!newLot.address?.dong || !newLot.address?.bonbun) return alert('주소 필수');
     
     let updatedLots = [...selectedProperty.lots];
     if (editingLotId) {
        updatedLots = updatedLots.map(l => l.id === editingLotId ? { ...newLot, id: editingLotId, address: newLot.address! } as Lot : l);
     } else {
        const lot: Lot = {
            id: `l${Date.now()}`,
            address: newLot.address as JibunAddress,
            jimok: newLot.jimok || '대',
            area: Number(newLot.area)
        };
        updatedLots.push(lot);
     }
     const totalArea = updatedLots.reduce((sum, l) => sum + (l.area || 0), 0);
     const updatedProperty = { ...selectedProperty, lots: updatedLots, totalLandArea: totalArea };
     onUpdateProperty(updatedProperty);
     handleCancelLotEdit();
  };

  const handleDeleteLot = (lotId: string) => {
     if(!selectedProperty || !window.confirm('정말 삭제하시겠습니까?')) return;
     const updatedLots = selectedProperty.lots.filter(l => l.id !== lotId);
     const totalArea = updatedLots.reduce((sum, l) => sum + (l.area || 0), 0);
     onUpdateProperty({ ...selectedProperty, lots: updatedLots, totalLandArea: totalArea });
  };

  const openAddBuildingModal = () => {
    setEditingBuildingId(null);
    setNewBuilding({ name: '', spec: { buildingArea: 0, grossFloorArea: 0, floorCount: { underground: 0, ground: 1 }, completionDate: '', mainUsage: '', parkingCapacity: 0, elevatorCount: 0 } });
    setIsBuildingModalOpen(true);
  };

  const openEditBuildingModal = (b: Building) => {
    setEditingBuildingId(b.id);
    setNewBuilding({ ...b, spec: { ...b.spec, floorCount: { ...b.spec.floorCount } } });
    setIsBuildingModalOpen(true);
  };

  const handleSaveBuilding = () => {
     if(!selectedProperty) return;
     if(!newBuilding.name) return alert('건물명 필수');
     
     if (editingBuildingId) {
       const updatedBuilding = { ...newBuilding, id: editingBuildingId, propertyId: selectedProperty.id } as Building;
       onUpdateBuilding(updatedBuilding);
     } else {
       const bldg: Building = {
          id: `b${Date.now()}`,
          propertyId: selectedProperty.id,
          name: newBuilding.name!,
          spec: newBuilding.spec as any
       };
       const updatedBuildings = [...selectedProperty.buildings, bldg];
       onUpdateProperty({ ...selectedProperty, buildings: updatedBuildings });
     }
     setIsBuildingModalOpen(false);
  };

  const openAddUnitModal = () => {
    setEditingUnitId(null);
    setNewUnit({ unitNumber: '', floor: 1, area: 0, usage: '주거', status: 'VACANT', buildingId: '' });
    setIsUnitModalOpen(true);
  };

  const openEditUnitModal = (u: Unit) => {
    setEditingUnitId(u.id);
    setNewUnit({ ...u });
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = () => {
    if (!newUnit.unitNumber || !selectedProperty || !newUnit.buildingId) return alert('호수 및 소속 건물 정보가 필요합니다.');
    
    if (editingUnitId) {
      onUpdateUnit(newUnit as Unit);
    } else {
      const unit: Unit = {
        id: `u${Date.now()}`,
        propertyId: selectedProperty.id,
        buildingId: newUnit.buildingId,
        unitNumber: newUnit.unitNumber!,
        floor: Number(newUnit.floor),
        area: Number(newUnit.area),
        usage: newUnit.usage || '주거',
        status: 'VACANT'
      };
      onAddUnit(unit);
    }
    setIsUnitModalOpen(false);
  };
  
  const getFullAddress = (p: Property) => {
     return `${p.masterAddress.dong} ${p.masterAddress.bonbun}${p.masterAddress.bubun ? '-'+p.masterAddress.bubun : ''}`;
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 relative">
      {/* 1. PROPERTY MODAL */}
      {isPropertyModalOpen && (
           <Modal onClose={() => setIsPropertyModalOpen(false)}>
             <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-2xl relative animate-in zoom-in-95 duration-200">
               <button onClick={() => setIsPropertyModalOpen(false)} className="absolute top-4 right-4 p-1.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
               <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                 <BuildingIcon size={20} className="text-indigo-600"/> 
                 {isEditMode ? '자산 정보 수정' : '신규 자산 생성'}
               </h3>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">자산 유형</label>
                   <div className="flex flex-col sm:flex-row gap-3">
                      {['AGGREGATE', 'LAND_AND_BUILDING', 'LAND'].map(t => (
                        <button 
                          key={t}
                          onClick={() => setNewProp({...newProp, type: t as PropertyType})}
                          className={`flex-1 py-3 px-2 rounded-lg border-2 text-xs font-bold transition-all text-center whitespace-nowrap ${newProp.type === t ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-200 text-gray-600'}`}
                        >
                          {t === 'AGGREGATE' ? '집합건물' : t === 'LAND_AND_BUILDING' ? '토지 및 건물' : '토지'}
                        </button>
                      ))}
                   </div>
                 </div>

                 <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">자산명 (사업지명)</label>
                    <input className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded outline-none" placeholder="예: 논현동 빌딩" value={newProp.name} onChange={e => setNewProp({...newProp, name: e.target.value})} />
                 </div>
                 
                 <div>
                   <label className="block text-xs font-semibold text-gray-700 mb-1">대표 지번 주소 <span className="text-red-500">*</span></label>
                   <div className="grid grid-cols-3 gap-2">
                      <input className="col-span-1 border border-gray-300 bg-white text-gray-900 p-2.5 rounded outline-none text-center" placeholder="동 (예:역삼동)" value={newProp.masterAddress?.dong} onChange={e => setNewProp({...newProp, masterAddress: {...newProp.masterAddress!, dong: e.target.value}})} />
                      <input className="col-span-1 border border-gray-300 bg-white text-gray-900 p-2.5 rounded outline-none text-center" placeholder="본번" value={newProp.masterAddress?.bonbun} onChange={e => setNewProp({...newProp, masterAddress: {...newProp.masterAddress!, bonbun: e.target.value}})} />
                      <input className="col-span-1 border border-gray-300 bg-white text-gray-900 p-2.5 rounded outline-none text-center" placeholder="부번" value={newProp.masterAddress?.bubun} onChange={e => setNewProp({...newProp, masterAddress: {...newProp.masterAddress!, bubun: e.target.value}})} />
                   </div>
                 </div>
                 
                 <div>
                   <label className={`block text-xs font-semibold mb-1 ${newProp.type === 'LAND' ? 'text-gray-400' : 'text-gray-700'}`}>도로명 주소</label>
                   <input 
                     disabled={newProp.type === 'LAND'}
                     className={`w-full border p-2.5 rounded outline-none ${newProp.type === 'LAND' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-900 border-gray-300'}`} 
                     placeholder={newProp.type === 'LAND' ? '해당 없음' : "예: 테헤란로 123"} 
                     value={newProp.roadAddress} 
                     onChange={e => setNewProp({...newProp, roadAddress: e.target.value})} 
                   />
                 </div>

                 <button onClick={handleSaveProperty} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-bold shadow-md mt-4">
                    {isEditMode ? '수정사항 저장' : '자산 생성하기'}
                 </button>
               </div>
             </div>
           </Modal>
        )}

      {/* Property List */}
      <div className={`${showMobileList ? 'block' : 'hidden'} md:block w-full md:w-80 bg-white rounded-lg border border-gray-200 flex-shrink-0 flex flex-col h-[calc(100vh-140px)] shadow-sm`}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
          <div>
            <h2 className="font-bold text-gray-800">보유 자산 목록</h2>
            <span className="text-xs text-gray-500">총 {properties.length}개 사업지</span>
          </div>
          <button onClick={openAddPropertyModal} className="p-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <Plus size={18}/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {properties.map(prop => (
            <button
              key={prop.id}
              onClick={() => handlePropertySelect(prop.id)}
              className={`w-full text-left p-3 rounded-lg transition-all border ${
                selectedPropId === prop.id
                  ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm'
                  : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className={`font-semibold text-sm truncate max-w-[140px] ${selectedPropId === prop.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {prop.name}
                </h3>
                <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium whitespace-nowrap ml-2">
                  {prop.type === 'AGGREGATE' ? '집합' : prop.type === 'LAND' ? '토지' : '복합'}
                </span>
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPin size={10} className="mr-1 flex-shrink-0" />
                <span className="truncate">{getFullAddress(prop)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail View */}
      <div className={`${!showMobileList ? 'block' : 'hidden'} md:block flex-1 flex flex-col gap-6 overflow-hidden min-h-[500px]`}>
        <div className="md:hidden mb-2">
          <button onClick={() => setShowMobileList(true)} className="flex items-center text-gray-600 text-sm font-medium p-2 bg-white rounded border border-gray-200 shadow-sm">
             <ArrowRight className="rotate-180 mr-1" size={16}/> 목록으로 돌아가기
          </button>
        </div>

        {selectedProperty ? (
          <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
             {/* Header */}
             <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-start">
                 <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex flex-wrap items-center gap-2">
                    {selectedProperty.name}
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold whitespace-nowrap">
                        {selectedProperty.type === 'AGGREGATE' ? '집합' : selectedProperty.type === 'LAND' ? '토지' : '토지+건물'}
                    </span>
                    </h1>
                    <p className="text-gray-600 flex items-center mb-1 text-sm"><MapPin size={16} className="mr-1 text-gray-400 flex-shrink-0" />{getFullAddress(selectedProperty)}</p>
                 </div>
                 <button onClick={openEditPropertyModal} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 shadow-sm transition-colors">
                    <Edit2 size={14}/> 정보 수정
                 </button>
             </div>

             {/* TABS */}
             <div className="flex border-b border-gray-200 overflow-x-auto">
               <button onClick={() => setActiveTab('OVERVIEW')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>자산 개요</button>
               <button onClick={() => setActiveTab('LAND')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'LAND' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>대지 정보 ({selectedProperty.lots.length})</button>
               {selectedProperty.type !== 'LAND' && (
                  <>
                    <button onClick={() => setActiveTab('BUILDING')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'BUILDING' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>건물 정보 ({selectedProperty.buildings.length})</button>
                    <button onClick={() => setActiveTab('UNIT')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'UNIT' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>호실 관리 ({propertyUnits.length})</button>
                  </>
               )}
             </div>

             {/* CONTENT */}
             <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/30">
                {activeTab === 'OVERVIEW' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                         <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><MapPin size={18} className="text-gray-400"/> 토지 개요</h3>
                         <div className="space-y-2 text-sm">
                            <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">총 대지면적</span> <span className="font-bold text-gray-900">{formatArea(selectedProperty.totalLandArea)}</span></div>
                            <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">필지 수</span> <span className="font-bold text-gray-900">{selectedProperty.lots.length}필지</span></div>
                         </div>
                      </div>
                      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                         <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><BuildingIcon size={18} className="text-gray-400"/> 건물 개요</h3>
                         <div className="space-y-2 text-sm">
                            <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">총 동 수</span> <span className="font-bold text-gray-900">{selectedProperty.buildings.length}개동</span></div>
                            <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">총 호실 수</span> <span className="font-bold text-gray-900">{propertyUnits.length}호</span></div>
                         </div>
                      </div>
                   </div>
                )}

                {activeTab === 'LAND' && (
                   <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                         <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2 justify-between">
                             <div className="flex items-center gap-2">
                                {editingLotId ? <Edit2 size={16} className="text-indigo-600"/> : <Plus size={16} className="text-gray-500"/>}
                                {editingLotId ? '필지 정보 수정' : '신규 필지 추가'}
                             </div>
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-10 gap-2 items-end">
                            <div className="sm:col-span-2"><label className="text-xs text-gray-500">법정동</label><input className="w-full border p-2 rounded text-sm bg-white text-gray-900" value={newLot.address?.dong} onChange={e => setNewLot({...newLot, address: {...newLot.address!, dong: e.target.value}})} placeholder="동"/></div>
                            <div className="sm:col-span-2"><label className="text-xs text-gray-500">본번</label><input className="w-full border p-2 rounded text-sm bg-white text-gray-900" value={newLot.address?.bonbun} onChange={e => setNewLot({...newLot, address: {...newLot.address!, bonbun: e.target.value}})} placeholder="본번"/></div>
                            <div className="sm:col-span-1"><label className="text-xs text-gray-500">부번</label><input className="w-full border p-2 rounded text-sm bg-white text-gray-900" value={newLot.address?.bubun} onChange={e => setNewLot({...newLot, address: {...newLot.address!, bubun: e.target.value}})} placeholder="부번"/></div>
                            <div className="sm:col-span-1"><label className="text-xs text-gray-500">지목</label><select className="w-full border p-2 rounded text-sm bg-white text-gray-900" value={newLot.jimok} onChange={e => setNewLot({...newLot, jimok: e.target.value})}><option>대</option><option>전</option><option>답</option><option>임</option><option>잡</option></select></div>
                            <div className="sm:col-span-2"><label className="text-xs text-gray-500">면적(m²)</label><input type="text" className="w-full border p-2 rounded text-sm bg-white text-gray-900" value={formatNumberInput(newLot.area)} onChange={e => setNewLot({...newLot, area: parseNumberInput(e.target.value)})}/></div>
                            
                            <div className="sm:col-span-2 flex gap-1">
                                {editingLotId && (
                                    <button onClick={handleCancelLotEdit} className="flex-1 bg-gray-100 text-gray-600 p-2 rounded font-bold text-sm h-[38px] hover:bg-gray-200 border border-gray-200">
                                        <RotateCcw size={16} className="mx-auto"/>
                                    </button>
                                )}
                                <button onClick={handleSaveLot} className={`flex-1 text-white p-2 rounded font-bold text-sm h-[38px] shadow-sm flex items-center justify-center gap-1 ${editingLotId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-gray-900'}`}>
                                    {editingLotId ? '저장' : '추가'}
                                </button>
                            </div>
                         </div>
                      </div>
                      
                      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                         <table className="w-full text-sm text-left table-auto min-w-full">
                            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                               <tr><th className="p-3 whitespace-nowrap">법정동</th><th className="p-3 whitespace-nowrap">지번</th><th className="p-3 whitespace-nowrap">지목</th><th className="p-3 text-right whitespace-nowrap">면적</th><th className="p-3 text-center">관리</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                               {selectedProperty.lots.map(lot => (
                                  <tr key={lot.id} className={editingLotId === lot.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}>
                                     <td className="p-3 text-gray-900">{lot.address.dong}</td>
                                     <td className="p-3 text-gray-900">{lot.address.bonbun}{lot.address.bubun ? `-${lot.address.bubun}`:''}</td>
                                     <td className="p-3 text-gray-900">{lot.jimok}</td>
                                     <td className="p-3 text-right text-gray-900">{formatArea(lot.area)}</td>
                                     <td className="p-3 text-center flex justify-center gap-2">
                                         <button onClick={() => handleEditLot(lot)} className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded transition-colors"><Edit2 size={16}/></button>
                                         <button onClick={() => handleDeleteLot(lot.id)} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                )}
                
                {activeTab === 'BUILDING' && (
                   <div className="space-y-4">
                      <button onClick={openAddBuildingModal} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-bold hover:border-indigo-400 hover:text-indigo-600 transition-colors">+ 건물(동) 추가하기</button>
                      
                      {isBuildingModalOpen && (
                         <Modal onClose={() => setIsBuildingModalOpen(false)}>
                            <div className="bg-white w-full max-w-lg p-6 rounded-lg border border-indigo-200 shadow-2xl ring-1 ring-indigo-100 relative animate-in zoom-in-95 duration-200">
                                <button onClick={() => setIsBuildingModalOpen(false)} className="absolute top-4 right-4 p-1.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={20}/></button>
                                <h4 className="font-bold text-indigo-700 mb-6 text-lg border-b pb-2">{editingBuildingId ? '건물 정보 수정' : '신규 건물 추가'}</h4>
                                
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs font-semibold text-gray-600 block mb-1">건물명(동)</label><input className="w-full border p-2.5 rounded text-sm text-gray-900 border-gray-300" value={newBuilding.name} onChange={e => setNewBuilding({...newBuilding, name: e.target.value})} placeholder="예: 101동, 상가A동"/></div>
                                      <div><label className="text-xs font-semibold text-gray-600 block mb-1">주용도</label><input className="w-full border p-2.5 rounded text-sm text-gray-900 border-gray-300" value={newBuilding.spec?.mainUsage} onChange={e => setNewBuilding({...newBuilding, spec: {...newBuilding.spec!, mainUsage: e.target.value}})} placeholder="예: 공동주택"/></div>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs font-semibold text-gray-600 block mb-1">연면적(m²)</label><input type="text" className="w-full border p-2.5 rounded text-sm text-gray-900 border-gray-300" value={formatNumberInput(newBuilding.spec?.grossFloorArea)} onChange={e => setNewBuilding({...newBuilding, spec: {...newBuilding.spec!, grossFloorArea: parseNumberInput(e.target.value)}})}/></div>
                                      <div><label className="text-xs font-semibold text-gray-600 block mb-1">건축면적(m²)</label><input type="text" className="w-full border p-2.5 rounded text-sm text-gray-900 border-gray-300" value={formatNumberInput(newBuilding.spec?.buildingArea)} onChange={e => setNewBuilding({...newBuilding, spec: {...newBuilding.spec!, buildingArea: parseNumberInput(e.target.value)}})}/></div>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      <div><label className="text-xs font-semibold text-gray-600 block mb-1">지상층</label><input type="number" className="w-full border p-2.5 rounded text-sm text-gray-900 border-gray-300" value={newBuilding.spec?.floorCount?.ground || ''} onChange={e => setNewBuilding({...newBuilding, spec: {...newBuilding.spec!, floorCount: {...newBuilding.spec!.floorCount, ground: Number(e.target.value)}}})}/></div>
                                      <div><label className="text-xs font-semibold text-gray-600 block mb-1">지하층</label><input type="number" className="w-full border p-2.5 rounded text-sm text-gray-900 border-gray-300" value={newBuilding.spec?.floorCount?.underground || ''} onChange={e => setNewBuilding({...newBuilding, spec: {...newBuilding.spec!, floorCount: {...newBuilding.spec!.floorCount, underground: Number(e.target.value)}}})}/></div>
                                      <div><label className="text-xs font-semibold text-gray-600 block mb-1">주차대수</label><input type="number" className="w-full border p-2.5 rounded text-sm text-gray-900 border-gray-300" value={newBuilding.spec?.parkingCapacity || ''} onChange={e => setNewBuilding({...newBuilding, spec: {...newBuilding.spec!, parkingCapacity: Number(e.target.value)}})}/></div>
                                      <div><label className="text-xs font-semibold text-gray-600 block mb-1">승강기</label><input type="number" className="w-full border p-2.5 rounded text-sm text-gray-900 border-gray-300" value={newBuilding.spec?.elevatorCount || ''} onChange={e => setNewBuilding({...newBuilding, spec: {...newBuilding.spec!, elevatorCount: Number(e.target.value)}})}/></div>
                                  </div>
                                  
                                  <div className="flex justify-end gap-2 mt-6">
                                     <button onClick={() => setIsBuildingModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 text-sm font-medium hover:bg-gray-50">취소</button>
                                     <button onClick={handleSaveBuilding} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700 shadow-md">저장</button>
                                  </div>
                                </div>
                            </div>
                         </Modal>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {selectedProperty.buildings.map(b => (
                            <div key={b.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative group">
                               <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-800 flex items-center gap-2"><Home size={16} className="text-indigo-500"/> {b.name}</h4>
                                  <button onClick={() => openEditBuildingModal(b)} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Edit2 size={14}/></button>
                                </div>
                               <p className="text-xs text-gray-500 mt-1">{b.spec.mainUsage}</p>
                               <div className="mt-3 space-y-1 text-xs text-gray-600">
                                  <div className="flex justify-between"><span>규모</span> <span className="font-medium">B{b.spec.floorCount.underground} / F{b.spec.floorCount.ground}</span></div>
                                  <div className="flex justify-between"><span>연면적</span> <span className="font-medium">{formatArea(b.spec.grossFloorArea)}</span></div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {activeTab === 'UNIT' && (
                   <div className="h-full flex flex-col">
                      <div className="flex justify-end mb-4">
                         <button onClick={openAddUnitModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700">
                           <Plus size={16}/> 호실 추가
                         </button>
                      </div>
                      
                      {isUnitModalOpen && (
                        <Modal onClose={() => setIsUnitModalOpen(false)}>
                           <div className="bg-white w-full max-w-md p-6 rounded-lg border border-gray-300 shadow-2xl relative animate-in zoom-in-95 duration-200">
                              <button onClick={() => setIsUnitModalOpen(false)} className="absolute top-4 right-4 p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={18}/></button>
                              <h3 className="text-lg font-bold mb-6 text-gray-800 border-b pb-2">{editingUnitId ? '호실 정보 수정' : '호실 추가'}</h3>
                              <div className="space-y-4">
                                 <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">소속 건물(동)</label>
                                    <select className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded outline-none" value={newUnit.buildingId} onChange={e => setNewUnit({...newUnit, buildingId: e.target.value})}>
                                       <option value="">선택하세요</option>
                                       {selectedProperty.buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                 </div>
                                 <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-xs font-semibold text-gray-600 block mb-1">호수</label><input className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded outline-none" placeholder="예: 201" value={newUnit.unitNumber} onChange={e => setNewUnit({...newUnit, unitNumber: e.target.value})} /></div>
                                    <div><label className="text-xs font-semibold text-gray-600 block mb-1">층</label><input className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded outline-none" type="number" placeholder="예: 2" value={newUnit.floor} onChange={e => setNewUnit({...newUnit, floor: Number(e.target.value)})} /></div>
                                 </div>
                                 <div><label className="text-xs font-semibold text-gray-600 block mb-1">전용면적(m²)</label><input className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded outline-none" type="text" placeholder="84.5" value={formatNumberInput(newUnit.area)} onChange={e => setNewUnit({...newUnit, area: parseNumberInput(e.target.value)})} /></div>
                                 <div><label className="text-xs font-semibold text-gray-600 block mb-1">용도</label>
                                    <select className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded outline-none" value={newUnit.usage} onChange={e => setNewUnit({...newUnit, usage: e.target.value})}>
                                      <option value="주거">주거</option>
                                      <option value="업무">업무</option>
                                      <option value="상업">상업</option>
                                    </select>
                                 </div>
                              </div>
                              <div className="flex gap-2 mt-8">
                                 <button onClick={() => setIsUnitModalOpen(false)} className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50">취소</button>
                                 <button onClick={handleSaveUnit} className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 shadow-md">저장</button>
                              </div>
                           </div>
                        </Modal>
                     )}

                      <div className="flex-1 overflow-y-auto">
                        {selectedProperty.buildings.map(b => {
                           const unitsInBldg = propertyUnits.filter(u => u.buildingId === b.id);
                           if(unitsInBldg.length === 0) return null;
                           return (
                              <div key={b.id} className="mb-6">
                                 <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm"><Home size={14}/> {b.name} <span className="text-xs font-normal text-gray-400">({unitsInBldg.length}세대)</span></h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   {unitsInBldg.map(unit => (
                                     <div key={unit.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-all relative">
                                        <div className="flex justify-between items-center mb-3">
                                           <span className="text-lg font-bold text-gray-800">{unit.unitNumber}호</span>
                                           <button onClick={() => openEditUnitModal(unit)} className="text-gray-400 hover:text-indigo-600"><Edit2 size={14}/></button>
                                        </div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                                              unit.status === 'OCCUPIED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                              unit.status === 'VACANT' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                                            }`}>
                                              {unit.status === 'OCCUPIED' ? '임대중' : unit.status === 'VACANT' ? '공실' : '보수중'}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">전용면적</span>
                                            <span className="text-gray-900 font-medium">{formatArea(unit.area)}</span>
                                          </div>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">용도</span>
                                            <span className="text-gray-900 font-medium">{unit.usage}</span>
                                          </div>
                                        </div>
                                     </div>
                                   ))}
                                 </div>
                              </div>
                           );
                        })}
                        {propertyUnits.length === 0 && <div className="text-center py-10 text-gray-400">등록된 호실이 없습니다.</div>}
                      </div>
                   </div>
                )}
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white rounded-lg border border-gray-200 min-h-[400px]">
             <BuildingIcon size={48} className="mb-4 text-gray-200"/>
             <p>목록에서 자산을 선택하거나 신규 자산을 생성하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};
    