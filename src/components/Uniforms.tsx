import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';

export function Uniforms() {
  const { uniforms, students, addUniformPurchase } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [selectedStudent, setSelectedStudent] = useState('');
  
  const uniformItems = [
    { name: 'Girl Dress', price: 250, category: 'Girls' },
    { name: 'Girl Skirt', price: 200, category: 'Girls' },
    { name: 'Long Sleeved Shirt', price: 180, category: 'Both' },
    { name: 'Short Sleeved Shirt', price: 180, category: 'Both' },
    { name: 'Shorts', price: 150, category: 'Both' },
    { name: 'Trousers', price: 200, category: 'Both' },
    { name: 'Tracksuit (Premium)', price: 600, category: 'Both' },
    { name: 'Tracksuit (Standard)', price: 400, category: 'Both' },
    { name: 'Boys & Girls Jersey', price: 350, category: 'Both' },
    { name: 'Physical Education Shirts', price: 150, category: 'Both' },
    { name: 'Physical Education Shorts', price: 200, category: 'Both' },
    { name: 'Physical Education Skirts', price: 200, category: 'Girls' },
    { name: '2 Pairs of Socks', price: 100, category: 'Both' }
  ];

  const handlePurchase = (item: { name: string; price: number; category: string }) => {
    if (!selectedStudent) {
      toast('Please select a student first.', 'warning');
      return;
    }
    addUniformPurchase({
      id: `uniform-${Date.now()}`,
      studentId: selectedStudent,
      item: item.name,
      price: item.price,
      purchaseDate: new Date().toISOString(),
      status: 'purchased'
    });
    toast(`${item.name} purchased successfully.`, 'success');
  };

  const getStudentUniforms = (studentId: string) => {
    return uniforms.filter(u => u.studentId === studentId);
  };

  const getTotalSpent = (studentId: string) => {
    return getStudentUniforms(studentId).reduce((sum, u) => sum + u.price, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Uniform Store</h1>
        <p className="text-gray-600">Manage uniform inventory and student purchases</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Uniform Items</h2>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Student to Purchase</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniformItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">K{item.price}</p>
                        <button
                          onClick={() => handlePurchase(item)}
                          disabled={!selectedStudent}
                          className={`mt-1 px-3 py-1 ${tc.btn} text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                        >
                          Purchase
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Student Purchases</h2>
            </div>
            <div className="p-6">
              {selectedStudent ? (
                <div className="space-y-4">
                  {students
                    .filter(s => s.id === selectedStudent)
                    .map(student => {
                      const studentUniforms = getStudentUniforms(student.id);
                      const totalSpent = getTotalSpent(student.id);
                      
                      return (
                        <div key={student.id} className="space-y-3">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-medium text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-600">{student.grade}</p>
                            <p className="text-lg font-bold text-blue-600 mt-2">
                              Total Spent: K{totalSpent.toLocaleString()}
                            </p>
                          </div>
                          
                          {studentUniforms.length > 0 ? (
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-700">Purchased Items:</h4>
                              {studentUniforms.map(uniform => (
                                <div key={uniform.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="text-sm text-gray-700">{uniform.item}</span>
                                  <span className="text-sm font-medium text-gray-900">K{uniform.price}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              No uniforms purchased yet
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Select a student to view their uniform purchases
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}