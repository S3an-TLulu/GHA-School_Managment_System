import React, { createContext, useContext, useState, useEffect } from 'react';

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

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'student-1',
    name: 'Sarah Mwanza',
    grade: 'Grade 5',
    gender: 'Female',
    guardianName: 'Mary Mwanza',
    guardianPhone: '0977123456',
    guardianEmail: 'mary.mwanza@email.com',
    address: '123 Kabulonga Road, Lusaka',
    enrollmentDate: '2024-01-15T00:00:00.000Z',
    status: 'active',
    admissionNumber: 'GHA-2024-001'
  },
  {
    id: 'student-2',
    name: 'John Banda',
    grade: 'Grade 3',
    gender: 'Male',
    guardianName: 'Peter Banda',
    guardianPhone: '0966987654',
    guardianEmail: 'peter.banda@email.com',
    address: '456 Roma Road, Lusaka',
    enrollmentDate: '2024-01-10T00:00:00.000Z',
    status: 'active',
    admissionNumber: 'GHA-2024-002'
  },
  {
    id: 'student-3',
    name: 'Grace Phiri',
    grade: 'Reception',
    gender: 'Female',
    guardianName: 'Janet Phiri',
    guardianPhone: '0955555555',
    enrollmentDate: '2024-02-01T00:00:00.000Z',
    status: 'active',
    admissionNumber: 'GHA-2024-003'
  },
  {
    id: 'student-4',
    name: 'Chanda Phiri',
    grade: 'Grade 2',
    gender: 'Male',
    guardianName: 'Janet Phiri',
    guardianPhone: '0955555555',
    enrollmentDate: '2024-01-15T00:00:00.000Z',
    status: 'active',
    admissionNumber: 'GHA-2024-004'
  }
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'payment-1',
    studentId: 'student-1',
    type: 'Tuition Fee',
    amount: 3000,
    dueDate: '2026-02-01T00:00:00.000Z',
    status: 'paid',
    paidDate: '2026-01-28T00:00:00.000Z',
    createdDate: '2026-01-15T00:00:00.000Z',
    term: 'Term 1 2026',
    receiptNumber: 'RCP-001',
    paymentMethod: 'Cash'
  },
  {
    id: 'payment-2',
    studentId: 'student-2',
    type: 'Tuition Fee',
    amount: 2700,
    dueDate: '2026-02-01T00:00:00.000Z',
    status: 'pending',
    createdDate: '2026-01-10T00:00:00.000Z',
    term: 'Term 1 2026'
  },
  {
    id: 'payment-3',
    studentId: 'student-1',
    type: 'Lunch',
    amount: 500,
    dueDate: '2026-02-15T00:00:00.000Z',
    status: 'paid',
    paidDate: '2026-02-01T00:00:00.000Z',
    createdDate: '2026-01-15T00:00:00.000Z',
    term: 'Term 1 2026',
    paymentMethod: 'Mobile Money'
  },
  {
    id: 'payment-4',
    studentId: 'student-3',
    type: 'Tuition Fee',
    amount: 2700,
    dueDate: '2026-02-01T00:00:00.000Z',
    status: 'overdue',
    createdDate: '2026-01-20T00:00:00.000Z',
    term: 'Term 1 2026'
  },
  {
    id: 'payment-5',
    studentId: 'student-4',
    type: 'Tuition Fee',
    amount: 2700,
    dueDate: '2026-02-01T00:00:00.000Z',
    status: 'pending',
    createdDate: '2026-01-15T00:00:00.000Z',
    term: 'Term 1 2026'
  }
];

