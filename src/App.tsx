import React, { useState } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AanbestedingenOverzicht from './components/AanbestedingenOverzicht';
import JuridischeToetsing from './components/JuridischeToetsing';
import InzendingenBeoordeling from './components/InzendingenBeoordeling';
import DocumentIngestion from './components/DocumentIngestion';
import AIDocumentAnalyzer from './components/AIDocumentAnalyzer';
import ChecklistBeheer from './components/ChecklistBeheer';
import JuristAnalyzer from './components/JuristAnalyzer';
import PrivacyNotice from './components/PrivacyNotice';
import { useAuth } from './contexts/AuthContext';
import type { Aanbesteding } from './types/aanbesteding';

function AppContent() {
  const { canAccess } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedAanbesteding, setSelectedAanbesteding] = useState<Aanbesteding | null>(null);

  const handleViewAanbestedingDetails = (aanbesteding: Aanbesteding) => {
    setSelectedAanbesteding(aanbesteding);
    setCurrentPage('juridisch');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'aanbestedingen':
        return (
          <ProtectedRoute resource="tenders" action="read">
            <AanbestedingenOverzicht onViewDetails={handleViewAanbestedingDetails} />
          </ProtectedRoute>
        );
      case 'inzendingen':
        return (
          <ProtectedRoute resource="submissions" action="read">
            <InzendingenBeoordeling />
          </ProtectedRoute>
        );
      case 'juridisch':
        return (
          <ProtectedRoute resource="analyses" action="read">
            <JuridischeToetsing />
          </ProtectedRoute>
        );
      case 'corpus':
        return (
          <ProtectedRoute resource="documents" action="create">
            <DocumentIngestion />
          </ProtectedRoute>
        );
      case 'ai-analyzer':
        return (
          <ProtectedRoute resource="analyses" action="create">
            <AIDocumentAnalyzer />
          </ProtectedRoute>
        );
      case 'checklists':
        return (
          <ProtectedRoute resource="checklists" action="read">
            <ChecklistBeheer />
          </ProtectedRoute>
        );
      case 'jurist-analyzer':
        return (
          <ProtectedRoute resource="analyses" action="create">
            <JuristAnalyzer />
          </ProtectedRoute>
        );
      case 'risicos':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Risico Management</h2>
            <p className="text-gray-600">Overzicht van alle geïdentificeerde risico's en mitigatiemaatregelen.</p>
            <div className="mt-8 text-center text-gray-500">
              Deze functionaliteit wordt binnenkort beschikbaar gesteld.
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <ProtectedRoute>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderCurrentPage()}
        <PrivacyNotice />
      </Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;