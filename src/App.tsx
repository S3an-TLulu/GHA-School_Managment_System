import { useState, useEffect, lazy, Suspense, ComponentType } from 'react';
// Eager: the app shell and the default landing view.
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { applyTheme } from './components/ThemeManager';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useAppContext, AppProvider } from './context/AppContext';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy: every other section is code-split into its own chunk and only fetched
// when the user first opens it, keeping the initial bundle small.
const named = <M extends Record<string, unknown>>(loader: () => Promise<M>, key: keyof M) =>
  lazy(() => loader().then(m => ({ default: m[key] as ComponentType })));

const Students = named(() => import('./components/Students'), 'Students');
const FeeStructure = named(() => import('./components/FeeStructure'), 'FeeStructure');
const Announcements = named(() => import('./components/Announcements'), 'Announcements');
const Payments = named(() => import('./components/Payments'), 'Payments');
const UniformManagement = named(() => import('./components/UniformManagement'), 'UniformManagement');
const Requirements = named(() => import('./components/Requirements'), 'Requirements');
const Reports = named(() => import('./components/Reports'), 'Reports');
const Teachers = named(() => import('./components/Teachers'), 'Teachers');
const Expenses = named(() => import('./components/Expenses'), 'Expenses');
const Inventory = named(() => import('./components/Inventory'), 'Inventory');
const Events = named(() => import('./components/Events'), 'Events');
const FamilyStatements = named(() => import('./components/FamilyStatements'), 'FamilyStatements');
const OfficeCashier = named(() => import('./components/OfficeCashier'), 'OfficeCashier');
const Attendance = named(() => import('./components/Attendance'), 'Attendance');
const SchoolCalendar = named(() => import('./components/SchoolCalendar'), 'SchoolCalendar');
const BrandingManager = named(() => import('./components/BrandingManager'), 'BrandingManager');
const ThemeManager = named(() => import('./components/ThemeManager'), 'ThemeManager');
const DocumentTemplates = named(() => import('./components/DocumentTemplates'), 'DocumentTemplates');
const ClassTimetable = named(() => import('./components/ClassTimetable'), 'ClassTimetable');
const BulkFeeCollection = named(() => import('./components/BulkFeeCollection'), 'BulkFeeCollection');
const Debtors = named(() => import('./components/Debtors'), 'Debtors');
const Transport = named(() => import('./components/Transport'), 'Transport');
const Fundraisers = named(() => import('./components/Fundraisers'), 'Fundraisers');
const Settings = named(() => import('./components/Settings'), 'Settings');
const ClassManager = named(() => import('./components/ClassManager'), 'ClassManager');
const HR = named(() => import('./components/HR'), 'HR');
const Kitchen = named(() => import('./components/Kitchen'), 'Kitchen');
const Gallery = named(() => import('./components/Gallery'), 'Gallery');
const Profile = named(() => import('./components/Profile'), 'Profile');
const Library = named(() => import('./components/Library'), 'Library');
const Messaging = named(() => import('./components/Messaging'), 'Messaging');
const HelpGuide = named(() => import('./components/HelpGuide'), 'HelpGuide');
const CashBook = named(() => import('./components/CashBook'), 'CashBook');
const Tools = named(() => import('./components/Tools'), 'Tools');
const Results = named(() => import('./components/Results'), 'Results');
const Subjects = named(() => import('./components/Subjects'), 'Subjects');
const ParentPortal = named(() => import('./components/ParentPortal'), 'ParentPortal');

// Fallback shown while a section's chunk loads.
const SectionLoading = () => (
  <div className="flex items-center justify-center py-24 text-gray-400">
    <div className="h-6 w-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
  </div>
);

function AppContent() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const { isAuthenticated } = useAuth();
  const { theme } = useAppContext();

  useEffect(() => { applyTheme(theme); }, [theme]);

  // Deep link from a uniform QR code (#uniform/<itemId>): once signed in, jump
  // to Uniform Management, which reads the stashed target and opens the item.
  useEffect(() => {
    const m = location.hash.match(/#uniform\/(.+)$/);
    if (m && isAuthenticated) {
      localStorage.setItem('gha_uniform_target', m[1]);
      setActiveSection('uniforms');
      history.replaceState(null, '', location.pathname + location.search);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    if (showPortal || location.hash === '#portal') {
      return (
        <Suspense fallback={<SectionLoading />}>
          <ParentPortal onBack={() => { setShowPortal(false); if (location.hash) history.replaceState(null, '', location.pathname); }} />
        </Suspense>
      );
    }
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} onPortal={() => { setShowLogin(false); setShowPortal(true); }} />;
    }
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
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
      case 'uniforms':     return <UniformManagement />;
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
      case 'subjects':     return <Subjects />;
      case 'bulkfees':     return <BulkFeeCollection />;
      case 'debtors':      return <Debtors />;
      case 'transport':    return <Transport />;
      case 'fundraisers':  return <Fundraisers />;
      case 'settings':     return <Settings />;
      case 'hr':           return <HR />;
      case 'kitchen':      return <Kitchen />;
      case 'gallery':      return <Gallery />;
      case 'library':      return <Library />;
      case 'messaging':    return <Messaging />;
      case 'profile':      return <Profile />;
      case 'help':         return <HelpGuide />;
      case 'cashbook':     return <CashBook />;
      case 'tools':        return <Tools />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="gha-shell min-h-screen bg-gray-50 flex">
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
          onGoToProfile={() => setActiveSection('profile')}
          onNavigate={setActiveSection} />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* Per-section boundary: a crash in one screen won't take out the
              whole shell, and navigating away (new key) clears it. */}
          <ErrorBoundary key={activeSection}>
            <Suspense fallback={<SectionLoading />}>
              {renderContent()}
            </Suspense>
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
