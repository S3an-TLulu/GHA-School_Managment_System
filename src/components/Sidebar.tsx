import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, CreditCard, ShoppingBag, ClipboardList,
  BarChart3, UserCheck, TrendingDown, Package, Calendar, FileText,
  DollarSign, Bell, MonitorCheck, ClipboardCheck, CalendarDays,
  Palette, Building2, LayoutTemplate, Clock, Layers, GraduationCap,
  ChevronDown, ChevronsLeft, ChevronsRight, Heart, Bus, UserX, Settings as SettingsIcon, Briefcase, ChefHat, UserCircle, Camera, BookOpen, MessageSquare, HelpCircle, Wallet, Wrench
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onNavigate?: () => void;
}

const menuGroups = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'profile', label: 'My Profile', icon: UserCircle },
      { id: 'help', label: 'Help & Guide', icon: HelpCircle },
    ]
  },
  {
    label: 'People & Classes',
    items: [
      { id: 'students', label: 'Students', icon: Users },
      { id: 'classes',  label: 'Class Manager', icon: GraduationCap },
      { id: 'teachers', label: 'Staff & Teachers', icon: UserCheck },
    ]
  },
  {
    label: 'Money',
    items: [
      { id: 'cashier',     label: 'Office Cashier',      icon: MonitorCheck },
      { id: 'cashbook',    label: 'Daily Cashbook',      icon: Wallet },
      { id: 'payments',    label: 'Fees & Payments',     icon: CreditCard },
      { id: 'bulkfees',    label: 'Bulk Fee Collection', icon: Layers },
      { id: 'feestructure',label: 'Fee Structure',       icon: DollarSign },
      { id: 'debtors',     label: 'Debtors',             icon: UserX },
      { id: 'expenses',    label: 'Expenses',            icon: TrendingDown },
      { id: 'statements',  label: 'Family Statements',   icon: FileText },
      { id: 'fundraisers', label: 'Fundraisers',         icon: Heart },
      { id: 'hr',          label: 'HR & Payroll',        icon: Briefcase },
    ]
  },
  {
    label: 'Academics',
    items: [
      { id: 'attendance', label: 'Attendance',       icon: ClipboardCheck },
      { id: 'results',    label: 'Academic Results', icon: GraduationCap },
      { id: 'subjects',   label: 'Subjects',         icon: BookOpen },
      { id: 'timetable',  label: 'Class Timetable',  icon: Clock },
    ]
  },
  {
    label: 'Planning',
    items: [
      { id: 'calendar',      label: 'Calendar & To-Dos', icon: CalendarDays },
      { id: 'events',        label: 'Events',            icon: Calendar },
      { id: 'announcements', label: 'Announcements',     icon: Bell },
      { id: 'messaging',     label: 'Messaging',         icon: MessageSquare },
      { id: 'gallery',       label: 'Photo Gallery',     icon: Camera },
      { id: 'transport',     label: 'Transport',         icon: Bus },
      { id: 'tools',         label: 'Tools',             icon: Wrench },
    ]
  },
  {
    label: 'Store & Supplies',
    items: [
      { id: 'kitchen',      label: 'Kitchen',      icon: ChefHat },
      { id: 'library',      label: 'Library',      icon: BookOpen },
      { id: 'uniforms',     label: 'Uniform Management', icon: ShoppingBag },
      { id: 'requirements', label: 'Requirements', icon: ClipboardList },
      { id: 'inventory',    label: 'Inventory',    icon: Package },
    ]
  },
  {
    label: 'Reports & Documents',
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
  },
  {
    label: 'Maintenance',
    items: [
      { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ]
  }
];

function loadCollapsedGroups(): string[] {
  try { return JSON.parse(localStorage.getItem('gha_sidebar_groups') || '[]'); } catch { return []; }
}

export function Sidebar({ activeSection, setActiveSection, onNavigate }: SidebarProps) {
  const { branding } = useAppContext();
  const { canAccess } = useAuth();
  const tc = useThemeClasses();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('gha_sidebar_collapsed') === '1');
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(loadCollapsedGroups);

  useEffect(() => { localStorage.setItem('gha_sidebar_collapsed', collapsed ? '1' : '0'); }, [collapsed]);
  useEffect(() => { localStorage.setItem('gha_sidebar_groups', JSON.stringify(collapsedGroups)); }, [collapsedGroups]);

  const toggleGroup = (label: string) =>
    setCollapsedGroups(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  const visibleGroups = menuGroups
    .map(g => ({ ...g, items: g.items.filter(i => canAccess(i.id)) }))
    .filter(g => g.items.length > 0);

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 h-full overflow-y-auto flex flex-col flex-shrink-0 transition-all duration-200`}>
      <div className={`flex ${collapsed ? 'justify-center' : 'justify-end'} px-2 pt-3`}>
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className={`${collapsed ? 'p-2' : 'p-4'} flex-1 ${collapsed ? 'space-y-1' : 'space-y-3'}`}>
        {visibleGroups.map(group => {
          const isGroupCollapsed = collapsedGroups.includes(group.label);
          return (
            <div key={group.label}>
              {!collapsed && (
                <button onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1 hover:text-gray-600">
                  <span>{group.label}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${isGroupCollapsed ? '-rotate-90' : ''}`} />
                </button>
              )}
              {(collapsed || !isGroupCollapsed) && (
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveSection(item.id); onNavigate?.(); }}
                        title={collapsed ? item.label : undefined}
                        className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-2.5' : 'space-x-3 px-3 py-2.5'} rounded-lg transition-colors text-left text-sm font-medium ${
                          isActive
                            ? `${tc.activeNav} border`
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div
            className="rounded-xl p-3 text-white"
            style={{ background: 'linear-gradient(135deg, var(--gha-primary, #1d4ed8), var(--gha-accent, #3b82f6))' }}
          >
            <p className="text-xs font-bold leading-tight">{branding.schoolName}</p>
            <p className="text-xs opacity-80 mt-0.5">{branding.motto || 'School Management System'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
