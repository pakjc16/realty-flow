
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, BrainCircuit, Menu, Bell, Users, FileText, Wallet, Settings, ChevronDown, TrendingUp } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { PropertyManager } from './components/PropertyManager';
import { StakeholderManager } from './components/StakeholderManager';
import { ContractManager } from './components/ContractManager';
import { FinanceManager } from './components/FinanceManager';
import { AIAssistant } from './components/AIAssistant';
import { ValuationManager } from './components/ValuationManager';
import { Property, Unit, Stakeholder, LeaseContract, MaintenanceContract, PaymentTransaction, DashboardFinancials, Building, Lot, ValuationHistory, MarketComparable, MoneyUnit, AreaUnit } from './types';

// --- HELPER FUNCTIONS FOR INPUT FORMATTING ---
export const formatNumberInput = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '';
  return num.toLocaleString();
};

export const parseNumberInput = (str: string): number => {
  return Number(str.replace(/,/g, '')) || 0;
};

// --- INITIAL DATA ---

const INIT_STAKEHOLDERS: Stakeholder[] = [
  { id: 'sh1', name: '김철수', type: 'INDIVIDUAL', roles: ['TENANT'], registrationNumber: '880101-1xxxxxx', contact: { phone: '010-1234-5678', email: 'kim@test.com' } },
  { id: 'sh2', name: '이영희', type: 'INDIVIDUAL', roles: ['TENANT'], registrationNumber: '900505-2xxxxxx', contact: { phone: '010-9876-5432', email: 'lee@test.com' } },
  { id: 'sh3', name: '(주)강남부동산관리', type: 'CORPORATE', roles: ['MANAGER'], registrationNumber: '123-88-00001', representative: '박관리', contact: { phone: '02-555-0000', email: 'admin@knpm.com' } },
  { id: 'sh4', name: '최건물', type: 'INDIVIDUAL', roles: ['LANDLORD'], registrationNumber: '600101-1xxxxxx', contact: { phone: '010-1111-2222', email: 'landlord@test.com' } },
  { id: 'sh5', name: '(주)클린환경', type: 'CORPORATE', roles: ['VENDOR'], registrationNumber: '555-22-33333', representative: '정청소', contact: { phone: '02-123-4567', email: 'clean@service.com' } },
];

const LOTS_P1: Lot[] = [
  { id: 'l1', address: { dong: '역삼동', bonbun: '123', bubun: '45' }, jimok: '대', area: 200.5 },
  { id: 'l2', address: { dong: '역삼동', bonbun: '123', bubun: '46' }, jimok: '대', area: 130.0 }
];
const LOTS_P2: Lot[] = [
  { id: 'l3', address: { dong: '서초동', bonbun: '55', bubun: '12' }, jimok: '대', area: 420.0 }
];

const BLDG_P1_MAIN: Building = {
  id: 'b1', propertyId: 'p1', name: '본관',
  spec: {
    buildingArea: 180.2, grossFloorArea: 850.4, floorCount: { underground: 1, ground: 5 },
    completionDate: '2018-05-20', mainUsage: '제2종 근린생활시설', parkingCapacity: 8, elevatorCount: 1
  }
};
const BLDG_P2_101: Building = {
  id: 'b2', propertyId: 'p2', name: '101동',
  spec: {
    buildingArea: 210.0, grossFloorArea: 1200.0, floorCount: { underground: 2, ground: 7 },
    completionDate: '2020-11-15', mainUsage: '공동주택(아파트)', parkingCapacity: 15, elevatorCount: 2
  }
};

const INIT_PROPERTIES: Property[] = [
  { 
    id: 'p1', 
    type: 'LAND_AND_BUILDING',
    name: '강남 하이츠 빌', 
    masterAddress: { dong: '역삼동', bonbun: '123', bubun: '45' },
    roadAddress: '서울시 강남구 역삼동 123-45',
    lots: LOTS_P1,
    buildings: [BLDG_P1_MAIN],
    totalLandArea: 330.5,
    managerId: 'sh3'
  },
  { 
    id: 'p2', 
    type: 'AGGREGATE',
    name: '서초 그린맨션', 
    masterAddress: { dong: '서초동', bonbun: '55', bubun: '12' },
    roadAddress: '서울시 서초구 서초대로 55',
    lots: LOTS_P2,
    buildings: [BLDG_P2_101],
    totalLandArea: 420.0,
    managerId: 'sh3'
  },
];

