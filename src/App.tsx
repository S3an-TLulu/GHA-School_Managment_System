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
import { Debtors } from './components/Debtors';
import { Transport } from './components/Transport';
import { Fundraisers } from './components/Fundraisers';
import { Settings } from './components/Settings';
import { ClassManager } from './components/ClassManager';
import { HR } from './components/HR';
import { Kitchen } from './components/Kitchen';
import { Profile } from './components/Profile';
import { Results } from './components/Results';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useAppContext } from './context/AppContext';
import { useEffect } from 'react';
import { Login } from './components/Login';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
      case 'classes':      return <ClassManager />;
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
      case 'results':      return <Results />;
      case 'bulkfees':     return <BulkFeeCollection />;
      case 'debtors':      return <Debtors />;
      case 'transport':    return <Transport />;
      case 'fundraisers':  return <Fundraisers />;
      case 'settings':     return <Settings />;
      case 'hr':           return <HR />;
      case 'kitchen':      return <Kitchen />;
      case 'profile':      return <Profile />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      </div>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 h-full shadow-xl">
            <Sidebar activeSection={activeSection} setActiveSection={setActiveSection}
              onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileNavOpen(true)}
          onGoToUsers={() => setActiveSection('settings')}
          onGoToProfile={() => setActiveSection('profile')} />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* Per-section boundary: a crash in one screen won't take out the
              whole shell, and navigating away (new key) clears it. */}
          <ErrorBoundary key={activeSection}>
            {renderContent()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
