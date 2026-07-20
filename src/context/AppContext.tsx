import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getCloudConfig, pushToCloud, isLiveSyncEnabled, pushKeyLive, subscribeLive } from '../lib/supabase';
import { logAudit } from '../lib/audit';

export interface Student {
  id: string;
  name: string;
  grade: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  address?: string;
  enrollmentDate: string;
  gender?: 'Male' | 'Female';
  dateOfBirth?: string;
  status?: 'active' | 'inactive' | 'transferred';
  admissionNumber?: string;
  transportRouteId?: string;
  teacherParentId?: string;
  photoUrl?: string;
}

export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Cheque' | 'Other';

export interface Payment {
  id: string;
  studentId: string;
  type: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  createdDate: string;
  term?: string;
  receiptNumber?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  mobileNetwork?: string;
}

export interface Uniform {
  id: string;
  studentId: string;
  item: string;
  price: number;
  purchaseDate: string;
  status: string;
}

export interface Requirement {
  id: string;
  studentId: string;
  item: string;
  status: 'provided' | 'pending';
  dateProvided?: string;
  term: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  phone: string;
  email?: string;
  qualification: string;
  joinDate: string;
  role: 'Teacher' | 'Deputy Head' | 'Head Teacher' | 'Support Staff';
  assignedClass?: string;
  status: 'active' | 'inactive';
  baseSalary?: number;
  photoUrl?: string;
}

export interface SalaryAdvance {
  id: string;
  teacherId: string;
  amount: number;
  date: string;
  month: string; // YYYY-MM the advance is deducted from
  notes?: string;
}

export interface PayrollRecord {
  id: string;
  teacherId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  allowances: number;
  advancesDeducted: number;
  feeDeduction: number; // school fees for teacher's own children
  otherDeductions: number;
  notes?: string;
  status: 'pending' | 'paid';
  paidDate?: string;
}

export interface Expense {
  id: string;
  description: string;
  category: 'Utilities' | 'Salaries' | 'Supplies' | 'Maintenance' | 'Food' | 'Transport' | 'Other';
  amount: number;
  date: string;
  paidBy: string;
  term: string;
  receiptNumber?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Furniture' | 'Electronics' | 'Stationery' | 'Sports' | 'Cleaning' | 'Kitchen' | 'Other';
  quantity: number;
  unit: string;
  condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
  location: string;
  lastUpdated: string;
  notes?: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  type: 'Academic' | 'Sports' | 'Cultural' | 'Meeting' | 'Holiday' | 'Fundraiser' | 'Other';
  targetAudience: 'All' | 'Students' | 'Teachers' | 'Parents';
  participationFee?: number;
  expectedParticipants?: number;
  actualRevenue?: number;
  collectionStartDate?: string;
  collectionEndDate?: string;
}

export interface FundraiserParticipant {
  id: string;
  eventId: string;
  studentId: string;
  amountPaid: number;
  paidDate: string;
}

export interface ExternalFundraiserPayment {
  id: string;
  eventId: string;
  name: string;
  phone?: string;
  amountPaid: number;
  paidDate: string;
  notes?: string;
}

export interface UniformCatalogItem {
  id: string;
  name: string;
  price: number;
  category: 'Girls' | 'Boys' | 'Both';
  stock: number;
  imageUrl?: string;
}

export interface Debtor {
  id: string;
  name: string;
  phone?: string;
  studentId?: string;
  description: string;
  amount: number;
  amountPaid: number;
  dateIncurred: string;
  dueDate?: string;
  notes?: string;
}

export interface TransportRoute {
  id: string;
  name: string;
  destination: string;
  monthlyFee: number;
  driverName?: string;
  driverPhone?: string;
  capacity?: number;
}

export type DocFolder = 'Photos' | 'Statements' | 'Reports' | 'Other';

export interface PersonDocument {
  id: string;
  ownerType: 'student' | 'teacher' | 'family';
  ownerId: string; // student/teacher id, or guardian phone for families
  folder: DocFolder;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  status: 'needed' | 'bought';
  dateAdded: string;
  boughtDate?: string;
  actualCost?: number;
}

export interface TodoItem {
  id: string;
  text: string;
  dueDate?: string;
  done: boolean;
  createdAt: string;
}

export interface FeeStructureItem {
  id: string;
  className: string;
  cashFee: number;
  installmentFee: number;
  description: string;
}

export interface OtherCharge {
  id: string;
  name: string;
  amount: string;
  per: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  priority: 'normal' | 'important' | 'urgent';
  targetAudience: 'All' | 'Students' | 'Teachers' | 'Parents';
  createdBy: string;
}

export interface SchoolBranding {
  schoolName: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  bankBranch: string;
  bankAccountNumber: string;
  principalName: string;
  logoUrl: string;
}

export interface AppTheme {
  colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  darkMode: boolean;
  sidebarStyle: 'default' | 'compact';
  // Portal background wallpaper: '' = none, 'stock:<name>' = bundled photo
  // (resolved against the app base path at apply time), otherwise a data URL.
  wallpaper?: string;
  // How strongly the wallpaper is faded towards the page background (0–95%).
  wallpaperDim?: number;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  category: string;
  imageUrl: string; // compressed data URL
  date: string;
  addedBy?: string;
}

