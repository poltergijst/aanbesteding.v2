import React from 'react';
import { Scale, FileText, Users, AlertTriangle, Home, Upload, Brain, CheckSquare, Gavel } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { profile, canAccess } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'aanbestedingen', label: 'Aanbestedingen', icon: FileText, requiredPermission: { resource: 'tenders', action: 'read' } },
    { id: 'inzendingen', label: 'Inzendingen', icon: Users, requiredPermission: { resource: 'submissions', action: 'read' } },
    { id: 'juridisch', label: 'Juridische Toetsing', icon: Scale, requiredPermission: { resource: 'analyses', action: 'read' } },
    { id: 'risicos', label: 'Risico\'s', icon: AlertTriangle },
    { id: 'corpus', label: 'Document Corpus', icon: Upload, requiredPermission: { resource: 'documents', action: 'create' } },
    { id: 'ai-analyzer', label: 'AI Analyzer', icon: Brain, requiredPermission: { resource: 'analyses', action: 'create' } },
    { id: 'checklists', label: 'Checklist Beheer', icon: CheckSquare, requiredPermission: { resource: 'checklists', action: 'read' } },
    { id: 'jurist-analyzer', label: 'Jurist AI', icon: Gavel, requiredPermission: { resource: 'analyses', action: 'create' } },
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return canAccess(item.requiredPermission.resource, item.requiredPermission.action);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Aanbestedingsmanagement Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Gemeente Portal</span>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            {profile && (
              <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">{profile.full_name}</p>
                <p className="text-xs text-blue-700 capitalize">{profile.role.replace('_', ' ')}</p>
                <p className="text-xs text-blue-600">{profile.organization?.name}</p>
              </div>
            )}
            <ul className="space-y-2">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onPageChange(item.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentPage === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}