import React, { useState } from 'react';
import { Users, FileText, Download, CheckCircle, XCircle, Clock, Star, AlertTriangle } from 'lucide-react';
import StatusBadge from './common/StatusBadge';
import LoadingSpinner from './common/LoadingSpinner';
import { formatFileSize, formatDate, formatCurrency } from '../utils/formatters';
import { sanitizeHtml, validateEmail, validateKvKNumber, validatePhoneNumber } from '../lib/security';
import type { Inzending, InzendingsBeoordeling } from '../types/aanbesteding';

export default function InzendingenBeoordeling() {
  const [loading, setLoading] = useState(false);
  const [selectedAanbesteding, setSelectedAanbesteding] = useState('');
  const [selectedInzending, setSelectedInzending] = useState<string | null>(null);

  // Mock data
  const inzendingen: Inzending[] = [
    {
      id: '1',
      aanbestedingId: '1',
      indienerNaam: 'TechSolutions B.V.',
      indienerKvK: '12345678',
      indienerEmail: 'info@techsolutions.nl',
      indienerTelefoon: '020-1234567',
      inzendingsDatum: new Date('2024-02-10'),
      documenten: [
        {
          id: '1',
          naam: 'Technische specificaties.pdf',
          type: 'offerte',
          url: '#',
          uploadDatum: new Date('2024-02-10'),
          grootte: 2048000
        },
        {
          id: '2',
          naam: 'Financiële offerte.xlsx',
          type: 'offerte',
          url: '#',
          uploadDatum: new Date('2024-02-10'),
          grootte: 512000
        }
      ],
      status: 'in-behandeling',
      beoordeling: {
        id: '1',
        beoordelaar: 'J. van der Berg',
        beoordelingsDatum: new Date('2024-02-12'),
        scores: {
          'prijs': 85,
          'kwaliteit': 78,
          'technisch': 92,
          'duurzaamheid': 65
        },
        totaalScore: 80,
        opmerkingen: 'Sterke technische oplossing, prijs-kwaliteit verhouding is goed.',
        juridischeCheck: true,
        manualBiasCheckDeclared: true,
        aanbeveling: 'gunnen'
      }
    },
    {
      id: '2',
      aanbestedingId: '1',
      indienerNaam: 'InnovatieGroep N.V.',
      indienerKvK: '87654321',
      indienerEmail: 'contact@innovatiegroep.nl',
      indienerTelefoon: '030-7654321',
      inzendingsDatum: new Date('2024-02-12'),
      documenten: [
        {
          id: '3',
          naam: 'Projectvoorstel.pdf',
          type: 'offerte',
          url: '#',
          uploadDatum: new Date('2024-02-12'),
          grootte: 3072000
        }
      ],
      status: 'ingediend'
    }
  ];

  const gunningsCriteria = [
    { id: 'prijs', naam: 'Prijs', wegingsfactor: 40, type: 'prijs' },
    { id: 'kwaliteit', naam: 'Kwaliteit', wegingsfactor: 30, type: 'kwaliteit' },
    { id: 'technisch', naam: 'Technische aspecten', wegingsfactor: 20, type: 'technisch' },
    { id: 'duurzaamheid', naam: 'Duurzaamheid', wegingsfactor: 10, type: 'duurzaamheid' }
  ];

  const filteredInzendingen = selectedAanbesteding 
    ? inzendingen.filter(i => i.aanbestedingId === selectedAanbesteding)
    : inzendingen;

  const selectedInzendingData = selectedInzending 
    ? inzendingen.find(i => i.id === selectedInzending)
    : null;

  if (loading) {
    return <LoadingSpinner size="lg" text="Inzendingen laden..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inzendingen Beoordeling</h2>
          <p className="text-gray-600">Beoordeel en evalueer ingediende offertes</p>
        </div>
      </div>

      {/* Aanbesteding Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Aanbesteding:</label>
          <select
            value={selectedAanbesteding}
            onChange={(e) => setSelectedAanbesteding(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Alle aanbestedingen</option>
            <option value="1">IT-infrastructuur modernisering</option>
            <option value="2">Groenbeheer openbare ruimte</option>
            <option value="3">Wegenbouw project Noord</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inzendingen Lijst */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Inzendingen ({filteredInzendingen.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredInzendingen.map((inzending) => (
                <div
                  key={inzending.id}
                  onClick={() => setSelectedInzending(inzending.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedInzending === inzending.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{inzending.indienerNaam}</h4>
                      <p className="text-xs text-gray-500 mt-1">KvK: {inzending.indienerKvK}</p>
                      <p className="text-xs text-gray-500">
                        Ingediend: {formatDate(inzending.inzendingsDatum)}
                      </p>
                      {inzending.beoordeling && (
                        <div className="mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            inzending.beoordeling.totaalScore >= 80 ? 'text-green-600 bg-green-100' :
                            inzending.beoordeling.totaalScore >= 60 ? 'text-yellow-600 bg-yellow-100' :
                            'text-red-600 bg-red-100'
                          }`}>
                            Score: {inzending.beoordeling.totaalScore}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <StatusBadge status={inzending.status} type="submission" size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inzending Details */}
        <div className="lg:col-span-2">
          {selectedInzendingData ? (
            <div className="space-y-6">
              {/* Indiener Informatie */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Indiener Informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bedrijfsnaam</label>
                    <p className="mt-1 text-sm text-gray-900">{sanitizeHtml(selectedInzendingData.indienerNaam || '')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">KvK-nummer</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {sanitizeHtml(selectedInzendingData.indienerKvK || '')}
                      {!validateKvKNumber(selectedInzendingData.indienerKvK) && (
                        <span className="ml-2 text-red-500 text-xs">⚠️ Ongeldig KvK nummer</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-mail</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {sanitizeHtml(selectedInzendingData.indienerEmail || '')}
                      {!validateEmail(selectedInzendingData.indienerEmail) && (
                        <span className="ml-2 text-red-500 text-xs">⚠️ Ongeldig email</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefoon</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {sanitizeHtml(selectedInzendingData.indienerTelefoon || '')}
                      {!validatePhoneNumber(selectedInzendingData.indienerTelefoon) && (
                        <span className="ml-2 text-red-500 text-xs">⚠️ Ongeldig telefoonnummer</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documenten */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ingediende Documenten</h3>
                <div className="space-y-3">
                  {selectedInzendingData.documenten.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{document.naam}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(document.grootte)} • {formatDate(document.uploadDatum)}
                          </p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Beoordeling */}
              {selectedInzendingData.beoordeling ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Beoordeling</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Beoordelaar</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedInzendingData.beoordeling.beoordelaar}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Beoordelingsdatum</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedInzendingData.beoordeling.beoordelingsDatum)}
                      </p>
                    </div>
                  </div>

                  {/* Scores per criterium */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Scores per Criterium</h4>
                    <div className="space-y-3">
                      {gunningsCriteria.map((criterium) => {
                        const score = selectedInzendingData.beoordeling?.scores[criterium.id] || 0;
                        return (
                          <div key={criterium.id} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {criterium.naam} ({criterium.wegingsfactor}%)
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  score >= 80 ? 'text-green-600 bg-green-100' :
                                  score >= 60 ? 'text-yellow-600 bg-yellow-100' :
                                  'text-red-600 bg-red-100'
                                }`}>
                                  {score}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${score}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Totaalscore */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Totaalscore</span>
                      <span className={`px-3 py-1 text-lg font-bold rounded-full ${
                        selectedInzendingData.beoordeling.totaalScore >= 80 ? 'text-green-600 bg-green-100' :
                        selectedInzendingData.beoordeling.totaalScore >= 60 ? 'text-yellow-600 bg-yellow-100' :
                        'text-red-600 bg-red-100'
                      }`}>
                        {selectedInzendingData.beoordeling.totaalScore}
                      </span>
                    </div>
                  </div>

                  {/* Opmerkingen */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opmerkingen</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {selectedInzendingData.beoordeling.opmerkingen}
                    </p>
                  </div>

                  {/* Bias Controle */}
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-900 mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Bias Controle Verklaring
                    </h4>
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="biasCheck"
                          checked={selectedInzendingData.beoordeling.manualBiasCheckDeclared}
                          readOnly
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="biasCheck" className="text-sm text-yellow-800">
                          <strong>Handmatige bias-controle uitgevoerd</strong>
                        </label>
                        <p className="text-xs text-yellow-700 mt-1">
                          Ik verklaar dat ik een handmatige controle heb uitgevoerd op mogelijke 
                          belangenverstrengeling, persoonlijke relaties of andere vormen van bias 
                          tussen mijzelf als beoordelaar en de indiener van deze offerte.
                        </p>
                        {selectedInzendingData.beoordeling.manualBiasCheckDeclared ? (
                          <div className="mt-2 flex items-center text-xs text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verklaring afgegeven door {selectedInzendingData.beoordeling.beoordelaar}
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center text-xs text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Verklaring nog niet afgegeven
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Aanbeveling */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Aanbeveling:</span>
                      <span className={`ml-2 px-2 py-1 text-sm font-semibold rounded-full ${
                        selectedInzendingData.beoordeling.aanbeveling === 'gunnen' 
                          ? 'bg-green-100 text-green-800'
                          : selectedInzendingData.beoordeling.aanbeveling === 'afwijzen'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedInzendingData.beoordeling.aanbeveling}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className={`h-5 w-5 mr-2 ${
                        selectedInzendingData.beoordeling.juridischeCheck ? 'text-green-500' : 'text-gray-400'
                      }`} />
                      <span className="text-sm text-gray-700">
                        Juridische check {selectedInzendingData.beoordeling.juridischeCheck ? 'voltooid' : 'vereist'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Beoordeling</h3>
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Deze inzending is nog niet beoordeeld</p>
                    <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                      Beoordeling Starten
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Selecteer een inzending om details te bekijken</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}