const INIT_UNITS: Unit[] = [
  { id: 'u1', propertyId: 'p1', buildingId: 'b1', unitNumber: '101', floor: 1, area: 59.5, usage: '주거', status: 'OCCUPIED' },
  { id: 'u2', propertyId: 'p1', buildingId: 'b1', unitNumber: '102', floor: 1, area: 59.5, usage: '주거', status: 'OCCUPIED' },
  { id: 'u3', propertyId: 'p1', buildingId: 'b1', unitNumber: '201', floor: 2, area: 84.0, usage: '주거', status: 'VACANT' },
  { id: 'u4', propertyId: 'p2', buildingId: 'b2', unitNumber: '301', floor: 3, area: 110.0, usage: '주거', status: 'OCCUPIED' },
];

const INIT_LEASE_CONTRACTS: LeaseContract[] = [
  {
    id: 'lc1', type: 'LEASE_OUT', targetType: 'UNIT', targetId: 'u1', tenantId: 'sh1', status: 'ACTIVE',
    term: { contractDate: '2023-12-01', startDate: '2024-01-01', endDate: '2025-01-01', extensionType: 'NEW' },
    financialTerms: [
      {
        id: 'ft1', startDate: '2024-01-01', endDate: '2025-01-01', deposit: 200000000, monthlyRent: 1500000, vatIncluded: false, 
        paymentDay: 25, paymentType: 'POSTPAID', adminFee: 150000, managementItems: ['INTERNET', 'CLEANING', 'ELEVATOR'], 
        lateFeeRate: 5, bankAccount: '신한 110-000-000000', note: '최초 계약'
      }
    ],
    conditions: ['반려동물 금지', '실내 흡연 금지']
  },
  {
    id: 'lc2', type: 'LEASE_OUT', targetType: 'UNIT', targetId: 'u4', tenantId: 'sh2', status: 'ACTIVE',
    term: { contractDate: '2023-05-15', startDate: '2023-06-01', endDate: '2025-06-01', extensionType: 'IMPLICIT' },
    financialTerms: [
      {
        id: 'ft2', startDate: '2023-06-01', endDate: '2025-06-01', deposit: 500000000, monthlyRent: 0, vatIncluded: false, 
        paymentDay: 1, paymentType: 'PREPAID', adminFee: 300000, managementItems: ['SECURITY', 'ELEVATOR'], 
        lateFeeRate: 12, note: '전세 계약'
      }
    ],
    conditions: []
  }
];

const INIT_MAINTENANCE_CONTRACTS: MaintenanceContract[] = [
  {
    id: 'mc1', targetType: 'PROPERTY', targetId: 'p1', vendorId: 'sh5', serviceType: 'CLEANING', status: 'ACTIVE',
    term: { startDate: '2024-01-01', endDate: '2024-12-31' },
    monthlyCost: 500000, details: '주 3회 계단 및 공용부 청소'
  }
];

const INIT_VALUATIONS: ValuationHistory[] = [
  { id: 'v1', targetId: 'l1', targetType: 'LOT', year: 2023, officialValue: 5000000, marketValue: 8000000 },
  { id: 'v2', targetId: 'l1', targetType: 'LOT', year: 2024, officialValue: 5200000, marketValue: 8500000 },
];

const INIT_COMPS: MarketComparable[] = [
  { 
    id: 'c1', propertyId: 'p1', name: '역삼 빌라 A동', address: '역삼동 123-50', floor: 2, 
    date: '2024-03-01', deposit: 30000000, monthlyRent: 1200000, adminFee: 100000, area: 60, distance: 50, note: '신축' 
  }
];