const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'teacher-1',
    name: 'Mrs. Tembo',
    subject: 'English & Mathematics',
    phone: '0977001122',
    email: 'tembo@gha.edu.zm',
    qualification: 'B.Ed Primary Education',
    joinDate: '2020-01-05T00:00:00.000Z',
    role: 'Head Teacher',
    status: 'active'
  },
  {
    id: 'teacher-2',
    name: 'Mr. Mutale',
    subject: 'Science & Social Studies',
    phone: '0966334455',
    qualification: 'Diploma in Education',
    joinDate: '2021-09-01T00:00:00.000Z',
    role: 'Teacher',
    assignedClass: 'Grade 5',
    status: 'active'
  },
  {
    id: 'teacher-3',
    name: 'Mrs. Lungu',
    subject: 'Baby & Middle Class',
    phone: '0955667788',
    qualification: 'Early Childhood Education Certificate',
    joinDate: '2022-01-10T00:00:00.000Z',
    role: 'Teacher',
    assignedClass: 'Baby Class',
    status: 'active'
  }
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'expense-1',
    description: 'Electricity Bill - January',
    category: 'Utilities',
    amount: 850,
    date: '2026-01-31T00:00:00.000Z',
    paidBy: 'Admin',
    term: 'Term 1 2026',
    receiptNumber: 'EXP-001'
  },
  {
    id: 'expense-2',
    description: 'Cleaning Supplies',
    category: 'Supplies',
    amount: 320,
    date: '2026-02-05T00:00:00.000Z',
    paidBy: 'Admin',
    term: 'Term 1 2026'
  }
];

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Student Desks',
    category: 'Furniture',
    quantity: 45,
    unit: 'pieces',
    condition: 'Good',
    location: 'Classrooms',
    lastUpdated: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'inv-2',
    name: 'Whiteboard Markers',
    category: 'Stationery',
    quantity: 24,
    unit: 'boxes',
    condition: 'Good',
    location: 'Store Room',
    lastUpdated: '2026-02-01T00:00:00.000Z'
  },
  {
    id: 'inv-3',
    name: 'Laptop Computer',
    category: 'Electronics',
    quantity: 2,
    unit: 'units',
    condition: 'Good',
    location: 'Head Teacher Office',
    lastUpdated: '2025-09-01T00:00:00.000Z'
  }
];

const INITIAL_EVENTS: SchoolEvent[] = [
  {
    id: 'event-1',
    title: 'Term 1 Begins',
    description: 'Start of Term 1 2026. All students to report by 7:30 AM.',
    date: '2026-01-12T00:00:00.000Z',
    type: 'Academic',
    targetAudience: 'All'
  },
  {
    id: 'event-2',
    title: 'Sports Day',
    description: 'Annual inter-class sports competition. Parents welcome.',
    date: '2026-03-20T00:00:00.000Z',
    type: 'Sports',
    targetAudience: 'All'
  },
  {
    id: 'event-3',
    title: 'Parents Meeting',
    description: 'End of Term 1 parents meeting and report card collection.',
    date: '2026-04-03T00:00:00.000Z',
    type: 'Meeting',
    targetAudience: 'Parents'
  },
  {
    id: 'event-4',
    title: 'Aerobics Day',
    description: 'Annual school aerobics and fitness event.',
    date: '2026-02-28T00:00:00.000Z',
    type: 'Sports',
    targetAudience: 'All'
  }
];

const INITIAL_UNIFORMS: Uniform[] = [
  {
    id: 'uniform-1',
    studentId: 'student-1',
    item: 'Girl Dress',
    price: 250,
    purchaseDate: '2026-01-20T00:00:00.000Z',
    status: 'purchased'
  },
  {
    id: 'uniform-2',
    studentId: 'student-2',
    item: 'Short Sleeved Shirt',
    price: 180,
    purchaseDate: '2026-01-22T00:00:00.000Z',
    status: 'purchased'
  }
];

