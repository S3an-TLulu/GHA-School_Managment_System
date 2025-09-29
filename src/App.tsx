import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Students } from './components/Students';
import { Classes } from './components/Classes';
import { Payments } from './components/Payments';
import { Uniforms } from './components/Uniforms';
import { Requirements } from './components/Requirements';
import { Reports } from './components/Reports';
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
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <Students />;
      case 'classes':
        return <Classes />;
      case 'payments':
        return <Payments />;
      case 'uniforms':
        return <Uniforms />;
      case 'requirements':
        return <Requirements />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 flex flex-col">
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