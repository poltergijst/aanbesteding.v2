import React from 'react';
import { FileText, Users, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    {
      name: 'Actieve Aanbestedingen',
      value: '12',
      change: '+2',
      changeType: 'increase',
      icon: FileText,
      color: 'blue'
    },
    {
      name: 'Inzendingen te Beoordelen',
      value: '34',
      change: '+8',
      changeType: 'increase',
      icon: Users,
      color: 'yellow'
    },
    {
      name: 'Juridische Toetsingen',
      value: '7',
      change: '-1',
      changeType: 'decrease',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      name: 'Afgeronde Procedures',
      value: '156',
      change: '+12',
      changeType: 'increase',
      icon: CheckCircle,
      color: 'green'
    }
  ];

  const recenteActiviteiten = [
    {
      id: 1,
      type: 'aanbesteding',
      titel: 'IT-infrastructuur gemeente',
      status: 'Inschrijvingen ontvangen - 45% voltooid',
      datum: '2 uur geleden',
      prioriteit: 'hoog'
    },
    {
      id: 2,
      type: 'inzending',
      titel: 'Groenbeheer openbare ruimte',
      status: 'In beoordeling - 70% voltooid',
      datum: '4 uur geleden',
      prioriteit: 'middel'
    },
    {
      id: 3,
      type: 'juridisch',
      titel: 'Wegenbouw project Noord',
      status: 'Juridisch getoetst - 85% voltooid',
      datum: '1 dag geleden',
      prioriteit: 'laag'
    }
  ];

  const getStatusIcon = (status: string) => {
    if (status.includes('vereist') || status.includes('Juridische')) return AlertTriangle;
    if (status.includes('ontvangen')) return Clock;
    if (status.includes('voltooid')) return CheckCircle;
    return FileText;
  };

  const getPriorityColor = (prioriteit: string) => {
    switch (prioriteit) {
      case 'hoog': return 'text-red-600 bg-red-100';
      case 'middel': return 'text-yellow-600 bg-yellow-100';
      case 'laag': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Overzicht van alle aanbestedingsactiviteiten</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-md bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className={`ml-2 text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recente Activiteiten</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recenteActiviteiten.map((activiteit) => {
            const StatusIcon = getStatusIcon(activiteit.status);
            return (
              <div key={activiteit.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <StatusIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activiteit.titel}</p>
                      <p className="text-sm text-gray-500">{activiteit.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(activiteit.prioriteit)}`}>
                      {activiteit.prioriteit}
                    </span>
                    <span className="text-sm text-gray-500">{activiteit.datum}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Snelle Acties</h4>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              Nieuwe aanbesteding aanmaken
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              Juridische toetsing starten
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              Rapport genereren
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Deadlines</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">IT-infrastructuur</span>
              <span className="text-sm font-medium text-red-600">2 dagen</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Groenbeheer</span>
              <span className="text-sm font-medium text-yellow-600">5 dagen</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Wegenbouw</span>
              <span className="text-sm font-medium text-green-600">12 dagen</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Compliance Status</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">85% procedures compliant</span>
            </div>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm text-gray-600">3 procedures vereisen aandacht</span>
            </div>
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-gray-600">1 non-compliant procedure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}