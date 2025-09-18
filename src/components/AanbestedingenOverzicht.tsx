import React, { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Aanbesteding } from '../types/aanbesteding';

interface AanbestedingenOverzichtProps {
  onViewDetails: (aanbesteding: Aanbesteding) => void;
}

export default function AanbestedingenOverzicht({ onViewDetails }: AanbestedingenOverzichtProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');

  // Mock data
  const aanbestedingen: Aanbesteding[] = [
    {
      id: '1',
      titel: 'IT-infrastructuur modernisering',
      beschrijving: 'Vernieuwing van de complete IT-infrastructuur voor de gemeente',
      type: 'openbaar',
      status: 'actief',
      progressPercentage: 45,
      currentStep: 'Inschrijvingen ontvangen',
      nextStep: 'Sluitingsdatum afwachten',
      drempelwaarde: 221000,
      geschatteWaarde: 450000,
      publicatieDatum: new Date('2024-01-15'),
      sluitingsDatum: new Date('2024-02-15'),
      gunningsCriteria: [],
      documenten: [],
      inzendingen: [],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      titel: 'Groenbeheer openbare ruimte',
      beschrijving: 'Onderhoud van parken en groenstroken in de gemeente',
      type: 'openbaar',
      status: 'in-beoordeling',
      progressPercentage: 70,
      currentStep: 'Inzendingen beoordelen',
      nextStep: 'Juridische toetsing',
      drempelwaarde: 140000,
      geschatteWaarde: 180000,
      publicatieDatum: new Date('2024-01-01'),
      sluitingsDatum: new Date('2024-01-31'),
      gunningsCriteria: [],
      documenten: [],
      inzendingen: [],
      createdAt: new Date('2023-12-20'),
      updatedAt: new Date('2024-01-31')
    },
    {
      id: '3',
      titel: 'Wegenbouw project Noord',
      beschrijving: 'Aanleg en renovatie van wegen in het noordelijke stadsdeel',
      type: 'niet-openbaar',
      status: 'juridisch-getoetst',
      progressPercentage: 85,
      currentStep: 'Juridische toetsing voltooid',
      nextStep: 'Gunningsbesluit',
      drempelwaarde: 5548000,
      geschatteWaarde: 2800000,
      publicatieDatum: new Date('2023-12-01'),
      sluitingsDatum: new Date('2024-01-15'),
      gunningsCriteria: [],
      documenten: [],
      inzendingen: [],
      juridischeToetsing: {
        id: '1',
        juristNaam: 'Mr. J. de Vries',
        toetsingsDatum: new Date('2024-01-20'),
        compliance: 'niet-compliant',
        bevindingen: [],
        risicos: [],
        actiepunten: [],
        doorverwijzingNodig: true,
        doorverwijzingReden: 'Complexe EU-richtlijn interpretatie vereist',
        opmerkingen: 'Drempelwaarde overschrijding vereist aanvullende procedure'
      },
      createdAt: new Date('2023-11-15'),
      updatedAt: new Date('2024-01-20')
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'voorbereiding': return 'bg-gray-100 text-gray-800';
      case 'concept': return 'bg-gray-100 text-gray-800';
      case 'gepubliceerd': return 'bg-blue-100 text-blue-800';
      case 'actief': return 'bg-green-100 text-green-800';
      case 'gesloten': return 'bg-yellow-100 text-yellow-800';
      case 'in-beoordeling': return 'bg-orange-100 text-orange-800';
      case 'beoordeeld': return 'bg-purple-100 text-purple-800';
      case 'juridisch-getoetst': return 'bg-indigo-100 text-indigo-800';
      case 'gegund': return 'bg-green-100 text-green-800';
      case 'afgerond': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceIcon = (aanbesteding: Aanbesteding) => {
    if (!aanbesteding.juridischeToetsing) return null;
    
    switch (aanbesteding.juridischeToetsing.compliance) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'niet-compliant':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'onduidelijk':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const filteredAanbestedingen = aanbestedingen.filter(aanbesteding => {
    const matchesSearch = aanbesteding.titel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aanbesteding.beschrijving.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'alle' || aanbesteding.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Aanbestedingen</h2>
          <p className="text-gray-600">Beheer en monitor alle aanbestedingsprocedures</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Aanbesteding
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Zoek aanbestedingen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-gray-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="alle">Alle statussen</option>
                <option value="voorbereiding">Voorbereiding</option>
                <option value="concept">Concept</option>
                <option value="gepubliceerd">Gepubliceerd</option>
                <option value="actief">Actief</option>
                <option value="gesloten">Gesloten</option>
                <option value="in-beoordeling">In Beoordeling</option>
                <option value="beoordeeld">Beoordeeld</option>
                <option value="juridisch-getoetst">Juridisch Getoetst</option>
                <option value="gegund">Gegund</option>
                <option value="afgerond">Afgerond</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Aanbestedingen Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aanbesteding
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Voortgang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waarde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sluitingsdatum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAanbestedingen.map((aanbesteding) => (
                <tr key={aanbesteding.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{aanbesteding.titel}</div>
                      <div className="text-sm text-gray-500">{aanbesteding.beschrijving.substring(0, 60)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">
                      {aanbesteding.type.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(aanbesteding.status)}`}>
                          {aanbesteding.status.charAt(0).toUpperCase() + aanbesteding.status.slice(1).replace('-', ' ')}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {aanbesteding.progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            aanbesteding.progressPercentage >= 80 ? 'bg-green-500' :
                            aanbesteding.progressPercentage >= 60 ? 'bg-blue-500' :
                            aanbesteding.progressPercentage >= 40 ? 'bg-yellow-500' :
                            'bg-orange-500'
                          }`}
                          style={{ width: `${aanbesteding.progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div className="font-medium">{aanbesteding.currentStep}</div>
                        {aanbesteding.nextStep && (
                          <div className="text-gray-500">Volgende: {aanbesteding.nextStep}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    €{aanbesteding.geschatteWaarde.toLocaleString('nl-NL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {aanbesteding.sluitingsDatum.toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getComplianceIcon(aanbesteding)}
                      {aanbesteding.juridischeToetsing && (
                        <span className="ml-2 text-sm text-gray-600">
                          {aanbesteding.juridischeToetsing.compliance}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onViewDetails(aanbesteding)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}