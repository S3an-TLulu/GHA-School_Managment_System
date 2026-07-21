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
  paymentMethod?: 'Bank' | 'Cash' | 'Mobile Money';
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

// ---- Uniform Management & Tailoring module ----
// There is no SQL database — each "table" below is a typed array persisted to a
// gha_* localStorage key and cloud-synced, with string ids as foreign keys.
export interface UniformCategory { id: string; name: string; group: string; active: boolean; }

export type UniformGender = 'Boys' | 'Girls' | 'Unisex';
export interface UniformImages { front?: string; back?: string; side?: string; detail?: string; material?: string; variants?: string[]; }
export interface UniformItem {
  id: string;
  itemCode: string;
  name: string;
  categoryId: string;
  gender: UniformGender;
  grades: string[];
  description?: string;
  material?: string;
  colour?: string;
  sleeveType?: string;
  collarType?: string;
  season?: string;
  badgeRequired?: boolean;
  logoPosition?: string;
  images: UniformImages;
  notes?: string;
  status: 'active' | 'inactive';
  price: number;
}

export interface UniformSize {
  id: string;
  sizeCode: string;
  ageRange?: string;
  typicalGrade?: string;
  chest?: number; waist?: number; hip?: number; shoulder?: number; neck?: number;
  shirtLength?: number; sleeveLength?: number; trouserLength?: number;
  skirtLength?: number; shortLength?: number;
  sockSize?: string; shoeSize?: string; headCirc?: number;
  notes?: string;
}

export interface StockRecord {
  id: string;
  itemId: string;
  colour?: string;
  size: string;
  quantity: number;
  minStock: number;
  reorderLevel?: number;
  location?: string;
  supplierId?: string;
  purchaseDate?: string;
  cost?: number;
  sellPrice?: number;
}

export type StockTxnType = 'purchase' | 'sale' | 'issue' | 'return' | 'adjustment' | 'transfer' | 'damaged' | 'lost';
export interface StockTransaction {
  id: string;
  itemId: string;
  size: string;
  colour?: string;
  type: StockTxnType;
  quantity: number; // signed: positive adds stock, negative removes
  date: string;
  user?: string;
  reason?: string;
  reference?: string;
}

export interface Tailor { id: string; name: string; phone?: string; email?: string; specialty?: string; notes?: string; }
export interface UniformSupplier { id: string; name: string; phone?: string; email?: string; address?: string; notes?: string; }
export interface UniformMaterial { id: string; name: string; colour?: string; notes?: string; }

export interface TailorOrderItem { itemId: string; size: string; quantity: number; material?: string; instructions?: string; }
export type TailorOrderStatus = 'draft' | 'sent' | 'in_production' | 'completed' | 'collected' | 'cancelled';
export interface TailorOrder {
  id: string;
  orderNo: string;
  tailorId: string;
  date: string;
  dueDate?: string;
  status: TailorOrderStatus;
  priority: 'low' | 'normal' | 'high';
  notes?: string;
  items: TailorOrderItem[];
}

export interface StudentMeasurement {
  id: string;
  studentId: string;
  className?: string;
  gender?: string;
  dateMeasured: string;
  measuredBy?: string;
  height?: number; chest?: number; waist?: number; hip?: number; shoulder?: number;
  sleeve?: number; neck?: number; shirtLength?: number; trouserLength?: number;
  skirtLength?: number; footSize?: string; headSize?: number;
  recommendedSize?: string;
  tailorNotes?: string;
}
export interface MeasurementHistory extends StudentMeasurement { archivedAt: string; }

export interface UniformIssue {
  id: string;
  studentId: string;
  itemId: string;
  size: string;
  quantity: number;
  issueDate: string;
  issuedBy?: string;
  condition?: string;
  replacementDate?: string;
}
export interface UniformReturn {
  id: string;
  studentId: string;
  itemId: string;
  size: string;
  quantity: number;
  returnDate: string;
  reason?: string;
  condition?: string;
}

export interface UniformSettings {
  itemCodePrefix: string;
  colours: string[];
  seasons: string[];
  materials: string[];
  defaultMinStock: number;
}

