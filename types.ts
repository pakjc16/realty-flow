
export type StakeholderType = 'INDIVIDUAL' | 'CORPORATE';
export type StakeholderRole = 'LANDLORD' | 'TENANT' | 'MANAGER' | 'VENDOR' | 'SAFETY_OFFICER';

export interface Stakeholder {
  id: string;
  name: string;
  type: StakeholderType;
  roles: StakeholderRole[];
  registrationNumber: string;
  representative?: string;
  contact: {
    phone: string;
    email: string;
    address?: string;
  };
  note?: string;
}

// 대한민국 주소 표준 (지번)
export interface JibunAddress {
  dong: string;   // 법정동 (예: 역삼동)
  bonbun: string; // 본번
  bubun: string;  // 부번
}

export interface BuildingSpec {
  buildingArea: number; // 건축면적 (m2)
  grossFloorArea: number; // 연면적 (m2)
  floorCount: {
    underground: number;
    ground: number;
  };
  completionDate: string;
  mainUsage: string;
  parkingCapacity: number;
  elevatorCount: number;
}

// 2단계: 건물 (동) - 예: 101동, 상가동, 본관
export interface Building {
  id: string;
  propertyId: string; // Parent Site ID
  name: string; // 동 명칭 (예: 101동, A동, 본관)
  spec: BuildingSpec;
}

// 1단계: 자산 (단지/대지) - 최상위 개념
export type PropertyType = 'AGGREGATE' | 'LAND_AND_BUILDING' | 'LAND';

export interface Lot {
  id: string;
  address: JibunAddress; // 필지 주소
  jimok: string;   // 지목
  area: number;    // 면적
}

export interface Property {
  id: string;
  type: PropertyType; 
  name: string; // 단지명 또는 자산명 (예: 은마아파트, 강남빌딩)
  
  // 대표 주소 (Master Address)
  masterAddress: JibunAddress;
  roadAddress?: string; // 도로명 주소
  
  lots: Lot[]; // 대지 구성 필지 목록
  buildings: Building[]; // 자산 내 건물 목록 (토지인 경우 빈 배열)
  
  totalLandArea: number; // 총 대지면적 (lots area 합계)
  managerId?: string;
}

// 3단계: 호실
export interface Unit {
  id: string;
  propertyId: string; // Root Parent
  buildingId: string; // Direct Parent (Building)
  unitNumber: string;
  floor: number;
  area: number;
  usage: string;
  status: 'OCCUPIED' | 'VACANT' | 'UNDER_REPAIR';
  // Listing info
  rentType?: string;
  deposit?: number;
  monthlyRent?: number;
}

// Expert Fields
export type LeaseType = 'LEASE_OUT' | 'LEASE_IN' | 'SUBLEASE';
export type ManagementItem = 'ELECTRICITY' | 'WATER' | 'GAS' | 'INTERNET' | 'TV' | 'CLEANING' | 'ELEVATOR' | 'SECURITY' | 'PARKING';
export type ContractTargetType = 'PROPERTY' | 'BUILDING' | 'UNIT';

// NEW: Financial Term History (Step-up Rent)
export interface LeaseFinancialTerm {
  id: string;
  startDate: string; // 적용 시작일
  endDate: string;   // 적용 종료일 (Add this)
  deposit: number;
  monthlyRent: number;
  vatIncluded: boolean;
  paymentDay: number;
  paymentType: 'PREPAID' | 'POSTPAID';
  
  adminFee: number;
  managementItems: ManagementItem[];
  
  lateFeeRate?: number;
  bankAccount?: string;
  note?: string; // 비고 (예: 2년차 5% 인상분)
}

export interface LeaseContract {
  id: string;
  type: LeaseType;
  
  targetType: ContractTargetType;
  targetId: string; // ID of Property, Building, or Unit

  tenantId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING';
  
  term: {
    contractDate: string;
    startDate: string;
    endDate: string;
    extensionType: 'NEW' | 'RENEWAL' | 'IMPLICIT';
  };
  
  // Changed from single object to array of terms
  financialTerms: LeaseFinancialTerm[];
  
  conditions: string[];
  note?: string;
}

export interface MaintenanceContract {
  id: string;
  targetType: ContractTargetType;
  targetId: string; // ID of Property, Building, or Unit
  
  vendorId: string;
  serviceType: 'CLEANING' | 'SECURITY' | 'ELEVATOR' | 'FIRE_SAFETY' | 'INTERNET';
  status: 'ACTIVE' | 'EXPIRED';
  term: {
    startDate: string;
    endDate: string;
  };
  monthlyCost: number;
  details: string;
}

export interface PaymentTransaction {
  id: string;
  contractId: string;
  contractType: 'LEASE' | 'MAINTENANCE';
  targetMonth: string;
  type: 'RENT' | 'ADMIN_FEE' | 'MAINTENANCE_COST' | 'DEPOSIT';
  amount: number;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIAL';
  paidDate?: string;
  taxInvoiceIssued: boolean;
}

export interface DashboardFinancials {
  totalRevenue: number;
  collectedAmount: number;
  overdueAmount: number;
  collectionRate: number;
}

// --- NEW: Valuation Types ---
export interface ValuationHistory {
  id: string;
  targetId: string; // Property ID or Lot ID or Building ID
  targetType: 'PROPERTY' | 'LOT' | 'BUILDING';
  year: number;
  officialValue: number; // 공시지가(원/m2) or 시가표준액(원)
  marketValue?: number;  // 시장 추정가(원)
  note?: string;
}

export interface MarketComparable {
  id: string;
  propertyId: string; // 내 자산 ID (비교 기준)
  name: string;       // 비교 사례 명칭 (예: 옆 건물 A)
  address?: string;   // 주소
  date: string;       // 조사일
  deposit: number;    // 보증금
  monthlyRent: number;// 월세
  adminFee: number;   // 관리비 (NOC 계산용)
  area: number;       // 전용면적 (m2)
  floor: number;      // 층수
  distance: number;   // 거리 (m)
  note?: string;
}

export type MoneyUnit = 'WON' | 'THOUSAND' | 'MAN' | 'MILLION' | 'EOK';
export type AreaUnit = 'M2' | 'PYEONG';
