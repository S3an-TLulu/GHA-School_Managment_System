import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Students } from './components/Students';
import { FeeStructure } from './components/FeeStructure';
import { Announcements } from './components/Announcements';
import { Payments } from './components/Payments';
import { Uniforms } from './components/Uniforms';
import { Requirements } from './components/Requirements';
import { Reports } from './components/Reports';
import { Teachers } from './components/Teachers';
import { Expenses } from './components/Expenses';
import { Inventory } from './components/Inventory';
import { Events } from './components/Events';
import { FamilyStatements } from './components/FamilyStatements';
import { OfficeCashier } from './components/OfficeCashier';
import { Attendance } from './components/Attendance';
import { SchoolCalendar } from './components/SchoolCalendar';
import { BrandingManager } from './components/BrandingManager';
import { ThemeManager, applyTheme } from './components/ThemeManager';
import { DocumentTemplates } from './components/DocumentTemplates';
import { ClassTimetable } from './components/ClassTimetable';
import { BulkFeeCollection } from './components/BulkFeeCollection';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useAppContext } from './context/AppContext';
import { useEffect } from 'react';
import { Login } from './components/Login';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/ToastProvider';

function AppContent() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { isAuthenticated } = useAuth();
  const { theme } = useAppContext();

  useEffect(() => { applyTheme(theme); }, [theme]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':    return <Dashboard />;
      case 'students':     return <Students />;
      case 'teachers':     return <Teachers />;
      case 'classes':      return <FeeStructure />;
      case 'feestructure': return <FeeStructure />;
      case 'announcements': return <Announcements />;
      case 'payments':     return <Payments />;
      case 'cashier':      return <OfficeCashier />;
      case 'expenses':     return <Expenses />;
      case 'statements':   return <FamilyStatements />;
      case 'uniforms':     return <Uniforms />;
      case 'requirements': return <Requirements />;
      case 'inventory':    return <Inventory />;
      case 'events':       return <Events />;
      case 'attendance':   return <Attendance />;
      case 'calendar':     return <SchoolCalendar />;
      case 'branding':     return <BrandingManager />;
      case 'theme':        return <ThemeManager />;
      case 'templates':    return <DocumentTemplates />;
      case 'reports':      return <Reports />;
      case 'timetable':    return <ClassTimetable />;
      case 'bulkfees':     return <BulkFeeCollection />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
