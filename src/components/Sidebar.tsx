import {
  LayoutDashboard, Users, CreditCard, ShoppingBag, ClipboardList,
  BarChart3, UserCheck, TrendingDown, Package, Calendar, FileText,
  DollarSign, Bell, MonitorCheck, ClipboardCheck, CalendarDays,
  Palette, Building2, LayoutTemplate, Clock, Layers
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

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
      { id: 'cashier',   label: 'Office Cashier',     icon: MonitorCheck },
      { id: 'payments',  label: 'Fees & Payments',    icon: CreditCard },
      { id: 'bulkfees',  label: 'Bulk Fee Collection', icon: Layers },
      { id: 'expenses',  label: 'Expenses',            icon: TrendingDown },
      { id: 'statements',label: 'Family Statements',  icon: FileText },
    ]
  },
  {
    label: 'School',
    items: [
      { id: 'attendance',   label: 'Attendance',      icon: ClipboardCheck },
      { id: 'timetable',    label: 'Class Timetable', icon: Clock },
      { id: 'calendar',     label: 'School Calendar', icon: CalendarDays },
      { id: 'feestructure', label: 'Fee Structure',   icon: DollarSign },
      { id: 'uniforms',     label: 'Uniforms',        icon: ShoppingBag },
      { id: 'requirements', label: 'Requirements',    icon: ClipboardList },
      { id: 'inventory',    label: 'Inventory',       icon: Package },
      { id: 'events',       label: 'Events',          icon: Calendar },
      { id: 'announcements',label: 'Announcements',   icon: Bell },
    ]
  },
  {
    label: 'Reports',
    items: [
      { id: 'reports',   label: 'Reports Centre',     icon: BarChart3 },
      { id: 'templates', label: 'Document Templates', icon: LayoutTemplate },
    ]
  },
  {
    label: 'Personalise',
    items: [
      { id: 'branding', label: 'Branding Manager', icon: Building2 },
      { id: 'theme',    label: 'Theme Manager',    icon: Palette },
    ]
  }
];

export function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const { branding } = useAppContext();
  const tc = useThemeClasses();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto flex flex-col flex-shrink-0">
      <nav className="p-4 flex-1 space-y-4">
        {menuGroups.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left text-sm font-medium ${
                      isActive
                        ? `${tc.activeNav} border`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div
          className="rounded-xl p-3 text-white"
          style={{ background: 'linear-gradient(135deg, var(--gha-primary, #1d4ed8), var(--gha-accent, #3b82f6))' }}
        >
          <p className="text-xs font-bold leading-tight">{branding.schoolName}</p>
          <p className="text-xs opacity-80 mt-0.5">{branding.motto || 'School Management System'}</p>
        </div>
      </div>
    </div>
  );
}
