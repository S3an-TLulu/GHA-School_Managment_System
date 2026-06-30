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
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { AppProvider } from './context/AppContext';

function AppContent() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { isAuthenticated } = useAuth();

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
      case 'reports':      return <Reports />;
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
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
