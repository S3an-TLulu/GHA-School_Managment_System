import React from 'react';
import { GraduationCap } from 'lucide-react';

export function Classes() {
  const classData = [
    {
      name: 'Baby Class',
      cashFee: 3000,
      installmentFee: 3200,
      description: 'Early childhood development program'
    },
    {
      name: 'Middle Class',
      cashFee: 2700,
      installmentFee: 2900,
      description: 'Pre-primary preparation'
    },
    {
      name: 'Reception',
      cashFee: 2700,
      installmentFee: 2900,
      description: 'Foundation year for primary education'
    },
    {
      name: 'Grade 1',
      cashFee: 2700,
      installmentFee: 2900,
      description: 'Primary education level 1'
    },
    {
      name: 'Grade 2',
      cashFee: 2700,
      installmentFee: 2900,
      description: 'Primary education level 2'
    },
    {
      name: 'Grade 3',
      cashFee: 2700,
      installmentFee: 2900,
      description: 'Primary education level 3'
    },
    {
      name: 'Grade 4',
      cashFee: 2700,
      installmentFee: 2900,
      description: 'Primary education level 4'
    },
    {
      name: 'Grade 5',
      cashFee: 3000,
      installmentFee: 3200,
      description: 'Upper primary level 5'
    },
    {
      name: 'Grade 6',
      cashFee: 3000,
      installmentFee: 3200,
      description: 'Upper primary level 6'
    },
    {
      name: 'Grade 7',
      cashFee: 3000,
      installmentFee: 3200,
      description: 'Final primary year'
    }
  ];

  const otherCharges = [
    { name: 'Enrollment Form', fee: 100 },
    { name: 'Lunch (per month)', fee: 500 },
    { name: 'Transport (per month)', fee: '600-1000' },
    { name: 'Water (per term)', fee: 40 },
    { name: 'Assessment Tests', fee: 200 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Classes & Fee Structure</h1>
        <p className="text-gray-600">Complete fee structure for all classes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tuition Fees (Per Term)</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {classData.map((classItem, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                        <p className="text-sm text-gray-500">{classItem.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Cash Payment</p>
                      <p className="text-xl font-bold text-green-600">K{classItem.cashFee.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-orange-800">Installments</p>
                      <p className="text-xl font-bold text-orange-600">K{classItem.installmentFee.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Other Charges</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {otherCharges.map((charge, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{charge.name}</span>
                  <span className="text-lg font-bold text-blue-600">
                    K{typeof charge.fee === 'number' ? charge.fee.toLocaleString() : charge.fee}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}