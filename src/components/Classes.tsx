import { GraduationCap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

export function Classes() {
  const { feeStructure, otherCharges } = useAppContext();
  const tc = useThemeClasses();

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
              {feeStructure.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${tc.light} rounded-lg flex items-center justify-center`}>
                        <GraduationCap className={`h-5 w-5 ${tc.text}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.className}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Cash Payment</p>
                      <p className="text-xl font-bold text-green-600">K{item.cashFee.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-orange-800">Installments</p>
                      <p className="text-xl font-bold text-orange-600">K{item.installmentFee.toLocaleString()}</p>
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
              {otherCharges.map(charge => (
                <div key={charge.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{charge.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{charge.per}</span>
                  </div>
                  <span className={`text-lg font-bold ${tc.text}`}>K{charge.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
