import {
  LayoutDashboard,
  Users,
  CreditCard,
  ShoppingBag,
  ClipboardList,
  BarChart3,
  UserCheck,
  TrendingDown,
  Package,
  Calendar,
  FileText,
  DollarSign,
  Bell
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const menuGroups = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: 'People',
    items: [
      { id: 'students', label: 'Students', icon: Users },
      { id: 'teachers', label: 'Staff & Teachers', icon: UserCheck },
    ]
  },
  {
    label: 'Finances',
    items: [
      { id: 'payments', label: 'Fees & Payments', icon: CreditCard },
      { id: 'expenses', label: 'Expenses', icon: TrendingDown },
      { id: 'statements', label: 'Family Statements', icon: FileText },
    ]
  },
  {
    label: 'School',
    items: [
      { id: 'feestructure', label: 'Fee Structure', icon: DollarSign },
      { id: 'uniforms', label: 'Uniforms', icon: ShoppingBag },
      { id: 'requirements', label: 'Requirements', icon: ClipboardList },
      { id: 'inventory', label: 'Inventory', icon: Package },
      { id: 'events', label: 'Events & Calendar', icon: Calendar },
      { id: 'announcements', label: 'Announcements', icon: Bell },
    ]
  },
  {
    label: 'Reports',
    items: [
      { id: 'reports', label: 'Reports', icon: BarChart3 },
    ]
  }
];

export function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto flex flex-col">
      <nav className="p-4 flex-1 space-y-4">
        {menuGroups.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-800">Great Highway Academy</p>
          <p className="text-xs text-blue-600">School Management System</p>
        </div>
      </div>
    </div>
  );
}