// A title in the school library. `totalCopies` is how many the school owns;
// copies currently on loan are derived from active BookLoan records.
export interface LibraryBook {
  id: string;
  title: string;
  author?: string;
  category?: string;
  totalCopies: number;
  coverUrl?: string;
  notes?: string;
}

// A single borrowing of a book by a student or a member of staff.
export interface BookLoan {
  id: string;
  bookId: string;
  borrowerType: 'student' | 'teacher';
  borrowerId: string;
  borrowerName: string;   // snapshot so history reads well even if the person is removed
  borrowedDate: string;
  dueDate: string;
  returnedDate?: string;
  notes?: string;
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
  // Uniform Management module
  uniformCategories: UniformCategory[];
  addUniformCategory: (c: UniformCategory) => void;
  updateUniformCategory: (id: string, c: Partial<UniformCategory>) => void;
  deleteUniformCategory: (id: string) => void;
  uniformItems: UniformItem[];
  addUniformItem: (i: UniformItem) => void;
  updateUniformItem: (id: string, i: Partial<UniformItem>) => void;
  deleteUniformItem: (id: string) => void;
  uniformSizes: UniformSize[];
  addUniformSize: (s: UniformSize) => void;
  updateUniformSize: (id: string, s: Partial<UniformSize>) => void;
  deleteUniformSize: (id: string) => void;
  uniformStock: StockRecord[];
  addStockRecord: (s: StockRecord) => void;
  updateStockRecord: (id: string, s: Partial<StockRecord>) => void;
  deleteStockRecord: (id: string) => void;
  stockTransactions: StockTransaction[];
  recordStockTransaction: (t: StockTransaction) => void;
  tailors: Tailor[];
  addTailor: (t: Tailor) => void;
  updateTailor: (id: string, t: Partial<Tailor>) => void;
  deleteTailor: (id: string) => void;
  uniformSuppliers: UniformSupplier[];
  addUniformSupplier: (s: UniformSupplier) => void;
  updateUniformSupplier: (id: string, s: Partial<UniformSupplier>) => void;
  deleteUniformSupplier: (id: string) => void;
  tailorOrders: TailorOrder[];
  addTailorOrder: (o: TailorOrder) => void;
  updateTailorOrder: (id: string, o: Partial<TailorOrder>) => void;
  deleteTailorOrder: (id: string) => void;
  studentMeasurements: StudentMeasurement[];
  saveStudentMeasurement: (m: StudentMeasurement) => void;
  deleteStudentMeasurement: (id: string) => void;
  measurementHistory: MeasurementHistory[];
  uniformIssues: UniformIssue[];
  issueUniform: (issue: UniformIssue) => void;
  uniformReturns: UniformReturn[];
  returnUniform: (ret: UniformReturn) => void;
  uniformSettings: UniformSettings;
  updateUniformSettings: (s: Partial<UniformSettings>) => void;
  libraryBooks: LibraryBook[];
  addLibraryBook: (b: LibraryBook) => void;
  updateLibraryBook: (id: string, b: Partial<LibraryBook>) => void;
  deleteLibraryBook: (id: string) => void;
  bookLoans: BookLoan[];
  borrowBook: (loan: BookLoan) => void;
  returnLoan: (id: string) => void;
  deleteLoan: (id: string) => void;
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
  bulkUpdateStudents: (changes: { id: string; patch: Partial<Student> }[]) => void;
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

const DEFAULT_UNIFORM_SETTINGS: UniformSettings = {
  itemCodePrefix: 'UNI',
  colours: ['White', 'Navy', 'Grey', 'Maroon', 'Black', 'Green', 'Blue'],
  seasons: ['All Year', 'Summer', 'Winter'],
  materials: ['Cotton', 'Poly-cotton', 'Polyester', 'Fleece', 'Denim', 'Wool'],
  defaultMinStock: 5,
};

const INITIAL_UNIFORM_CATEGORIES: UniformCategory[] = [
  { id: 'ucat-1', name: 'Boys Shirts', group: 'Formal Uniform', active: true },
  { id: 'ucat-2', name: 'Girls Shirts', group: 'Formal Uniform', active: true },
  { id: 'ucat-3', name: 'Jerseys', group: 'Formal Uniform', active: true },
  { id: 'ucat-4', name: 'Trousers', group: 'Formal Uniform', active: true },
  { id: 'ucat-5', name: 'Skirts', group: 'Formal Uniform', active: true },
  { id: 'ucat-6', name: 'Gym Dresses', group: 'Formal Uniform', active: true },
  { id: 'ucat-7', name: 'PE Shirts', group: 'Sports Uniform', active: true },
  { id: 'ucat-8', name: 'PE Shorts', group: 'Sports Uniform', active: true },
  { id: 'ucat-9', name: 'Tracksuits', group: 'Winter Wear', active: true },
  { id: 'ucat-10', name: 'Accessories', group: 'Accessories', active: true },
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
  const [uniformCategories, setUniformCategories] = useState<UniformCategory[]>(() => loadFromStorage('gha_uniform_categories', INITIAL_UNIFORM_CATEGORIES));
  const [uniformItems, setUniformItems] = useState<UniformItem[]>(() => loadFromStorage('gha_uniform_items', []));
  const [uniformSizes, setUniformSizes] = useState<UniformSize[]>(() => loadFromStorage('gha_uniform_sizes', []));
  const [uniformStock, setUniformStock] = useState<StockRecord[]>(() => loadFromStorage('gha_uniform_stock', []));
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() => loadFromStorage('gha_uniform_stock_txns', []));
  const [tailors, setTailors] = useState<Tailor[]>(() => loadFromStorage('gha_uniform_tailors', []));
  const [uniformSuppliers, setUniformSuppliers] = useState<UniformSupplier[]>(() => loadFromStorage('gha_uniform_suppliers', []));
  const [tailorOrders, setTailorOrders] = useState<TailorOrder[]>(() => loadFromStorage('gha_tailor_orders', []));
  const [studentMeasurements, setStudentMeasurements] = useState<StudentMeasurement[]>(() => loadFromStorage('gha_student_measurements', []));
  const [measurementHistory, setMeasurementHistory] = useState<MeasurementHistory[]>(() => loadFromStorage('gha_measurement_history', []));
  const [uniformIssues, setUniformIssues] = useState<UniformIssue[]>(() => loadFromStorage('gha_uniform_issues', []));
  const [uniformReturns, setUniformReturns] = useState<UniformReturn[]>(() => loadFromStorage('gha_uniform_returns', []));
  const [uniformSettings, setUniformSettings] = useState<UniformSettings>(() => loadFromStorage('gha_uniform_settings', DEFAULT_UNIFORM_SETTINGS));
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>(() => loadFromStorage('gha_library_books', []));
  const [bookLoans, setBookLoans] = useState<BookLoan[]>(() => loadFromStorage('gha_book_loans', []));
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
  useEffect(() => { localStorage.setItem('gha_uniform_categories', JSON.stringify(uniformCategories)); queueLiveSync('gha_uniform_categories'); }, [uniformCategories]);
  useEffect(() => { localStorage.setItem('gha_uniform_items', JSON.stringify(uniformItems)); queueLiveSync('gha_uniform_items'); }, [uniformItems]);
  useEffect(() => { localStorage.setItem('gha_uniform_sizes', JSON.stringify(uniformSizes)); queueLiveSync('gha_uniform_sizes'); }, [uniformSizes]);
  useEffect(() => { localStorage.setItem('gha_uniform_stock', JSON.stringify(uniformStock)); queueLiveSync('gha_uniform_stock'); }, [uniformStock]);
  useEffect(() => { localStorage.setItem('gha_uniform_stock_txns', JSON.stringify(stockTransactions)); queueLiveSync('gha_uniform_stock_txns'); }, [stockTransactions]);
  useEffect(() => { localStorage.setItem('gha_uniform_tailors', JSON.stringify(tailors)); queueLiveSync('gha_uniform_tailors'); }, [tailors]);
  useEffect(() => { localStorage.setItem('gha_uniform_suppliers', JSON.stringify(uniformSuppliers)); queueLiveSync('gha_uniform_suppliers'); }, [uniformSuppliers]);
  useEffect(() => { localStorage.setItem('gha_tailor_orders', JSON.stringify(tailorOrders)); queueLiveSync('gha_tailor_orders'); }, [tailorOrders]);
  useEffect(() => { localStorage.setItem('gha_student_measurements', JSON.stringify(studentMeasurements)); queueLiveSync('gha_student_measurements'); }, [studentMeasurements]);
  useEffect(() => { localStorage.setItem('gha_measurement_history', JSON.stringify(measurementHistory)); queueLiveSync('gha_measurement_history'); }, [measurementHistory]);
  useEffect(() => { localStorage.setItem('gha_uniform_issues', JSON.stringify(uniformIssues)); queueLiveSync('gha_uniform_issues'); }, [uniformIssues]);
  useEffect(() => { localStorage.setItem('gha_uniform_returns', JSON.stringify(uniformReturns)); queueLiveSync('gha_uniform_returns'); }, [uniformReturns]);
  useEffect(() => { localStorage.setItem('gha_uniform_settings', JSON.stringify(uniformSettings)); queueLiveSync('gha_uniform_settings'); }, [uniformSettings]);

