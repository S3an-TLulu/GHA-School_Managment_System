import React, { useState } from 'react';
import { ClipboardList, Check, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function Requirements() {
  const { requirements, students, addRequirement, updateRequirement } = useAppContext();
  const [selectedStudent, setSelectedStudent] = useState('');
  
  const requiredItems = [
    'Ream of Paper & Tissues',
    'Ream of Paper + 2 Handy Andy + 2 Handwash',
    'Ream of Paper + 2 Domestos + 2 Handwash',
    'Ream of Paper + 1 Cobra (1 liter) + 2 Handwash'
  ];

  const getStudentRequirements = (studentId: string) => {
    return requirements.filter(r => r.studentId === studentId);
  };

  const handleToggleRequirement = (studentId: string, item: string) => {
    const existing = requirements.find(r => r.studentId === studentId && r.item === item);
    
    if (existing) {
      updateRequirement(existing.id, {
        ...existing,
        status: existing.status === 'provided' ? 'pending' : 'provided',
        dateProvided: existing.status === 'pending' ? new Date().toISOString() : null
      });
    } else {
      addRequirement({
        id: `req-${Date.now()}`,
        studentId,
        item,
        status: 'provided',
        dateProvided: new Date().toISOString(),
        term: 'Current Term'
      });
    }
  };

  const getRequirementStatus = (studentId: string, item: string) => {
    const req = requirements.find(r => r.studentId === studentId && r.item === item);
    return req?.status || 'pending';
  };

  const getCompletionRate = (studentId: string) => {
    const studentReqs = getStudentRequirements(studentId);
    const providedCount = studentReqs.filter(r => r.status === 'provided').length;
    return Math.round((providedCount / requiredItems.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">School Requirements</h1>
        <p className="text-gray-600">Track which parents have provided required school supplies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Required Items (Per Term)</h2>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-6">
              {selectedStudent ? (
                <div className="space-y-4">
                  {requiredItems.map((item, index) => {
                    const status = getRequirementStatus(selectedStudent, item);
                    const isProvided = status === 'provided';
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item}</h3>
                            <p className="text-sm text-gray-500 mt-1">Required for current term</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                              isProvided 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isProvided ? 'Provided' : 'Pending'}
                            </span>
                            <button
                              onClick={() => handleToggleRequirement(selectedStudent, item)}
                              className={`p-2 rounded-lg transition-colors ${
                                isProvided
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            >
                              {isProvided ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a student to manage their requirements</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Students Progress</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {students.map(student => {
                  const completionRate = getCompletionRate(student.id);
                  const studentReqs = getStudentRequirements(student.id);
                  const providedCount = studentReqs.filter(r => r.status === 'provided').length;
                  
                  return (
                    <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{student.name}</h3>
                          <p className="text-sm text-gray-500">{student.grade}</p>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          {providedCount}/{requiredItems.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{completionRate}% Complete</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}