const INIT_TRANSACTIONS: PaymentTransaction[] = []; 

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'properties' | 'stakeholders' | 'contracts' | 'finance' | 'ai' | 'valuation'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Display Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [moneyUnit, setMoneyUnit] = useState<MoneyUnit>('WON');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('M2');

  // Centralized Data State
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(INIT_STAKEHOLDERS);
  const [properties, setProperties] = useState<Property[]>(INIT_PROPERTIES);
  const [units, setUnits] = useState<Unit[]>(INIT_UNITS);
  const [leaseContracts, setLeaseContracts] = useState<LeaseContract[]>(INIT_LEASE_CONTRACTS);
  const [maintenanceContracts, setMaintenanceContracts] = useState<MaintenanceContract[]>(INIT_MAINTENANCE_CONTRACTS);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(INIT_TRANSACTIONS);
  const [valuations, setValuations] = useState<ValuationHistory[]>(INIT_VALUATIONS);
  const [comparables, setComparables] = useState<MarketComparable[]>(INIT_COMPS);

  // --- UNIT CONVERSION HELPERS ---
  const moneyMultiplier = {
    'WON': 1,
    'THOUSAND': 1000,
    'MAN': 10000,
    'MILLION': 1000000,
    'EOK': 100000000
  }[moneyUnit];

  const moneyLabel = {
    'WON': '원',
    'THOUSAND': '천원',
    'MAN': '만원',
    'MILLION': '백만원',
    'EOK': '억원'
  }[moneyUnit];

  const formatMoneyInput = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) return '';
    return formatNumberInput(Math.round(amount / moneyMultiplier));
  };

  const parseMoneyInput = (str: string): number => {
    const val = parseNumberInput(str);
    return val * moneyMultiplier;
  };

  useEffect(() => {
    generatePastTransactions();
  }, [leaseContracts, maintenanceContracts]); 

  const generatePastTransactions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureCap = new Date(today);
    futureCap.setFullYear(today.getFullYear() + 2); // Cap at 2 years into future

    const newTxs: PaymentTransaction[] = [];
    const updatedTransactions = [...transactions];
    let hasUpdates = false;

    const checkOverdue = (dueDate: string, currentStatus: string): 'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIAL' => {
       if (currentStatus === 'PAID') return 'PAID';
       const due = new Date(dueDate);
       const todayStart = new Date();
       todayStart.setHours(0,0,0,0);
       
       if (due < todayStart) return 'OVERDUE';
       return 'UNPAID';
    };

    updatedTransactions.forEach(tx => {
        const newStatus = checkOverdue(tx.dueDate, tx.status);
        if (newStatus !== tx.status) {
            tx.status = newStatus;
            hasUpdates = true;
        }
    });

    leaseContracts.forEach(contract => {
      if (contract.status === 'PENDING') return;
      
      const start = new Date(contract.term.startDate);
      let end = contract.term.endDate ? new Date(contract.term.endDate) : futureCap;
      if (end > futureCap) end = futureCap;

      const current = new Date(start);
      current.setDate(1); 

      while (current <= end) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const targetMonth = `${yyyy}-${mm}`;
        
        const currentMonthStart = new Date(yyyy, current.getMonth(), 1);
        const currentMonthEnd = new Date(yyyy, current.getMonth() + 1, 0);

        const currentTerm = contract.financialTerms.find(t => {
            const termStart = new Date(t.startDate);
            const termEnd = new Date(t.endDate);
            return termStart <= currentMonthEnd && termEnd >= currentMonthStart;
        });

        if (currentTerm) {
            let dueDateStr = `${targetMonth}-${String(currentTerm.paymentDay).padStart(2, '0')}`;
            const d = new Date(dueDateStr);
            const lastDay = new Date(yyyy, current.getMonth() + 1, 0).getDate();
            if (isNaN(d.getTime()) || currentTerm.paymentDay > lastDay) {
               dueDateStr = `${targetMonth}-${lastDay}`;
            }

            const isExpense = contract.type === 'LEASE_IN';
            const status = checkOverdue(dueDateStr, 'UNPAID');

            // RENT
            if (currentTerm.monthlyRent > 0) {
              const key = `${contract.id}-${targetMonth}-RENT`;
              const existingTxIndex = updatedTransactions.findIndex(t => t.id === `tx_${key}`);
              
              if (existingTxIndex === -1) {
                  newTxs.push({
                    id: `tx_${key}`,
                    contractId: contract.id,
                    contractType: 'LEASE',
                    targetMonth,
                    type: 'RENT',
                    amount: isExpense ? -currentTerm.monthlyRent : currentTerm.monthlyRent,
                    dueDate: dueDateStr,
                    status,
                    taxInvoiceIssued: false
                  });
              } else {
                  const existing = updatedTransactions[existingTxIndex];
                  if (existing.status !== 'PAID') {
                      const newAmount = isExpense ? -currentTerm.monthlyRent : currentTerm.monthlyRent;
                      if(existing.amount !== newAmount || existing.dueDate !== dueDateStr) {
                          updatedTransactions[existingTxIndex] = {
                              ...existing,
                              amount: newAmount,
                              dueDate: dueDateStr,
                              status: checkOverdue(dueDateStr, existing.status)
                          };
                          hasUpdates = true;
                      }
                  }
              }
            }
            
            // ADMIN FEE
            if (currentTerm.adminFee > 0) {
              const key = `${contract.id}-${targetMonth}-ADMIN_FEE`;
              const existingTxIndex = updatedTransactions.findIndex(t => t.id === `tx_${key}`);
              if (existingTxIndex === -1) {
                newTxs.push({
                  id: `tx_${key}`,
                  contractId: contract.id,
                  contractType: 'LEASE',
                  targetMonth,
                  type: 'ADMIN_FEE',
                  amount: isExpense ? -currentTerm.adminFee : currentTerm.adminFee,
                  dueDate: dueDateStr,
                  status,
                  taxInvoiceIssued: false
                });
              } else {
                   const existing = updatedTransactions[existingTxIndex];
                   if (existing.status !== 'PAID') {
                       const newAmount = isExpense ? -currentTerm.adminFee : currentTerm.adminFee;
                       if(existing.amount !== newAmount || existing.dueDate !== dueDateStr) {
                           updatedTransactions[existingTxIndex] = {
                               ...existing,
                               amount: newAmount,
                               dueDate: dueDateStr,
                               status: checkOverdue(dueDateStr, existing.status)
                           };
                           hasUpdates = true;
                       }
                   }
              }
            }
        }
        current.setMonth(current.getMonth() + 1);
      }
    });

    maintenanceContracts.forEach(contract => {
        if (contract.status !== 'ACTIVE' && contract.status !== 'EXPIRED') return;
        const start = new Date(contract.term.startDate);
        let end = contract.term.endDate ? new Date(contract.term.endDate) : futureCap;
        if (end > futureCap) end = futureCap;
        
        const current = new Date(start);
        current.setDate(1);

        while (current <= end) {
            const yyyy = current.getFullYear();
            const mm = String(current.getMonth() + 1).padStart(2, '0');
            const targetMonth = `${yyyy}-${mm}`;
            const dueDate = `${targetMonth}-25`;
            const status = checkOverdue(dueDate, 'UNPAID');

            if (contract.monthlyCost > 0) {
                const key = `${contract.id}-${targetMonth}-MAINTENANCE_COST`;
                const existingTxIndex = updatedTransactions.findIndex(t => t.id === `tx_${key}`);
                
                if (existingTxIndex === -1) {
                    newTxs.push({
                        id: `tx_${key}`,
                        contractId: contract.id,
                        contractType: 'MAINTENANCE',
                        targetMonth,
                        type: 'MAINTENANCE_COST',
                        amount: -contract.monthlyCost,
                        dueDate,
                        status,
                        taxInvoiceIssued: false
                    });
                } else {
                    const existing = updatedTransactions[existingTxIndex];
                    if(existing.status !== 'PAID') {
                        updatedTransactions[existingTxIndex] = {
                            ...existing,
                            amount: -contract.monthlyCost,
                            dueDate,
                            status: checkOverdue(dueDate, existing.status)
                        };
                        hasUpdates = true;
                    }
                }
            }
            current.setMonth(current.getMonth() + 1);
        }
    });

    if (newTxs.length > 0 || hasUpdates) {
        setTransactions([...updatedTransactions, ...newTxs]);
    }
  };


  const addProperty = (newProp: Property) => setProperties([...properties, newProp]);
  const updateProperty = (updatedProp: Property) => {
    setProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
  };
  const updateBuilding = (updatedBuilding: Building) => {
    setProperties(prev => prev.map(p => {
      if (p.id === updatedBuilding.propertyId) {
        return {
          ...p,
          buildings: p.buildings.map(b => b.id === updatedBuilding.id ? updatedBuilding : b)
        };
      }
      return p;
    }));
  };
  const addUnit = (newUnit: Unit) => setUnits([...units, newUnit]);
  const updateUnit = (updatedUnit: Unit) => {
    setUnits(prev => prev.map(u => u.id === updatedUnit.id ? updatedUnit : u));
  };
  const addStakeholder = (newPerson: Stakeholder) => setStakeholders([...stakeholders, newPerson]);
  const updateStakeholder = (updatedPerson: Stakeholder) => {
    setStakeholders(stakeholders.map(s => s.id === updatedPerson.id ? updatedPerson : s));
  };
  const addLeaseContract = (contract: LeaseContract) => {
    setLeaseContracts([...leaseContracts, contract]);
    if (contract.targetType === 'UNIT') {
      setUnits(prev => prev.map(u => u.id === contract.targetId ? { ...u, status: 'OCCUPIED' } : u));
    }
  };
  const updateLeaseContract = (updatedContract: LeaseContract) => {
    setLeaseContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
  };
  const addMaintenanceContract = (contract: MaintenanceContract) => {
      setMaintenanceContracts([...maintenanceContracts, contract]);
  };
  const updateMaintenanceContract = (updatedContract: MaintenanceContract) => {
    setMaintenanceContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
  };
  const addTransactions = (newTxs: PaymentTransaction[]) => setTransactions(prev => [...prev, ...newTxs]);
  const updateTransactionStatus = (txId: string, status: 'PAID' | 'UNPAID' | 'OVERDUE', paidDate?: string) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === txId ? { ...tx, status, paidDate: status === 'PAID' ? (paidDate || new Date().toISOString().split('T')[0]) : undefined } : tx
    ));
  };
  const updateTransaction = (updatedTx: PaymentTransaction) => {
      setTransactions(prev => prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
  };
  
  const addValuation = (val: ValuationHistory) => setValuations([...valuations, val]);
  const updateValuation = (val: ValuationHistory) => setValuations(prev => prev.map(v => v.id === val.id ? val : v));
  const deleteValuation = (id: string) => setValuations(prev => prev.filter(v => v.id !== id));

  const addComparable = (comp: MarketComparable) => setComparables([...comparables, comp]);

  const formatMoney = (amount: number, forceUnit?: MoneyUnit): string => {
    const unit = forceUnit || moneyUnit;
    let val = amount;
    let suffix = '원';
    
    switch(unit) {
      case 'THOUSAND': val = amount / 1000; suffix = '천원'; break;
      case 'MAN': val = amount / 10000; suffix = '만원'; break;
      case 'MILLION': val = amount / 1000000; suffix = '백만원'; break;
      case 'EOK': val = amount / 100000000; suffix = '억원'; break;
      case 'WON': default: suffix = '원'; break;
    }
    
    const displayVal = Number.isInteger(val) ? val.toLocaleString() : val.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return `${displayVal}${suffix}`;
  };

  const formatArea = (areaM2: number): string => {
    if (areaUnit === 'PYEONG') {
      return `${(areaM2 * 0.3025).toFixed(1)}평`;
    }
    return `${areaM2.toLocaleString()}㎡`;
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const collectedAmount = transactions.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);
  const overdueAmount = transactions.filter(t => t.status === 'OVERDUE').reduce((sum, t) => sum + t.amount, 0);
  const collectionRate = totalRevenue > 0 ? (collectedAmount / totalRevenue) * 100 : 0;
  const financials: DashboardFinancials = { totalRevenue, collectedAmount, overdueAmount, collectionRate };

  const NavItem = ({ view, icon, label }: { view: typeof activeView, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => { setActiveView(view); setIsSidebarOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
        activeView === view ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className={activeView === view ? 'text-white' : 'text-gray-500'}>{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-lg lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Building2 className="text-indigo-600 w-8 h-8 mr-2" />
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">RealtyFlow <span className="text-xs text-indigo-500 font-normal">Pro</span></h1>
        </div>
        <nav className="p-4 space-y-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-2">Management</div>
          <NavItem view="dashboard" icon={<LayoutDashboard size={18} />} label="통합 대시보드" />
          <NavItem view="properties" icon={<Building2 size={18} />} label="자산(물건) 관리" />
          <NavItem view="stakeholders" icon={<Users size={18} />} label="인물/업체 관리" />
          <NavItem view="valuation" icon={<TrendingUp size={18} />} label="자산 평가" />
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-6">Operation</div>
          <NavItem view="contracts" icon={<FileText size={18} />} label="계약 관리" />
          <NavItem view="finance" icon={<Wallet size={18} />} label="납입 및 청구" />
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-6">Intelligence</div>
          <NavItem view="ai" icon={<BrainCircuit size={18} />} label="AI 스마트 비서" />
        </nav>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 relative">
          <button className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-4 ml-auto">
             <div className="relative">
                <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                   <Settings size={16} className="text-gray-500"/>
                   <span className="text-xs font-medium text-gray-700">화면 설정</span>
                   <ChevronDown size={14} className="text-gray-400"/>
                </button>
                
                {isSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSettingsOpen(false)}/>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">금액 표시 단위</label>
                          <div className="grid grid-cols-3 gap-1">
                             {['WON', 'THOUSAND', 'MAN', 'MILLION', 'EOK'].map(unit => (
                               <button 
                                 key={unit}
                                 onClick={() => setMoneyUnit(unit as MoneyUnit)}
                                 className={`text-xs py-1.5 px-2 rounded border ${moneyUnit === unit ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                               >
                                 {unit === 'WON' ? '원' : unit === 'THOUSAND' ? '천원' : unit === 'MAN' ? '만원' : unit === 'MILLION' ? '백만원' : '억원'}
                               </button>
                             ))}
                          </div>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">면적 표시 단위</label>
                          <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => setAreaUnit('M2')} className={`text-xs py-1.5 rounded border ${areaUnit === 'M2' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}>제곱미터(㎡)</button>
                             <button onClick={() => setAreaUnit('PYEONG')} className={`text-xs py-1.5 rounded border ${areaUnit === 'PYEONG' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}>평</button>
                          </div>
                       </div>
                    </div>
                  </>
                )}
             </div>

             <div className="h-4 w-px bg-gray-300 hidden md:block"></div>
             
             <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors hover:bg-gray-100 rounded-full">
              <Bell size={20} />
              {financials.overdueAmount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white">
              M
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {activeView === 'dashboard' && (
            <Dashboard 
              financials={financials} 
              properties={properties} 
              contracts={leaseContracts}
              maintenanceCount={maintenanceContracts.length}
              formatMoney={formatMoney}
            />
          )}
          {activeView === 'properties' && (
            <PropertyManager 
              properties={properties} 
              units={units} 
              onAddProperty={addProperty}
              onUpdateProperty={updateProperty}
              onUpdateBuilding={updateBuilding}
              onAddUnit={addUnit}
              onUpdateUnit={updateUnit}
              formatArea={formatArea}
              formatNumberInput={formatNumberInput}
              parseNumberInput={parseNumberInput}
              formatMoneyInput={formatMoneyInput}
              parseMoneyInput={parseMoneyInput}
              moneyLabel={moneyLabel}
            />
          )}
          {activeView === 'stakeholders' && (
            <StakeholderManager 
              stakeholders={stakeholders} 
              onAddStakeholder={addStakeholder}
              onUpdateStakeholder={updateStakeholder}
              leaseContracts={leaseContracts}
              maintenanceContracts={maintenanceContracts}
              formatMoney={formatMoney}
              moneyLabel={moneyLabel}
            />
          )}
          {activeView === 'valuation' && (
            <ValuationManager 
              properties={properties}
              valuations={valuations}
              comparables={comparables}
              onAddValuation={addValuation}
              onUpdateValuation={updateValuation}
              onDeleteValuation={deleteValuation}
              onAddComparable={addComparable}
              formatMoney={formatMoney}
              formatArea={formatArea}
              formatNumberInput={formatNumberInput}
              parseNumberInput={parseNumberInput}
              formatMoneyInput={formatMoneyInput}
              parseMoneyInput={parseMoneyInput}
              moneyLabel={moneyLabel}
              areaUnit={areaUnit}
            />
          )}
          {activeView === 'contracts' && (
            <ContractManager 
              leaseContracts={leaseContracts}
              maintenanceContracts={maintenanceContracts}
              stakeholders={stakeholders}
              properties={properties}
              units={units}
              onAddLease={addLeaseContract}
              onUpdateLease={updateLeaseContract}
              onAddMaintenance={addMaintenanceContract}
              onUpdateMaintenance={updateMaintenanceContract}
              formatMoney={formatMoney}
              formatNumberInput={formatNumberInput}
              parseNumberInput={parseNumberInput}
              formatMoneyInput={formatMoneyInput}
              parseMoneyInput={parseMoneyInput}
              moneyLabel={moneyLabel}
            />
          )}
          {activeView === 'finance' && (
            <FinanceManager 
              transactions={transactions}
              contracts={leaseContracts}
              stakeholders={stakeholders}
              units={units}
              properties={properties}
              onUpdateStatus={updateTransactionStatus}
              onUpdateTransaction={updateTransaction}
              onGenerateBills={addTransactions}
              formatMoney={formatMoney}
              formatNumberInput={formatNumberInput}
              parseNumberInput={parseNumberInput}
              formatMoneyInput={formatMoneyInput}
              parseMoneyInput={parseMoneyInput}
            />
          )}
          {activeView === 'ai' && (
            <AIAssistant 
              properties={properties} 
              units={units}
            />
          )}
        </div>
      </main>
    </div>
  );
}