const INITIAL_REQUIREMENTS: Requirement[] = [
  {
    id: 'req-1',
    studentId: 'student-1',
    item: 'Ream of Paper & Tissues',
    status: 'provided',
    dateProvided: '2026-01-25T00:00:00.000Z',
    term: 'Term 1 2026'
  },
  {
    id: 'req-2',
    studentId: 'student-2',
    item: 'Ream of Paper + 2 Handy Andy + 2 Handwash',
    status: 'pending',
    term: 'Term 1 2026'
  }
];

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

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Term 1 2026 School Fees Due',
    message: 'This is a reminder that Term 1 2026 school fees are due by 1st February 2026. Please ensure all outstanding balances are cleared. Cash payments receive a K200-K300 discount. Contact the school office for payment arrangements.',
    date: '2026-01-15T00:00:00.000Z',
    priority: 'important',
    targetAudience: 'Parents',
    createdBy: 'Mrs. Tembo'
  },
  {
    id: 'ann-2',
    title: 'Sports Day - 20th March 2026',
    message: 'We are pleased to announce our Annual Sports Day on 20th March 2026. All students are encouraged to participate. Parents and guardians are welcome to attend. Students should come in their house colours. Please ensure children bring water and a packed lunch.',
    date: '2026-02-10T00:00:00.000Z',
    priority: 'normal',
    targetAudience: 'All',
    createdBy: 'Admin'
  }
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
  const [results, setResults] = useState<StudentResult[]>(() => loadFromStorage('gha_results', []));
  const [timetables, setTimetables] = useState<Timetable[]>(() => loadFromStorage('gha_timetables', []));
  const [branding, setBranding] = useState<SchoolBranding>(() => loadFromStorage('gha_branding', DEFAULT_BRANDING));
  const [theme, setTheme] = useState<AppTheme>(() => loadFromStorage('gha_theme', DEFAULT_THEME));
  const [students, setStudents] = useState<Student[]>(() => loadFromStorage('gha_students', INITIAL_STUDENTS));
  const [payments, setPayments] = useState<Payment[]>(() => loadFromStorage('gha_payments', INITIAL_PAYMENTS));
  const [uniforms, setUniforms] = useState<Uniform[]>(() => loadFromStorage('gha_uniforms', INITIAL_UNIFORMS));
  const [requirements, setRequirements] = useState<Requirement[]>(() => loadFromStorage('gha_requirements', INITIAL_REQUIREMENTS));
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadFromStorage('gha_teachers', INITIAL_TEACHERS));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadFromStorage('gha_expenses', INITIAL_EXPENSES));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadFromStorage('gha_inventory', INITIAL_INVENTORY));
  const [events, setEvents] = useState<SchoolEvent[]>(() => loadFromStorage('gha_events', INITIAL_EVENTS));
  const [feeStructure, setFeeStructure] = useState<FeeStructureItem[]>(() => loadFromStorage('gha_feestructure', INITIAL_FEE_STRUCTURE));
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>(() => loadFromStorage('gha_othercharges', INITIAL_OTHER_CHARGES));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadFromStorage('gha_announcements', INITIAL_ANNOUNCEMENTS));
  const [currentTerm, setCurrentTerm] = useState<string>(() => loadFromStorage('gha_currentTerm', 'Term 1 2026'));

  useEffect(() => { localStorage.setItem('gha_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('gha_fundraiser_participants', JSON.stringify(fundraiserParticipants)); }, [fundraiserParticipants]);
  useEffect(() => { localStorage.setItem('gha_results', JSON.stringify(results)); }, [results]);
  useEffect(() => { localStorage.setItem('gha_timetables', JSON.stringify(timetables)); }, [timetables]);
  useEffect(() => { localStorage.setItem('gha_branding', JSON.stringify(branding)); }, [branding]);
  useEffect(() => { localStorage.setItem('gha_theme', JSON.stringify(theme)); }, [theme]);
  useEffect(() => { localStorage.setItem('gha_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('gha_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('gha_uniforms', JSON.stringify(uniforms)); }, [uniforms]);
  useEffect(() => { localStorage.setItem('gha_requirements', JSON.stringify(requirements)); }, [requirements]);
  useEffect(() => { localStorage.setItem('gha_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('gha_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('gha_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('gha_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('gha_feestructure', JSON.stringify(feeStructure)); }, [feeStructure]);
  useEffect(() => { localStorage.setItem('gha_othercharges', JSON.stringify(otherCharges)); }, [otherCharges]);
  useEffect(() => { localStorage.setItem('gha_announcements', JSON.stringify(announcements)); }, [announcements]);
  useEffect(() => { localStorage.setItem('gha_currentTerm', JSON.stringify(currentTerm)); }, [currentTerm]);

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

  const addPayment = (payment: Payment) => setPayments(prev => [...prev, payment]);
  const updatePayment = (id: string, updated: Partial<Payment>) =>
    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  const deletePayment = (id: string) => setPayments(prev => prev.filter(p => p.id !== id));

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
      addFeeStructureItem, updateFeeStructureItem, deleteFeeStructureItem,
      addOtherCharge, updateOtherCharge, deleteOtherCharge,
      addAnnouncement, updateAnnouncement, deleteAnnouncement,
      attendance, saveAttendance, deleteAttendanceForDate,
      results, addResult, updateResult, deleteResult, saveClassResults,
      timetables, saveTimetable,
      branding, updateBranding,
      theme, updateTheme
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