export interface TimetableCell {
  subject: string;
  teacherName: string;
}

export interface Timetable {
  id: string;
  classGrade: string;
  slots: Record<string, TimetableCell>;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  classGrade: string;
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface StudentResult {
  id: string;
  studentId: string;
  classGrade: string;
  term: string;
  subjects: Record<string, number>;
  recordedBy: string;
  date: string;
}

interface AppContextType {
  students: Student[];
  payments: Payment[];
  uniforms: Uniform[];
  requirements: Requirement[];
  teachers: Teacher[];
  expenses: Expense[];
  inventory: InventoryItem[];
  events: SchoolEvent[];
  feeStructure: FeeStructureItem[];
  otherCharges: OtherCharge[];
  announcements: Announcement[];
  currentTerm: string;
  setCurrentTerm: (term: string) => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  addUniformPurchase: (uniform: Uniform) => void;
  addRequirement: (requirement: Requirement) => void;
  updateRequirement: (id: string, requirement: Partial<Requirement>) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addEvent: (event: SchoolEvent) => void;
  updateEvent: (id: string, event: Partial<SchoolEvent>) => void;
  deleteEvent: (id: string) => void;
  fundraiserParticipants: FundraiserParticipant[];
  toggleFundraiserParticipant: (eventId: string, studentId: string, fee: number) => void;
  externalFundraiserPayments: ExternalFundraiserPayment[];
  addExternalFundraiserPayment: (p: ExternalFundraiserPayment) => void;
  deleteExternalFundraiserPayment: (id: string) => void;
  uniformCatalog: UniformCatalogItem[];
  addUniformCatalogItem: (item: UniformCatalogItem) => void;
  updateUniformCatalogItem: (id: string, item: Partial<UniformCatalogItem>) => void;
  deleteUniformCatalogItem: (id: string) => void;
  sellUniform: (catalogItemId: string, studentId: string) => boolean;
  debtors: Debtor[];
  addDebtor: (d: Debtor) => void;
  updateDebtor: (id: string, d: Partial<Debtor>) => void;
  deleteDebtor: (id: string) => void;
  transportRoutes: TransportRoute[];
  addTransportRoute: (r: TransportRoute) => void;
  updateTransportRoute: (id: string, r: Partial<TransportRoute>) => void;
  deleteTransportRoute: (id: string) => void;
  exportAllData: () => string;
  importAllData: (json: string) => boolean;
  wipeData: (sections: string[] | 'all') => void;
  terms: string[];
  addTerm: (term: string) => void;
  deleteTerm: (term: string) => void;
  todos: TodoItem[];
  addTodo: (t: TodoItem) => void;
  updateTodo: (id: string, t: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  salaryAdvances: SalaryAdvance[];
  addSalaryAdvance: (a: SalaryAdvance) => void;
  deleteSalaryAdvance: (id: string) => void;
  payrollRecords: PayrollRecord[];
  savePayrollRecord: (r: PayrollRecord) => void;
  deletePayrollRecord: (id: string) => void;
  addStudentsBulk: (list: Student[]) => void;
  groceries: GroceryItem[];
  addGrocery: (g: GroceryItem) => void;
  updateGrocery: (id: string, g: Partial<GroceryItem>) => void;
  deleteGrocery: (id: string) => void;
  markGroceryBought: (id: string, actualCost: number) => void;
  budgets: Record<string, number>;
  setBudget: (key: string, amount: number) => void;
  documents: PersonDocument[];
  addDocument: (d: PersonDocument) => void;
  deleteDocument: (id: string) => void;
  addFeeStructureItem: (item: FeeStructureItem) => void;
  updateFeeStructureItem: (id: string, item: Partial<FeeStructureItem>) => void;
  deleteFeeStructureItem: (id: string) => void;
  addOtherCharge: (charge: OtherCharge) => void;
  updateOtherCharge: (id: string, charge: Partial<OtherCharge>) => void;
  deleteOtherCharge: (id: string) => void;
  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  attendance: AttendanceRecord[];
  saveAttendance: (records: AttendanceRecord[]) => void;
  deleteAttendanceForDate: (date: string, classGrade: string) => void;
  results: StudentResult[];
  addResult: (result: StudentResult) => void;
  updateResult: (id: string, result: Partial<StudentResult>) => void;
  deleteResult: (id: string) => void;
  saveClassResults: (classGrade: string, term: string, records: StudentResult[]) => void;
  timetables: Timetable[];
  saveTimetable: (timetable: Timetable) => void;
  branding: SchoolBranding;
  updateBranding: (b: Partial<SchoolBranding>) => void;
  theme: AppTheme;
  updateTheme: (t: Partial<AppTheme>) => void;
  galleryPhotos: GalleryPhoto[];
  addGalleryPhoto: (p: GalleryPhoto) => void;
  updateGalleryPhoto: (id: string, p: Partial<GalleryPhoto>) => void;
  deleteGalleryPhoto: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

const INITIAL_FEE_STRUCTURE: FeeStructureItem[] = [
  { id: 'fee-1', className: 'Baby Class', cashFee: 3000, installmentFee: 3200, description: 'Early childhood development program' },
  { id: 'fee-2', className: 'Middle Class', cashFee: 2700, installmentFee: 2900, description: 'Pre-primary preparation' },
  { id: 'fee-3', className: 'Reception', cashFee: 2700, installmentFee: 2900, description: 'Foundation year for primary education' },
  { id: 'fee-4', className: 'Grade 1', cashFee: 2700, installmentFee: 2900, description: 'Primary education level 1' },
  { id: 'fee-5', className: 'Grade 2', cashFee: 2700, installmentFee: 2900, description: 'Primary education level 2' },
  { id: 'fee-6', className: 'Grade 3', cashFee: 2700, installmentFee: 2900, description: 'Primary education level 3' },
  { id: 'fee-7', className: 'Grade 4', cashFee: 2700, installmentFee: 2900, description: 'Primary education level 4' },
  { id: 'fee-8', className: 'Grade 5', cashFee: 3000, installmentFee: 3200, description: 'Upper primary level 5' },
  { id: 'fee-9', className: 'Grade 6', cashFee: 3000, installmentFee: 3200, description: 'Upper primary level 6' },
  { id: 'fee-10', className: 'Grade 7', cashFee: 3000, installmentFee: 3200, description: 'Final primary year' }
];

const INITIAL_OTHER_CHARGES: OtherCharge[] = [
  { id: 'charge-1', name: 'Enrollment Form', amount: '100', per: 'once-off' },
  { id: 'charge-2', name: 'Lunch', amount: '500', per: 'per month' },
  { id: 'charge-3', name: 'Transport', amount: '600-1000', per: 'per month' },
  { id: 'charge-4', name: 'Water', amount: '40', per: 'per term' },
  { id: 'charge-5', name: 'Assessment Tests', amount: '200', per: 'per term' }
];

const INITIAL_UNIFORM_CATALOG: UniformCatalogItem[] = [
  { id: 'uc-1',  name: 'Girl Dress',                  price: 250, category: 'Girls', stock: 20 },
  { id: 'uc-2',  name: 'Girl Skirt',                  price: 200, category: 'Girls', stock: 20 },
  { id: 'uc-3',  name: 'Long Sleeved Shirt',          price: 180, category: 'Both',  stock: 30 },
  { id: 'uc-4',  name: 'Short Sleeved Shirt',         price: 180, category: 'Both',  stock: 30 },
  { id: 'uc-5',  name: 'Shorts',                      price: 150, category: 'Boys',  stock: 25 },
  { id: 'uc-6',  name: 'Trousers',                    price: 200, category: 'Boys',  stock: 25 },
  { id: 'uc-7',  name: 'Tracksuit (Premium)',         price: 600, category: 'Both',  stock: 10 },
  { id: 'uc-8',  name: 'Tracksuit (Standard)',        price: 400, category: 'Both',  stock: 15 },
  { id: 'uc-9',  name: 'Boys & Girls Jersey',         price: 350, category: 'Both',  stock: 20 },
  { id: 'uc-10', name: 'Physical Education Shirts',   price: 150, category: 'Both',  stock: 25 },
  { id: 'uc-11', name: 'Physical Education Shorts',   price: 200, category: 'Both',  stock: 25 },
  { id: 'uc-12', name: 'Physical Education Skirts',   price: 200, category: 'Girls', stock: 20 },
  { id: 'uc-13', name: '2 Pairs of Socks',            price: 100, category: 'Both',  stock: 50 },
];

const DEFAULT_BRANDING: SchoolBranding = {
  schoolName: 'Great Highway Academy',
  motto: 'Excellence in Education',
  address: 'Great East Road, Lusaka, Zambia',
  phone: '+260 97X XXX XXX',
  email: 'info@greathighwayacademy.edu.zm',
  website: 'www.greathighwayacademy.edu.zm',
  bankName: 'First Alliance Bank',
  bankBranch: 'East Park Branch',
  bankAccountNumber: '0060700054001',
  principalName: 'Mrs. Tembo',
  logoUrl: '',
};

const DEFAULT_THEME: AppTheme = {
  colorScheme: 'blue',
  darkMode: false,
  sidebarStyle: 'default',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadFromStorage('gha_attendance', []));
  const [fundraiserParticipants, setFundraiserParticipants] = useState<FundraiserParticipant[]>(() => loadFromStorage('gha_fundraiser_participants', []));
  const [externalFundraiserPayments, setExternalFundraiserPayments] = useState<ExternalFundraiserPayment[]>(() => loadFromStorage('gha_external_fundraiser', []));
  const [uniformCatalog, setUniformCatalog] = useState<UniformCatalogItem[]>(() => loadFromStorage('gha_uniform_catalog', INITIAL_UNIFORM_CATALOG));
  const [debtors, setDebtors] = useState<Debtor[]>(() => loadFromStorage('gha_debtors', []));
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(() => loadFromStorage('gha_transport_routes', []));
  const [terms, setTerms] = useState<string[]>(() => loadFromStorage('gha_terms', ['Term 1 2026', 'Term 2 2026', 'Term 3 2026', 'Term 1 2025', 'Term 2 2025', 'Term 3 2025']));
  const [todos, setTodos] = useState<TodoItem[]>(() => loadFromStorage('gha_todos', []));
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>(() => loadFromStorage('gha_salary_advances', []));
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => loadFromStorage('gha_payroll', []));
  const [groceries, setGroceries] = useState<GroceryItem[]>(() => loadFromStorage('gha_groceries', []));
  const [budgets, setBudgets] = useState<Record<string, number>>(() => loadFromStorage('gha_budgets', {}));
  const [documents, setDocuments] = useState<PersonDocument[]>(() => loadFromStorage('gha_documents', []));
  const [results, setResults] = useState<StudentResult[]>(() => loadFromStorage('gha_results', []));
  const [timetables, setTimetables] = useState<Timetable[]>(() => loadFromStorage('gha_timetables', []));
  const [branding, setBranding] = useState<SchoolBranding>(() => loadFromStorage('gha_branding', DEFAULT_BRANDING));
  const [theme, setTheme] = useState<AppTheme>(() => loadFromStorage('gha_theme', DEFAULT_THEME));
  const [students, setStudents] = useState<Student[]>(() => loadFromStorage('gha_students', []));
  const [payments, setPayments] = useState<Payment[]>(() => loadFromStorage('gha_payments', []));
  const [uniforms, setUniforms] = useState<Uniform[]>(() => loadFromStorage('gha_uniforms', []));
  const [requirements, setRequirements] = useState<Requirement[]>(() => loadFromStorage('gha_requirements', []));
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadFromStorage('gha_teachers', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadFromStorage('gha_expenses', []));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadFromStorage('gha_inventory', []));
  const [events, setEvents] = useState<SchoolEvent[]>(() => loadFromStorage('gha_events', []));
  const [feeStructure, setFeeStructure] = useState<FeeStructureItem[]>(() => loadFromStorage('gha_feestructure', INITIAL_FEE_STRUCTURE));
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>(() => loadFromStorage('gha_othercharges', INITIAL_OTHER_CHARGES));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadFromStorage('gha_announcements', []));
  const [currentTerm, setCurrentTerm] = useState<string>(() => loadFromStorage('gha_currentTerm', 'Term 1 2026'));
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>(() => loadFromStorage('gha_gallery', []));

  // ---- Live sync machinery (Phase 7) ----
  // Debounced per-key push; suppress set stops remote-applied changes from
  // echoing straight back to the cloud (which would ping-pong between devices).
  const liveSuppress = useRef<Set<string>>(new Set());
  const liveDirty = useRef<Set<string>>(new Set());
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueLiveSync = (key: string) => {
    if (liveSuppress.current.has(key)) { liveSuppress.current.delete(key); return; }
    if (!isLiveSyncEnabled()) return;
    liveDirty.current.add(key);
    if (liveTimer.current) clearTimeout(liveTimer.current);
    liveTimer.current = setTimeout(() => {
      const keys = [...liveDirty.current];
      liveDirty.current.clear();
      keys.forEach(k => { pushKeyLive(k); });
    }, 2500);
  };

  useEffect(() => { localStorage.setItem('gha_attendance', JSON.stringify(attendance)); queueLiveSync('gha_attendance'); }, [attendance]);
  useEffect(() => { localStorage.setItem('gha_fundraiser_participants', JSON.stringify(fundraiserParticipants)); queueLiveSync('gha_fundraiser_participants'); }, [fundraiserParticipants]);
  useEffect(() => { localStorage.setItem('gha_external_fundraiser', JSON.stringify(externalFundraiserPayments)); queueLiveSync('gha_external_fundraiser'); }, [externalFundraiserPayments]);
  useEffect(() => { localStorage.setItem('gha_uniform_catalog', JSON.stringify(uniformCatalog)); queueLiveSync('gha_uniform_catalog'); }, [uniformCatalog]);
  useEffect(() => { localStorage.setItem('gha_debtors', JSON.stringify(debtors)); queueLiveSync('gha_debtors'); }, [debtors]);
  useEffect(() => { localStorage.setItem('gha_transport_routes', JSON.stringify(transportRoutes)); queueLiveSync('gha_transport_routes'); }, [transportRoutes]);
  useEffect(() => { localStorage.setItem('gha_terms', JSON.stringify(terms)); queueLiveSync('gha_terms'); }, [terms]);
  useEffect(() => { localStorage.setItem('gha_todos', JSON.stringify(todos)); queueLiveSync('gha_todos'); }, [todos]);
  useEffect(() => { localStorage.setItem('gha_salary_advances', JSON.stringify(salaryAdvances)); queueLiveSync('gha_salary_advances'); }, [salaryAdvances]);
  useEffect(() => { localStorage.setItem('gha_payroll', JSON.stringify(payrollRecords)); queueLiveSync('gha_payroll'); }, [payrollRecords]);
  useEffect(() => { localStorage.setItem('gha_groceries', JSON.stringify(groceries)); queueLiveSync('gha_groceries'); }, [groceries]);
  useEffect(() => { localStorage.setItem('gha_budgets', JSON.stringify(budgets)); queueLiveSync('gha_budgets'); }, [budgets]);
  useEffect(() => { localStorage.setItem('gha_documents', JSON.stringify(documents)); queueLiveSync('gha_documents'); }, [documents]);
  useEffect(() => { localStorage.setItem('gha_results', JSON.stringify(results)); queueLiveSync('gha_results'); }, [results]);
  useEffect(() => { localStorage.setItem('gha_timetables', JSON.stringify(timetables)); queueLiveSync('gha_timetables'); }, [timetables]);
  useEffect(() => { localStorage.setItem('gha_branding', JSON.stringify(branding)); queueLiveSync('gha_branding'); }, [branding]);
  useEffect(() => { localStorage.setItem('gha_theme', JSON.stringify(theme)); queueLiveSync('gha_theme'); }, [theme]);
  useEffect(() => { localStorage.setItem('gha_students', JSON.stringify(students)); queueLiveSync('gha_students'); }, [students]);
  useEffect(() => { localStorage.setItem('gha_payments', JSON.stringify(payments)); queueLiveSync('gha_payments'); }, [payments]);
  useEffect(() => { localStorage.setItem('gha_uniforms', JSON.stringify(uniforms)); queueLiveSync('gha_uniforms'); }, [uniforms]);
  useEffect(() => { localStorage.setItem('gha_requirements', JSON.stringify(requirements)); queueLiveSync('gha_requirements'); }, [requirements]);
  useEffect(() => { localStorage.setItem('gha_teachers', JSON.stringify(teachers)); queueLiveSync('gha_teachers'); }, [teachers]);
  useEffect(() => { localStorage.setItem('gha_expenses', JSON.stringify(expenses)); queueLiveSync('gha_expenses'); }, [expenses]);
  useEffect(() => { localStorage.setItem('gha_inventory', JSON.stringify(inventory)); queueLiveSync('gha_inventory'); }, [inventory]);
  useEffect(() => { localStorage.setItem('gha_events', JSON.stringify(events)); queueLiveSync('gha_events'); }, [events]);
  useEffect(() => { localStorage.setItem('gha_feestructure', JSON.stringify(feeStructure)); queueLiveSync('gha_feestructure'); }, [feeStructure]);
  useEffect(() => { localStorage.setItem('gha_othercharges', JSON.stringify(otherCharges)); queueLiveSync('gha_othercharges'); }, [otherCharges]);
  useEffect(() => { localStorage.setItem('gha_announcements', JSON.stringify(announcements)); queueLiveSync('gha_announcements'); }, [announcements]);
  useEffect(() => { localStorage.setItem('gha_currentTerm', JSON.stringify(currentTerm)); queueLiveSync('gha_currentTerm'); }, [currentTerm]);
  useEffect(() => { localStorage.setItem('gha_gallery', JSON.stringify(galleryPhotos)); queueLiveSync('gha_gallery'); }, [galleryPhotos]);

  const addStudent = (student: Student) => setStudents(prev => [...prev, student]);
  const updateStudent = (id: string, updated: Partial<Student>) =>
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setPayments(prev => prev.filter(p => p.studentId !== id));
    setUniforms(prev => prev.filter(u => u.studentId !== id));
    setRequirements(prev => prev.filter(r => r.studentId !== id));
    setResults(prev => prev.filter(r => r.studentId !== id));
  };

  const nameForStudent = (sid: string) => {
    const s = students.find(st => st.id === sid);
    return s ? s.name : sid;
  };
  const addPayment = (payment: Payment) => {
    setPayments(prev => [...prev, payment]);
    logAudit('payment-added', `${nameForStudent(payment.studentId)} — ${payment.type} K${payment.amount ?? '?'}`);
  };
  const updatePayment = (id: string, updated: Partial<Payment>) =>
    setPayments(prev => {
      const before = prev.find(p => p.id === id);
      if (before) {
        const amtChanged = updated.amount !== undefined && updated.amount !== before.amount;
        logAudit('payment-edited', amtChanged
          ? `${nameForStudent(before.studentId)}: K${before.amount} → K${updated.amount}`
          : `${nameForStudent(before.studentId)} — ${before.type}`);
      }
      return prev.map(p => p.id === id ? { ...p, ...updated } : p);
    });
  const deletePayment = (id: string) => setPayments(prev => {
    const before = prev.find(p => p.id === id);
    if (before) logAudit('payment-deleted', `${nameForStudent(before.studentId)} — ${before.type} K${before.amount ?? '?'}`);
    return prev.filter(p => p.id !== id);
  });

  const addUniformPurchase = (uniform: Uniform) => setUniforms(prev => [...prev, uniform]);

  const addRequirement = (requirement: Requirement) => setRequirements(prev => [...prev, requirement]);
  const updateRequirement = (id: string, updated: Partial<Requirement>) =>
    setRequirements(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));

  const addTeacher = (teacher: Teacher) => setTeachers(prev => [...prev, teacher]);
  const updateTeacher = (id: string, updated: Partial<Teacher>) =>
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  const deleteTeacher = (id: string) => setTeachers(prev => prev.filter(t => t.id !== id));

  const addExpense = (expense: Expense) => setExpenses(prev => [...prev, expense]);
  const updateExpense = (id: string, updated: Partial<Expense>) =>
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
  const deleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  const addInventoryItem = (item: InventoryItem) => setInventory(prev => [...prev, item]);
  const updateInventoryItem = (id: string, updated: Partial<InventoryItem>) =>
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
  const deleteInventoryItem = (id: string) => setInventory(prev => prev.filter(i => i.id !== id));

  const addEvent = (event: SchoolEvent) => setEvents(prev => [...prev, event]);
  const updateEvent = (id: string, updated: Partial<SchoolEvent>) =>
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setFundraiserParticipants(prev => prev.filter(p => p.eventId !== id));
  };

  const toggleFundraiserParticipant = (eventId: string, studentId: string, fee: number) => {
    setFundraiserParticipants(prev => {
      const existing = prev.find(p => p.eventId === eventId && p.studentId === studentId);
      if (existing) return prev.filter(p => !(p.eventId === eventId && p.studentId === studentId));
      return [...prev, { id: `fp-${Date.now()}`, eventId, studentId, amountPaid: fee, paidDate: new Date().toISOString() }];
    });
  };

  const addExternalFundraiserPayment = (p: ExternalFundraiserPayment) => setExternalFundraiserPayments(prev => [...prev, p]);
  const deleteExternalFundraiserPayment = (id: string) => setExternalFundraiserPayments(prev => prev.filter(p => p.id !== id));

  const addUniformCatalogItem = (item: UniformCatalogItem) => setUniformCatalog(prev => [...prev, item]);
  const updateUniformCatalogItem = (id: string, updated: Partial<UniformCatalogItem>) =>
    setUniformCatalog(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
  const deleteUniformCatalogItem = (id: string) => setUniformCatalog(prev => prev.filter(i => i.id !== id));

  const sellUniform = (catalogItemId: string, studentId: string): boolean => {
    const item = uniformCatalog.find(i => i.id === catalogItemId);
    if (!item || item.stock <= 0) return false;
    setUniformCatalog(prev => prev.map(i => i.id === catalogItemId ? { ...i, stock: i.stock - 1 } : i));
    setUniforms(prev => [...prev, {
      id: `uniform-${Date.now()}`,
      studentId,
      item: item.name,
      price: item.price,
      purchaseDate: new Date().toISOString(),
      status: 'purchased',
    }]);
    return true;
  };

  const addDebtor = (d: Debtor) => setDebtors(prev => [...prev, d]);
  const updateDebtor = (id: string, updated: Partial<Debtor>) =>
    setDebtors(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
  const deleteDebtor = (id: string) => setDebtors(prev => prev.filter(d => d.id !== id));

  const addTerm = (term: string) => setTerms(prev => prev.includes(term) ? prev : [term, ...prev]);
  const deleteTerm = (term: string) => setTerms(prev => prev.filter(t => t !== term));

  const addTodo = (t: TodoItem) => setTodos(prev => [...prev, t]);
  const updateTodo = (id: string, updated: Partial<TodoItem>) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  const deleteTodo = (id: string) => setTodos(prev => prev.filter(t => t.id !== id));

  const addSalaryAdvance = (a: SalaryAdvance) => setSalaryAdvances(prev => [...prev, a]);
  const deleteSalaryAdvance = (id: string) => setSalaryAdvances(prev => prev.filter(a => a.id !== id));

  const savePayrollRecord = (r: PayrollRecord) =>
    setPayrollRecords(prev => {
      const exists = prev.find(p => p.teacherId === r.teacherId && p.month === r.month);
      return exists ? prev.map(p => (p.teacherId === r.teacherId && p.month === r.month) ? { ...r, id: p.id } : p) : [...prev, r];
    });
  const deletePayrollRecord = (id: string) => setPayrollRecords(prev => prev.filter(p => p.id !== id));

  const addStudentsBulk = (list: Student[]) => setStudents(prev => [...prev, ...list]);

  const addGrocery = (g: GroceryItem) => setGroceries(prev => [...prev, g]);
  const updateGrocery = (id: string, updated: Partial<GroceryItem>) =>
    setGroceries(prev => prev.map(g => g.id === id ? { ...g, ...updated } : g));
  const deleteGrocery = (id: string) => setGroceries(prev => prev.filter(g => g.id !== id));
  // Buying a grocery item records it as a Food expense for the current term
  const markGroceryBought = (id: string, actualCost: number) => {
    const item = groceries.find(g => g.id === id);
    if (!item) return;
    setGroceries(prev => prev.map(g => g.id === id ? { ...g, status: 'bought', boughtDate: new Date().toISOString(), actualCost } : g));
    setExpenses(prev => [...prev, {
      id: `expense-${Date.now()}`,
      description: `Kitchen: ${item.name} (${item.quantity} ${item.unit})`,
      category: 'Food',
      amount: actualCost,
      date: new Date().toISOString(),
      paidBy: 'Kitchen',
      term: currentTerm,
    }]);
  };

  const addDocument = (d: PersonDocument) => setDocuments(prev => [...prev, d]);
  const deleteDocument = (id: string) => setDocuments(prev => prev.filter(d => d.id !== id));

  const setBudget = (key: string, amount: number) =>
    setBudgets(prev => ({ ...prev, [key]: amount }));

  const addTransportRoute = (r: TransportRoute) => setTransportRoutes(prev => [...prev, r]);
  const updateTransportRoute = (id: string, updated: Partial<TransportRoute>) =>
    setTransportRoutes(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
  const deleteTransportRoute = (id: string) => {
    setTransportRoutes(prev => prev.filter(r => r.id !== id));
    setStudents(prev => prev.map(s => s.transportRouteId === id ? { ...s, transportRouteId: undefined } : s));
  };

  // ---- Backup / Restore / Cleanup ----
  const GHA_KEYS = [
    'gha_students', 'gha_payments', 'gha_uniforms', 'gha_requirements', 'gha_teachers',
    'gha_expenses', 'gha_inventory', 'gha_events', 'gha_feestructure', 'gha_othercharges',
    'gha_announcements', 'gha_attendance', 'gha_results', 'gha_timetables', 'gha_branding',
    'gha_theme', 'gha_currentTerm', 'gha_fundraiser_participants', 'gha_external_fundraiser',
    'gha_uniform_catalog', 'gha_debtors', 'gha_transport_routes', 'gha_users', 'gha_claims', 'gha_master_code',
    'gha_terms', 'gha_todos', 'gha_salary_advances', 'gha_payroll', 'gha_groceries', 'gha_budgets', 'gha_documents',
    'gha_audit', 'gha_gallery',
  ];

  const exportAllData = (): string => {
    const data: Record<string, unknown> = { _meta: { app: 'GHA-SMS', exportedAt: new Date().toISOString(), version: 1 } };
    GHA_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) { try { data[k] = JSON.parse(v); } catch { data[k] = v; } }
    });
    return JSON.stringify(data, null, 2);
  };

  const importAllData = (json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (!data || typeof data !== 'object' || !data._meta || data._meta.app !== 'GHA-SMS') return false;
      GHA_KEYS.forEach(k => {
        if (k in data) localStorage.setItem(k, JSON.stringify(data[k]));
      });
      window.location.reload();
      return true;
    } catch {
      return false;
    }
  };

  // Section keys map for selective wipe
  const SECTION_KEYS: Record<string, string[]> = {
    students: ['gha_students'],
    payments: ['gha_payments'],
    uniforms: ['gha_uniforms', 'gha_uniform_catalog'],
    requirements: ['gha_requirements'],
    teachers: ['gha_teachers'],
    expenses: ['gha_expenses'],
    inventory: ['gha_inventory'],
    events: ['gha_events', 'gha_fundraiser_participants', 'gha_external_fundraiser'],
    attendance: ['gha_attendance'],
    results: ['gha_results'],
    timetables: ['gha_timetables'],
    announcements: ['gha_announcements'],
    debtors: ['gha_debtors'],
    transport: ['gha_transport_routes'],
    hr: ['gha_salary_advances', 'gha_payroll'],
    kitchen: ['gha_groceries'],
    documents: ['gha_documents'],
    gallery: ['gha_gallery'],
  };

  // Auto cloud sync: when enabled in Settings → Cloud Sync, push the whole
  // dataset to Supabase 10 seconds after the last change (debounced).
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const { key, autoSync } = getCloudConfig();
    if (!autoSync || !key) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => { pushToCloud(exportAllData()); }, 10000);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, payments, uniforms, requirements, teachers, expenses, inventory, events,
      feeStructure, otherCharges, announcements, attendance, results, timetables, branding,
      currentTerm, fundraiserParticipants, externalFundraiserPayments, uniformCatalog,
      debtors, transportRoutes, salaryAdvances, payrollRecords, terms, todos, groceries, budgets, documents, galleryPhotos]);

  // Apply changes arriving from other devices in real time
  useEffect(() => {
    if (!isLiveSyncEnabled()) return;
    const SETTERS: Record<string, (v: never) => void> = {
      gha_students: setStudents, gha_payments: setPayments, gha_uniforms: setUniforms,
      gha_requirements: setRequirements, gha_teachers: setTeachers, gha_expenses: setExpenses,
      gha_inventory: setInventory, gha_events: setEvents, gha_feestructure: setFeeStructure,
      gha_othercharges: setOtherCharges, gha_announcements: setAnnouncements,
      gha_attendance: setAttendance, gha_results: setResults, gha_timetables: setTimetables,
      gha_branding: setBranding, gha_theme: setTheme, gha_currentTerm: setCurrentTerm,
      gha_fundraiser_participants: setFundraiserParticipants,
      gha_external_fundraiser: setExternalFundraiserPayments,
      gha_uniform_catalog: setUniformCatalog, gha_debtors: setDebtors,
      gha_transport_routes: setTransportRoutes, gha_terms: setTerms, gha_todos: setTodos,
      gha_salary_advances: setSalaryAdvances, gha_payroll: setPayrollRecords,
      gha_groceries: setGroceries, gha_budgets: setBudgets, gha_documents: setDocuments,
      gha_gallery: setGalleryPhotos,
    } as Record<string, (v: never) => void>;

    const unsubscribe = subscribeLive((key, data) => {
      const setter = SETTERS[key];
      if (!setter || data === null || data === undefined) return;
      liveSuppress.current.add(key);
      setter(data as never);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wipe writes EMPTY values instead of removing keys — removing them would
  // bring the built-in sample/mock data back on the next reload, because the
  // defaults only apply when a key is missing entirely.
  const EMPTY_VALUES: Record<string, string> = {
    gha_budgets: '{}',
    gha_currentTerm: '"Term 1 2026"',
    gha_terms: JSON.stringify(['Term 1 2026', 'Term 2 2026', 'Term 3 2026']),
  };
  const wipeKey = (k: string) => {
    if (['gha_branding', 'gha_theme', 'gha_users', 'gha_master_code'].includes(k)) { localStorage.removeItem(k); return; }
    localStorage.setItem(k, EMPTY_VALUES[k] ?? '[]');
  };
  const wipeData = (sections: string[] | 'all') => {
    if (sections === 'all') {
      GHA_KEYS.forEach(wipeKey);
    } else {
      sections.forEach(s => (SECTION_KEYS[s] || []).forEach(wipeKey));
    }
    window.location.reload();
  };

  const addFeeStructureItem = (item: FeeStructureItem) => setFeeStructure(prev => [...prev, item]);
  const updateFeeStructureItem = (id: string, updated: Partial<FeeStructureItem>) =>
    setFeeStructure(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
  const deleteFeeStructureItem = (id: string) => setFeeStructure(prev => prev.filter(f => f.id !== id));

  const addOtherCharge = (charge: OtherCharge) => setOtherCharges(prev => [...prev, charge]);
  const updateOtherCharge = (id: string, updated: Partial<OtherCharge>) =>
    setOtherCharges(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  const deleteOtherCharge = (id: string) => setOtherCharges(prev => prev.filter(c => c.id !== id));

  const addAnnouncement = (announcement: Announcement) => setAnnouncements(prev => [...prev, announcement]);
  const updateAnnouncement = (id: string, updated: Partial<Announcement>) =>
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
  const deleteAnnouncement = (id: string) => setAnnouncements(prev => prev.filter(a => a.id !== id));

  const addResult = (result: StudentResult) => setResults(prev => [...prev, result]);
  const updateResult = (id: string, updated: Partial<StudentResult>) =>
    setResults(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
  const deleteResult = (id: string) => setResults(prev => prev.filter(r => r.id !== id));
  const saveClassResults = (classGrade: string, term: string, records: StudentResult[]) =>
    setResults(prev => [
      ...prev.filter(r => !(r.classGrade === classGrade && r.term === term)),
      ...records
    ]);

  const saveAttendance = (records: AttendanceRecord[]) => {
    if (records.length === 0) return;
    const { date, classGrade } = records[0];
    setAttendance(prev => [
      ...prev.filter(r => !(r.date === date && r.classGrade === classGrade)),
      ...records
    ]);
  };
  const deleteAttendanceForDate = (date: string, classGrade: string) =>
    setAttendance(prev => prev.filter(r => !(r.date === date && r.classGrade === classGrade)));

  const saveTimetable = (timetable: Timetable) =>
    setTimetables(prev => {
      const exists = prev.find(t => t.id === timetable.id);
      return exists ? prev.map(t => t.id === timetable.id ? timetable : t) : [...prev, timetable];
    });

  const updateBranding = (b: Partial<SchoolBranding>) => setBranding(prev => ({ ...prev, ...b }));
  const updateTheme = (t: Partial<AppTheme>) => setTheme(prev => ({ ...prev, ...t }));

  const addGalleryPhoto = (p: GalleryPhoto) => setGalleryPhotos(prev => [p, ...prev]);
  const updateGalleryPhoto = (id: string, updated: Partial<GalleryPhoto>) =>
    setGalleryPhotos(prev => prev.map(g => g.id === id ? { ...g, ...updated } : g));
  const deleteGalleryPhoto = (id: string) => setGalleryPhotos(prev => prev.filter(g => g.id !== id));

  return (
    <AppContext.Provider value={{
      students, payments, uniforms, requirements, teachers, expenses, inventory, events,
      feeStructure, otherCharges, announcements,
      currentTerm, setCurrentTerm,
      addStudent, updateStudent, deleteStudent,
      addPayment, updatePayment, deletePayment,
      addUniformPurchase,
      addRequirement, updateRequirement,
      addTeacher, updateTeacher, deleteTeacher,
      addExpense, updateExpense, deleteExpense,
      addInventoryItem, updateInventoryItem, deleteInventoryItem,
      addEvent, updateEvent, deleteEvent,
      fundraiserParticipants, toggleFundraiserParticipant,
      externalFundraiserPayments, addExternalFundraiserPayment, deleteExternalFundraiserPayment,
      uniformCatalog, addUniformCatalogItem, updateUniformCatalogItem, deleteUniformCatalogItem, sellUniform,
      debtors, addDebtor, updateDebtor, deleteDebtor,
      transportRoutes, addTransportRoute, updateTransportRoute, deleteTransportRoute,
      exportAllData, importAllData, wipeData,
      terms, addTerm, deleteTerm,
      todos, addTodo, updateTodo, deleteTodo,
      salaryAdvances, addSalaryAdvance, deleteSalaryAdvance,
      payrollRecords, savePayrollRecord, deletePayrollRecord,
      addStudentsBulk,
      groceries, addGrocery, updateGrocery, deleteGrocery, markGroceryBought,
      budgets, setBudget,
      documents, addDocument, deleteDocument,
      addFeeStructureItem, updateFeeStructureItem, deleteFeeStructureItem,
      addOtherCharge, updateOtherCharge, deleteOtherCharge,
      addAnnouncement, updateAnnouncement, deleteAnnouncement,
      attendance, saveAttendance, deleteAttendanceForDate,
      results, addResult, updateResult, deleteResult, saveClassResults,
      timetables, saveTimetable,
      branding, updateBranding,
      theme, updateTheme,
      galleryPhotos, addGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
