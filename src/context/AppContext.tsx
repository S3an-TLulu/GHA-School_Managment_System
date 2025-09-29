import React, { createContext, useContext, useState } from 'react';

interface Student {
  id: string;
  name: string;
  grade: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  address?: string;
  enrollmentDate: string;
}

interface Payment {
  id: string;
  studentId: string;
  type: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  createdDate: string;
}

interface Uniform {
  id: string;
  studentId: string;
  item: string;
  price: number;
  purchaseDate: string;
  status: string;
}

interface Requirement {
  id: string;
  studentId: string;
  item: string;
  status: 'provided' | 'pending';
  dateProvided?: string;
  term: string;
}

interface AppContextType {
  students: Student[];
  payments: Payment[];
  uniforms: Uniform[];
  requirements: Requirement[];
  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  addUniformPurchase: (uniform: Uniform) => void;
  addRequirement: (requirement: Requirement) => void;
  updateRequirement: (id: string, requirement: Partial<Requirement>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([
    {
      id: 'student-1',
      name: 'Sarah Mwanza',
      grade: 'Grade 5',
      guardianName: 'Mary Mwanza',
      guardianPhone: '0977123456',
      guardianEmail: 'mary.mwanza@email.com',
      address: '123 Kabulonga Road, Lusaka',
      enrollmentDate: '2024-01-15T00:00:00.000Z'
    },
    {
      id: 'student-2',
      name: 'John Banda',
      grade: 'Grade 3',
      guardianName: 'Peter Banda',
      guardianPhone: '0966987654',
      guardianEmail: 'peter.banda@email.com',
      address: '456 Roma Road, Lusaka',
      enrollmentDate: '2024-01-10T00:00:00.000Z'
    },
    {
      id: 'student-3',
      name: 'Grace Phiri',
      grade: 'Reception',
      guardianName: 'Janet Phiri',
      guardianPhone: '0955555555',
      enrollmentDate: '2024-02-01T00:00:00.000Z'
    }
  ]);

  const [payments, setPayments] = useState<Payment[]>([
    {
      id: 'payment-1',
      studentId: 'student-1',
      type: 'Tuition Fee',
      amount: 3000,
      dueDate: '2024-02-01T00:00:00.000Z',
      status: 'paid',
      paidDate: '2024-01-28T00:00:00.000Z',
      createdDate: '2024-01-15T00:00:00.000Z'
    },
    {
      id: 'payment-2',
      studentId: 'student-2',
      type: 'Tuition Fee',
      amount: 2700,
      dueDate: '2024-02-01T00:00:00.000Z',
      status: 'pending',
      createdDate: '2024-01-10T00:00:00.000Z'
    },
    {
      id: 'payment-3',
      studentId: 'student-1',
      type: 'Lunch',
      amount: 500,
      dueDate: '2024-02-15T00:00:00.000Z',
      status: 'pending',
      createdDate: '2024-01-15T00:00:00.000Z'
    }
  ]);

  const [uniforms, setUniforms] = useState<Uniform[]>([
    {
      id: 'uniform-1',
      studentId: 'student-1',
      item: 'Girl Dress',
      price: 250,
      purchaseDate: '2024-01-20T00:00:00.000Z',
      status: 'purchased'
    },
    {
      id: 'uniform-2',
      studentId: 'student-2',
      item: 'Short Sleeved Shirt',
      price: 180,
      purchaseDate: '2024-01-22T00:00:00.000Z',
      status: 'purchased'
    }
  ]);

  const [requirements, setRequirements] = useState<Requirement[]>([
    {
      id: 'req-1',
      studentId: 'student-1',
      item: 'Ream of Paper & Tissues',
      status: 'provided',
      dateProvided: '2024-01-25T00:00:00.000Z',
      term: 'Term 1'
    },
    {
      id: 'req-2',
      studentId: 'student-2',
      item: 'Ream of Paper + 2 Handy Andy + 2 Handwash',
      status: 'pending',
      term: 'Term 1'
    }
  ]);

  const addStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
  };

  const updateStudent = (id: string, updatedStudent: Partial<Student>) => {
    setStudents(prev => prev.map(student => 
      student.id === id ? { ...student, ...updatedStudent } : student
    ));
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(student => student.id !== id));
    setPayments(prev => prev.filter(payment => payment.studentId !== id));
    setUniforms(prev => prev.filter(uniform => uniform.studentId !== id));
    setRequirements(prev => prev.filter(req => req.studentId !== id));
  };

  const addPayment = (payment: Payment) => {
    setPayments(prev => [...prev, payment]);
  };

  const updatePayment = (id: string, updatedPayment: Partial<Payment>) => {
    setPayments(prev => prev.map(payment => 
      payment.id === id ? { ...payment, ...updatedPayment } : payment
    ));
  };

  const addUniformPurchase = (uniform: Uniform) => {
    setUniforms(prev => [...prev, uniform]);
  };

  const addRequirement = (requirement: Requirement) => {
    setRequirements(prev => [...prev, requirement]);
  };

  const updateRequirement = (id: string, updatedRequirement: Partial<Requirement>) => {
    setRequirements(prev => prev.map(req => 
      req.id === id ? { ...req, ...updatedRequirement } : req
    ));
  };

  return (
    <AppContext.Provider value={{
      students,
      payments,
      uniforms,
      requirements,
      addStudent,
      updateStudent,
      deleteStudent,
      addPayment,
      updatePayment,
      addUniformPurchase,
      addRequirement,
      updateRequirement
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