  // One-time migration: seed the richer Uniform Management catalogue from the
  // legacy simple catalogue (gha_uniform_catalog) the first time the new module
  // is used, so existing items/stock aren't lost.
  useEffect(() => {
    if (localStorage.getItem('gha_uniform_migrated') === '1') return;
    if (uniformItems.length > 0) { localStorage.setItem('gha_uniform_migrated', '1'); return; }
    if (uniformCatalog.length === 0) return;
    const genderOf = (c: string): UniformGender => c === 'Girls' ? 'Girls' : c === 'Boys' ? 'Boys' : 'Unisex';
    const items: UniformItem[] = uniformCatalog.map((uc, idx) => ({
      id: `item-${uc.id}`,
      itemCode: `${DEFAULT_UNIFORM_SETTINGS.itemCodePrefix}-${String(idx + 1).padStart(3, '0')}`,
      name: uc.name,
      categoryId: '',
      gender: genderOf(uc.category),
      grades: [],
      images: uc.imageUrl ? { front: uc.imageUrl } : {},
      status: 'active',
      price: uc.price,
    }));
    const stock: StockRecord[] = uniformCatalog.map(uc => ({
      id: `stk-${uc.id}`, itemId: `item-${uc.id}`, size: 'One Size', quantity: uc.stock,
      minStock: DEFAULT_UNIFORM_SETTINGS.defaultMinStock, sellPrice: uc.price,
    }));
    setUniformItems(items);
    setUniformStock(prev => prev.length ? prev : stock);
    localStorage.setItem('gha_uniform_migrated', '1');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { localStorage.setItem('gha_library_books', JSON.stringify(libraryBooks)); queueLiveSync('gha_library_books'); }, [libraryBooks]);
  useEffect(() => { localStorage.setItem('gha_book_loans', JSON.stringify(bookLoans)); queueLiveSync('gha_book_loans'); }, [bookLoans]);
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

  // ---- Uniform Management module CRUD ----
  const addUniformCategory = (c: UniformCategory) => setUniformCategories(prev => [...prev, c]);
  const updateUniformCategory = (id: string, u: Partial<UniformCategory>) =>
    setUniformCategories(prev => prev.map(c => c.id === id ? { ...c, ...u } : c));
  const deleteUniformCategory = (id: string) => setUniformCategories(prev => prev.filter(c => c.id !== id));

  const addUniformItem = (i: UniformItem) => { setUniformItems(prev => [...prev, i]); logAudit('uniform-item-added', `${i.itemCode} — ${i.name}`); };
  const updateUniformItem = (id: string, u: Partial<UniformItem>) =>
    setUniformItems(prev => prev.map(i => i.id === id ? { ...i, ...u } : i));
  const deleteUniformItem = (id: string) => {
    setUniformItems(prev => prev.filter(i => i.id !== id));
    setUniformStock(prev => prev.filter(s => s.itemId !== id));
  };

  const addUniformSize = (s: UniformSize) => setUniformSizes(prev => [...prev, s]);
  const updateUniformSize = (id: string, u: Partial<UniformSize>) =>
    setUniformSizes(prev => prev.map(s => s.id === id ? { ...s, ...u } : s));
  const deleteUniformSize = (id: string) => setUniformSizes(prev => prev.filter(s => s.id !== id));

  const addStockRecord = (s: StockRecord) => setUniformStock(prev => [...prev, s]);
  const updateStockRecord = (id: string, u: Partial<StockRecord>) =>
    setUniformStock(prev => prev.map(s => s.id === id ? { ...s, ...u } : s));
  const deleteStockRecord = (id: string) => setUniformStock(prev => prev.filter(s => s.id !== id));

  // Record a stock movement AND adjust the matching stock record's quantity.
  const recordStockTransaction = (t: StockTransaction) => {
    setStockTransactions(prev => [t, ...prev]);
    setUniformStock(prev => {
      const match = prev.find(s => s.itemId === t.itemId && s.size === t.size && (s.colour || '') === (t.colour || ''));
      if (match) return prev.map(s => s.id === match.id ? { ...s, quantity: Math.max(0, s.quantity + t.quantity) } : s);
      // No stock row yet — create one when adding stock
      if (t.quantity > 0) return [...prev, { id: `stk-${Date.now()}`, itemId: t.itemId, size: t.size, colour: t.colour, quantity: t.quantity, minStock: uniformSettings.defaultMinStock }];
      return prev;
    });
    logAudit('stock-movement', `${t.type} ${t.quantity > 0 ? '+' : ''}${t.quantity} — item ${t.itemId} (${t.size})`);
  };

  const addTailor = (t: Tailor) => setTailors(prev => [...prev, t]);
  const updateTailor = (id: string, u: Partial<Tailor>) => setTailors(prev => prev.map(t => t.id === id ? { ...t, ...u } : t));
  const deleteTailor = (id: string) => setTailors(prev => prev.filter(t => t.id !== id));

  const addUniformSupplier = (s: UniformSupplier) => setUniformSuppliers(prev => [...prev, s]);
  const updateUniformSupplier = (id: string, u: Partial<UniformSupplier>) => setUniformSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...u } : s));
  const deleteUniformSupplier = (id: string) => setUniformSuppliers(prev => prev.filter(s => s.id !== id));

  const addTailorOrder = (o: TailorOrder) => { setTailorOrders(prev => [o, ...prev]); logAudit('tailor-order-created', `${o.orderNo}`); };
  const updateTailorOrder = (id: string, u: Partial<TailorOrder>) =>
    setTailorOrders(prev => prev.map(o => o.id === id ? { ...o, ...u } : o));
  const deleteTailorOrder = (id: string) => setTailorOrders(prev => prev.filter(o => o.id !== id));

  // Save a measurement; if the student already had one, archive the old to history.
  const saveStudentMeasurement = (m: StudentMeasurement) => {
    setStudentMeasurements(prev => {
      const existing = prev.find(x => x.studentId === m.studentId);
      if (existing) {
        setMeasurementHistory(h => [{ ...existing, archivedAt: new Date().toISOString() }, ...h]);
        return prev.map(x => x.studentId === m.studentId ? { ...m, id: existing.id } : x);
      }
      return [m, ...prev];
    });
  };
  const deleteStudentMeasurement = (id: string) => setStudentMeasurements(prev => prev.filter(m => m.id !== id));

  // Issue a uniform to a student — records the issue and removes it from stock.
  const issueUniform = (issue: UniformIssue) => {
    setUniformIssues(prev => [issue, ...prev]);
    recordStockTransaction({ id: `stx-${Date.now()}`, itemId: issue.itemId, size: issue.size, type: 'issue', quantity: -Math.abs(issue.quantity), date: issue.issueDate, user: issue.issuedBy, reason: 'Issued to student', reference: issue.studentId });
  };
  const returnUniform = (ret: UniformReturn) => {
    setUniformReturns(prev => [ret, ...prev]);
    recordStockTransaction({ id: `stx-${Date.now()}`, itemId: ret.itemId, size: ret.size, type: 'return', quantity: Math.abs(ret.quantity), date: ret.returnDate, reason: ret.reason || 'Returned', reference: ret.studentId });
  };

  const updateUniformSettings = (u: Partial<UniformSettings>) => setUniformSettings(prev => ({ ...prev, ...u }));

  const addLibraryBook = (b: LibraryBook) => setLibraryBooks(prev => [...prev, b]);
  const updateLibraryBook = (id: string, updated: Partial<LibraryBook>) =>
    setLibraryBooks(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
  const deleteLibraryBook = (id: string) => {
    setLibraryBooks(prev => prev.filter(b => b.id !== id));
    setBookLoans(prev => prev.filter(l => l.bookId !== id)); // drop that book's loan history too
  };
  const borrowBook = (loan: BookLoan) => setBookLoans(prev => [loan, ...prev]);
  const returnLoan = (id: string) =>
    setBookLoans(prev => prev.map(l => l.id === id ? { ...l, returnedDate: new Date().toISOString() } : l));
  const deleteLoan = (id: string) => setBookLoans(prev => prev.filter(l => l.id !== id));

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
  // Apply many student edits in a single state update (used by year-end promotion).
  const bulkUpdateStudents = (changes: { id: string; patch: Partial<Student> }[]) => {
    const map = new Map(changes.map(c => [c.id, c.patch]));
    setStudents(prev => prev.map(s => map.has(s.id) ? { ...s, ...map.get(s.id) } : s));
  };

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
    'gha_audit', 'gha_gallery', 'gha_library_books', 'gha_book_loans',
    'gha_msg_channels', 'gha_msg_telegram_channel',
    'gha_uniform_categories', 'gha_uniform_items', 'gha_uniform_sizes', 'gha_uniform_stock',
    'gha_uniform_stock_txns', 'gha_uniform_tailors', 'gha_uniform_suppliers', 'gha_tailor_orders',
    'gha_student_measurements', 'gha_measurement_history', 'gha_uniform_issues', 'gha_uniform_returns',
    'gha_uniform_settings',
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
    uniforms: ['gha_uniforms', 'gha_uniform_catalog', 'gha_uniform_categories', 'gha_uniform_items',
      'gha_uniform_sizes', 'gha_uniform_stock', 'gha_uniform_stock_txns', 'gha_uniform_tailors',
      'gha_uniform_suppliers', 'gha_tailor_orders', 'gha_student_measurements', 'gha_measurement_history',
      'gha_uniform_issues', 'gha_uniform_returns'],
    library: ['gha_library_books', 'gha_book_loans'],
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
      debtors, transportRoutes, salaryAdvances, payrollRecords, terms, todos, groceries, budgets, documents,
      galleryPhotos, libraryBooks, bookLoans]);

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
      gha_library_books: setLibraryBooks, gha_book_loans: setBookLoans,
      gha_uniform_categories: setUniformCategories, gha_uniform_items: setUniformItems,
      gha_uniform_sizes: setUniformSizes, gha_uniform_stock: setUniformStock,
      gha_uniform_stock_txns: setStockTransactions, gha_uniform_tailors: setTailors,
      gha_uniform_suppliers: setUniformSuppliers, gha_tailor_orders: setTailorOrders,
      gha_student_measurements: setStudentMeasurements, gha_measurement_history: setMeasurementHistory,
      gha_uniform_issues: setUniformIssues, gha_uniform_returns: setUniformReturns,
      gha_uniform_settings: setUniformSettings,
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
      bulkUpdateStudents,
      uniformCategories, addUniformCategory, updateUniformCategory, deleteUniformCategory,
      uniformItems, addUniformItem, updateUniformItem, deleteUniformItem,
      uniformSizes, addUniformSize, updateUniformSize, deleteUniformSize,
      uniformStock, addStockRecord, updateStockRecord, deleteStockRecord,
      stockTransactions, recordStockTransaction,
      tailors, addTailor, updateTailor, deleteTailor,
      uniformSuppliers, addUniformSupplier, updateUniformSupplier, deleteUniformSupplier,
      tailorOrders, addTailorOrder, updateTailorOrder, deleteTailorOrder,
      studentMeasurements, saveStudentMeasurement, deleteStudentMeasurement, measurementHistory,
      uniformIssues, issueUniform, uniformReturns, returnUniform,
      uniformSettings, updateUniformSettings,
      libraryBooks, addLibraryBook, updateLibraryBook, deleteLibraryBook,
      bookLoans, borrowBook, returnLoan, deleteLoan,
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
