import React, { useState } from 'react';
import { Scale, AlertTriangle, CheckCircle, XCircle, FileText, Plus, Save } from 'lucide-react';
import type { JuridischeToetsing, JuridischeBevinding, JuridischRisico } from '../types/aanbesteding';

export default function JuridischeToetsing() {
  const [selectedAanbesteding, setSelectedAanbesteding] = useState('');
  const [toetsing, setToetsing] = useState<Partial<JuridischeToetsing>>({
    juristNaam: 'Mr. J. de Vries',
    compliance: 'onduidelijk',
    bevindingen: [],
    risicos: [],
    actiepunten: [],
    doorverwijzingNodig: false,
    opmerkingen: ''
  });

  const wetsartikelen = [
    'Art. 2.1 Aanbestedingswet (Toepassingsgebied)',
    'Art. 2.2 Aanbestedingswet (Drempelwaarden)',
    'Art. 2.16 Aanbestedingswet (Publicatieplicht)',
    'Art. 2.17 Aanbestedingswet (Termijnen)',
    'Art. 2.18 Aanbestedingswet (Gunningscriteria)',
    'Art. 2.19 Aanbestedingswet (Motiveringsplicht)',
    'Art. 2.20 Aanbestedingswet (Uitsluitingsgronden)',
    'Art. 2.21 Aanbestedingswet (Geschiktheidseisen)',
    'EU-Richtlijn 2014/24/EU (Klassieke sectoren)',
    'EU-Richtlijn 2014/25/EU (Nutssectoren)'
  ];

  const risicoTypes = [
    { value: 'procedureel', label: 'Procedureel risico' },
    { value: 'juridisch', label: 'Juridisch risico' },
    { value: 'financieel', label: 'Financieel risico' },
    { value: 'reputatie', label: 'Reputatierisico' },
    { value: 'operationeel', label: 'Operationeel risico' }
  ];

  const addBevinding = () => {
    const newBevinding: JuridischeBevinding = {
      id: Date.now().toString(),
      wetsartikel: '',
      beschrijving: '',
      status: 'onduidelijk',
      toelichting: ''
    };
    setToetsing(prev => ({
      ...prev,
      bevindingen: [...(prev.bevindingen || []), newBevinding]
    }));
  };

  const addRisico = () => {
    const newRisico: JuridischRisico = {
      id: Date.now().toString(),
      beschrijving: '',
      impact: 'middel',
      waarschijnlijkheid: 'middel',
      mitigatie: ''
    };
    setToetsing(prev => ({
      ...prev,
      risicos: [...(prev.risicos || []), newRisico]
    }));
  };

  const updateBevinding = (id: string, field: keyof JuridischeBevinding, value: string) => {
    setToetsing(prev => ({
      ...prev,
      bevindingen: prev.bevindingen?.map(b => 
        b.id === id ? { ...b, [field]: value } : b
      )
    }));
  };

  const updateRisico = (id: string, field: keyof JuridischRisico, value: string) => {
    setToetsing(prev => ({
      ...prev,
      risicos: prev.risicos?.map(r => 
        r.id === id ? { ...r, [field]: value } : r
      )
    }));
  };

  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'niet-compliant': return 'text-red-600 bg-red-100';
      case 'onduidelijk': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'voldoet': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'voldoet-niet': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'onduidelijk': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRisicoColor = (impact: string, waarschijnlijkheid: string) => {
    const score = (impact === 'hoog' ? 3 : impact === 'middel' ? 2 : 1) * 
                  (waarschijnlijkheid === 'hoog' ? 3 : waarschijnlijkheid === 'middel' ? 2 : 1);
    
    if (score >= 6) return 'bg-red-100 text-red-800';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Juridische Toetsing</h2>
          <p className="text-gray-600">Beoordeel aanbestedingen op compliance met Nederlandse wetgeving</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Toetsing Opslaan
        </button>
      </div>

      {/* Aanbesteding Selectie */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Aanbesteding Selecteren</h3>
        <select
          value={selectedAanbesteding}
          onChange={(e) => setSelectedAanbesteding(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Selecteer een aanbesteding...</option>
          <option value="1">IT-infrastructuur modernisering</option>
          <option value="2">Groenbeheer openbare ruimte</option>
          <option value="3">Wegenbouw project Noord</option>
        </select>
      </div>

      {selectedAanbesteding && (
        <>
          {/* Algemene Beoordeling */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Algemene Beoordeling</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurist
                </label>
                <input
                  type="text"
                  value={toetsing.juristNaam || ''}
                  onChange={(e) => setToetsing(prev => ({ ...prev, juristNaam: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compliance Status
                </label>
                <select
                  value={toetsing.compliance || 'onduidelijk'}
                  onChange={(e) => setToetsing(prev => ({ ...prev, compliance: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="compliant">Compliant</option>
                  <option value="niet-compliant">Niet-compliant</option>
                  <option value="onduidelijk">Onduidelijk</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <div className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getComplianceColor(toetsing.compliance || 'onduidelijk')}`}>
                <Scale className="h-4 w-4 mr-2" />
                {toetsing.compliance || 'Onduidelijk'}
              </div>
            </div>
          </div>

          {/* Juridische Bevindingen */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Juridische Bevindingen</h3>
              <button
                onClick={addBevinding}
                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Bevinding Toevoegen
              </button>
            </div>
            
            <div className="space-y-4">
              {toetsing.bevindingen?.map((bevinding) => (
                <div key={bevinding.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wetsartikel
                      </label>
                      <select
                        value={bevinding.wetsartikel}
                        onChange={(e) => updateBevinding(bevinding.id, 'wetsartikel', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecteer wetsartikel...</option>
                        {wetsartikelen.map((artikel) => (
                          <option key={artikel} value={artikel}>{artikel}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(bevinding.status)}
                        <select
                          value={bevinding.status}
                          onChange={(e) => updateBevinding(bevinding.id, 'status', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="voldoet">Voldoet</option>
                          <option value="voldoet-niet">Voldoet niet</option>
                          <option value="onduidelijk">Onduidelijk</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschrijving
                    </label>
                    <textarea
                      value={bevinding.beschrijving}
                      onChange={(e) => updateBevinding(bevinding.id, 'beschrijving', e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Beschrijf de bevinding..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Toelichting
                    </label>
                    <textarea
                      value={bevinding.toelichting}
                      onChange={(e) => updateBevinding(bevinding.id, 'toelichting', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Geef een uitgebreide toelichting..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risico's */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Geïdentificeerde Risico's</h3>
              <button
                onClick={addRisico}
                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Risico Toevoegen
              </button>
            </div>
            
            <div className="space-y-4">
              {toetsing.risicos?.map((risico) => (
                <div key={risico.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Impact
                      </label>
                      <select
                        value={risico.impact}
                        onChange={(e) => updateRisico(risico.id, 'impact', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="laag">Laag</option>
                        <option value="middel">Middel</option>
                        <option value="hoog">Hoog</option>
                        <option value="kritiek">Kritiek</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Waarschijnlijkheid
                      </label>
                      <select
                        value={risico.waarschijnlijkheid}
                        onChange={(e) => updateRisico(risico.id, 'waarschijnlijkheid', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="laag">Laag</option>
                        <option value="middel">Middel</option>
                        <option value="hoog">Hoog</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Risicoscore
                      </label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRisicoColor(risico.impact, risico.waarschijnlijkheid)}`}>
                        {risico.impact} × {risico.waarschijnlijkheid}
                      </span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Risicobeschrijving
                    </label>
                    <textarea
                      value={risico.beschrijving}
                      onChange={(e) => updateRisico(risico.id, 'beschrijving', e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Beschrijf het risico..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mitigatiemaatregelen
                    </label>
                    <textarea
                      value={risico.mitigatie}
                      onChange={(e) => updateRisico(risico.id, 'mitigatie', e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Beschrijf hoe dit risico kan worden gemitigeerd..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actiepunten en Doorverwijzing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actiepunten</h3>
              <textarea
                value={toetsing.actiepunten?.join('\n') || ''}
                onChange={(e) => setToetsing(prev => ({ 
                  ...prev, 
                  actiepunten: e.target.value.split('\n').filter(item => item.trim()) 
                }))}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Voer elk actiepunt op een nieuwe regel in..."
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Doorverwijzing</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="doorverwijzing"
                    checked={toetsing.doorverwijzingNodig || false}
                    onChange={(e) => setToetsing(prev => ({ ...prev, doorverwijzingNodig: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="doorverwijzing" className="ml-2 text-sm text-gray-700">
                    Doorverwijzing naar specialist vereist
                  </label>
                </div>
                
                {toetsing.doorverwijzingNodig && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reden voor doorverwijzing
                    </label>
                    <textarea
                      value={toetsing.doorverwijzingReden || ''}
                      onChange={(e) => setToetsing(prev => ({ ...prev, doorverwijzingReden: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Specificeer waarom doorverwijzing nodig is..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Opmerkingen */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Algemene Opmerkingen</h3>
            <textarea
              value={toetsing.opmerkingen || ''}
              onChange={(e) => setToetsing(prev => ({ ...prev, opmerkingen: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Voeg algemene opmerkingen toe over de juridische toetsing..."
            />
          </div>
        </>
      )}
    </div>
  );
}