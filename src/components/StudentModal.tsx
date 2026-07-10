import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Student, useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

interface StudentModalProps {
  student?: Student | null;
  onSave: (studentData: Student) => void;
  onClose: () => void;
}

const GRADES = ['Baby Class', 'Middle Class', 'Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

function generateAdmissionNumber(): string {
  return `GHA-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
}

function fieldClass(error?: string) {
  return `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
    error ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-300 focus:ring-blue-500'
  }`;
}

export function StudentModal({ student, onSave, onClose }: StudentModalProps) {
  const tc = useThemeClasses();
  const { transportRoutes } = useAppContext();
  const [admissionNumber] = useState<string>(() =>
    student?.admissionNumber || generateAdmissionNumber()
  );

  const [formData, setFormData] = useState({
    name: '',
    grade: 'Reception',
    gender: 'Female' as 'Male' | 'Female',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    address: '',
    dateOfBirth: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: 'active' as Student['status'],
    transportRouteId: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof formData, boolean>>>({});

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        grade: student.grade || 'Reception',
        gender: student.gender || 'Female',
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || '',
        guardianEmail: student.guardianEmail || '',
        address: student.address || '',
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
        enrollmentDate: student.enrollmentDate
          ? new Date(student.enrollmentDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        status: student.status || 'active',
        transportRouteId: student.transportRouteId || '',
      });
    }
  }, [student]);

  const validate = (data: typeof formData) => {
    const e: typeof errors = {};
    if (!data.name.trim()) e.name = 'Student name is required.';
    if (!data.guardianName.trim()) e.guardianName = 'Guardian name is required.';
    if (!data.guardianPhone.trim()) e.guardianPhone = 'Guardian phone is required.';
    else if (!/^[0-9+\s\-]{7,15}$/.test(data.guardianPhone.trim())) e.guardianPhone = 'Enter a valid phone number.';
    if (data.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guardianEmail)) e.guardianEmail = 'Enter a valid email address.';
    if (!data.enrollmentDate) e.enrollmentDate = 'Enrollment date is required.';
    return e;
  };

  const touch = (field: keyof typeof formData) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const handleChange = (field: keyof typeof formData, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    if (touched[field]) setErrors(validate(next));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const all = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(all as typeof touched);
    const errs = validate(formData);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSave({
      ...formData,
      id: student?.id || `student-${Date.now()}`,
      admissionNumber,
      enrollmentDate: new Date(formData.enrollmentDate).toISOString(),
      transportRouteId: formData.transportRouteId || undefined,
    });
  };

  const err = (field: keyof typeof formData) =>
    touched[field] && errors[field] ? (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {student ? 'Edit Student' : 'Enrol New Student'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
          {/* Admission Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Admission Number</label>
            <input readOnly value={admissionNumber}
              className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={formData.name} placeholder="e.g. Sarah Mwanza"
              onChange={e => handleChange('name', e.target.value)}
              onBlur={() => touch('name')}
              className={fieldClass(touched.name ? errors.name : undefined)} />
            {err('name')}
          </div>

          {/* Grade + Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade <span className="text-red-500">*</span></label>
              <select value={formData.grade} onChange={e => handleChange('grade', e.target.value)}
                className={fieldClass()}>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
              <select value={formData.gender} onChange={e => handleChange('gender', e.target.value as 'Male' | 'Female')}
                className={fieldClass()}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          {/* DOB + Enrollment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" value={formData.dateOfBirth}
                onChange={e => handleChange('dateOfBirth', e.target.value)}
                className={fieldClass()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date <span className="text-red-500">*</span></label>
              <input type="date" value={formData.enrollmentDate}
                onChange={e => handleChange('enrollmentDate', e.target.value)}
                onBlur={() => touch('enrollmentDate')}
                className={fieldClass(touched.enrollmentDate ? errors.enrollmentDate : undefined)} />
              {err('enrollmentDate')}
            </div>
          </div>

          {/* Guardian */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Guardian / Parent</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={formData.guardianName} placeholder="e.g. Mary Mwanza"
                  onChange={e => handleChange('guardianName', e.target.value)}
                  onBlur={() => touch('guardianName')}
                  className={fieldClass(touched.guardianName ? errors.guardianName : undefined)} />
                {err('guardianName')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="tel" value={formData.guardianPhone} placeholder="097XXXXXXX"
                    onChange={e => handleChange('guardianPhone', e.target.value)}
                    onBlur={() => touch('guardianPhone')}
                    className={fieldClass(touched.guardianPhone ? errors.guardianPhone : undefined)} />
                  {err('guardianPhone')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.guardianEmail} placeholder="parent@email.com"
                    onChange={e => handleChange('guardianEmail', e.target.value)}
                    onBlur={() => touch('guardianEmail')}
                    className={fieldClass(touched.guardianEmail ? errors.guardianEmail : undefined)} />
                  {err('guardianEmail')}
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
            <textarea value={formData.address} rows={2} placeholder="e.g. 123 Kabulonga Road, Lusaka"
              onChange={e => handleChange('address', e.target.value)}
              className={fieldClass()} />
          </div>

          {/* Transport */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Transport</label>
            <select value={formData.transportRouteId}
              onChange={e => handleChange('transportRouteId', e.target.value)}
              className={fieldClass()}>
              <option value="">Not using school transport</option>
              {transportRoutes.map(r => (
                <option key={r.id} value={r.id}>{r.name} — {r.destination} (K{r.monthlyFee}/month)</option>
              ))}
            </select>
            {transportRoutes.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">No routes defined yet — add them in the Transport section.</p>
            )}
          </div>

          {/* Status (edit only) */}
          {student && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status}
                onChange={e => handleChange('status', e.target.value)}
                className={fieldClass()}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit"
              className={`flex-1 ${tc.btn} text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors`}>
              {student ? 'Update Student' : 'Enrol Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
