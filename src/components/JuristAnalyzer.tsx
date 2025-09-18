import React, { useState } from 'react';
import { Scale, FileText, Upload, Play, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { parsePdfToText } from '../lib/pdf';
import { callLLM } from '../lib/llm';
import { beschikbareChecklists } from '../data/checklists';
import { validateFile } from '../lib/security';

interface APIResponse {
  analysis: Array<{
    id: string;
    status: 'aanwezig' | 'ontbreekt' | 'inconsistent';
    toelichting: string;
    confidence?: number;
    bronverwijzing?: string;
  }>;
  metadata: {
    bestekFile: string;
    inschrijvingFile: string;
    analyzedAt: string;
    complianceScore: number;
  };
}

export default function JuristAnalyzer() {
  const [bestekFile, setBestekFile] = useState<File | null>(null);
  const [inschrijvingFile, setInschrijvingFile] = useState<File | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState('basis-aanbesteding');
  const [analyzing, setAnalyzing] = useState(false);
  const [apiResponse, setApiResponse] = useState<APIResponse | null>(null);
  const [jsonOutput, setJsonOutput] = useState('');

  const handleFileUpload = (file: File, type: 'bestek' | 'inschrijving') => {
    if (type === 'bestek') {
      setBestekFile(file);
    } else {
      setInschrijvingFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!bestekFile || !inschrijvingFile) {
      alert('Upload zowel bestek als inschrijving bestanden');
      return;
    }
    
    // SECURITY: Additional file validation before analysis
    const bestekValidation = validateFile(bestekFile);
    const inschrijvingValidation = validateFile(inschrijvingFile);
    
    if (!bestekValidation.isValid) {
      alert(`Bestek bestand: ${bestekValidation.error}`);
      return;
    }
    
    if (!inschrijvingValidation.isValid) {
      alert(`Inschrijving bestand: ${inschrijvingValidation.error}`);
      return;
    }

    setAnalyzing(true);
    try {
      // Create FormData for API call
      const formData = new FormData();
      formData.append('bestek', bestekFile);
      formData.append('inschrijving', inschrijvingFile);

      // Call the analysis API
      const response = await fetch('/api/llm-analysis', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data: APIResponse = await response.json();
      setApiResponse(data);
      
      // Genereer JSON output zoals gevraagd
      const jsonResultaat = data.analysis.map(r => ({
        id: r.id,
        status: r.status,
        toelichting: r.toelichting
      }));
      
      setJsonOutput(JSON.stringify(jsonResultaat, null, 2));
    } catch (error) {
      console.error('Analyse fout:', error);
      alert('Er is een fout opgetreden tijdens de analyse');
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aanwezig': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'inconsistent': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'ontbreekt': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aanwezig': return 'text-green-600 bg-green-100';
      case 'inconsistent': return 'text-yellow-600 bg-yellow-100';
      case 'ontbreekt': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(jsonOutput);
    alert('JSON gekopieerd naar klembord');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Scale className="h-8 w-8 mr-3 text-blue-600" />
          Aanbestedingsjurist AI
        </h2>
        <p className="text-gray-600">Geautomatiseerde juridische beoordeling van inschrijvingen tegen checklist</p>
      </div>

      {/* Input Sectie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bestek Input */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Bestek Document
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Bestek (PDF, Word, TXT)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'bestek')}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          {bestekFile && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <FileText className="h-4 w-4 inline mr-2" />
                {bestekFile.name} ({Math.round(bestekFile.size / 1024)} KB)
              </p>
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500">
            {bestekFile ? `Bestand geselecteerd: ${bestekFile.name}` : 'Geen bestand geselecteerd'}
          </div>
        </div>

        {/* Inschrijving Input */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2 text-green-600" />
            Inschrijving Document
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Inschrijving (PDF, Word, TXT)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'inschrijving')}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>
          
          {inschrijvingFile && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-700">
                <FileText className="h-4 w-4 inline mr-2" />
                {inschrijvingFile.name} ({Math.round(inschrijvingFile.size / 1024)} KB)
              </p>
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500">
            {inschrijvingFile ? `Bestand geselecteerd: ${inschrijvingFile.name}` : 'Geen bestand geselecteerd'}
          </div>
        </div>
      </div>

      {/* Checklist Selectie en Analyse */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analyse Configuratie</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Checklist Template
            </label>
            <select
              value={selectedChecklist}
              onChange={(e) => setSelectedChecklist(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {beschikbareChecklists.map(checklist => (
                <option key={checklist.id} value={checklist.id}>
                  {checklist.naam} ({checklist.items.length} items)
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleAnalyze}
              disabled={!bestekFile || !inschrijvingFile || analyzing}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Play className="h-4 w-4 mr-2" />
              {analyzing ? 'Analyseren...' : 'Start API Analyse'}
            </button>
          </div>
        </div>

        {/* Checklist Preview */}
        {selectedChecklist && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Geselecteerde Checklist Items:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {beschikbareChecklists.find(c => c.id === selectedChecklist)?.items.map((item, index) => (
                <div key={item.id} className="text-sm text-gray-600 flex items-center">
                  <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center mr-2">
                    {index + 1}
                  </span>
                  {item.vraag.substring(0, 50)}...
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resultaten */}
      {apiResponse && (
        <div className="space-y-6">
          {/* API Metadata */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Analyse Resultaten</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Bestek:</span>
                <p className="text-blue-600">{apiResponse.metadata.bestekFile}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Inschrijving:</span>
                <p className="text-blue-600">{apiResponse.metadata.inschrijvingFile}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Compliance:</span>
                <p className="text-blue-600">{apiResponse.metadata.complianceScore}%</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Geanalyseerd:</span>
                <p className="text-blue-600">{new Date(apiResponse.metadata.analyzedAt).toLocaleString('nl-NL')}</p>
              </div>
            </div>
          </div>

          {/* Visuele Resultaten */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Beoordeling Resultaten</h3>
            
            <div className="space-y-4">
              {apiResponse.analysis.map((resultaat, index) => {
                const checklistItem = beschikbareChecklists
                  .find(c => c.id === selectedChecklist)?.items
                  .find(item => item.id === resultaat.id);
                
                return (
                  <div key={resultaat.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-medium text-gray-500 mr-3">#{index + 1}</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(resultaat.status)}`}>
                            {resultaat.status.toUpperCase()}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            Confidence: {resultaat.confidence}%
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          {checklistItem?.vraag || `Item ${resultaat.id}`}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{resultaat.toelichting}</p>
                        {resultaat.bronverwijzing && (
                          <p className="text-xs text-blue-600">📍 {resultaat.bronverwijzing}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        {getStatusIcon(resultaat.status)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* JSON Output */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">JSON Output</h3>
              <button
                onClick={copyJsonToClipboard}
                className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors text-sm"
              >
                Kopieer JSON
              </button>
            </div>
            
            <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto border">
              <code>{jsonOutput}</code>
            </pre>
          </div>

          {/* Samenvatting */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Samenvatting</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {apiResponse.analysis.filter(r => r.status === 'aanwezig').length}
                </div>
                <div className="text-sm text-green-700">Aanwezig</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {apiResponse.analysis.filter(r => r.status === 'inconsistent').length}
                </div>
                <div className="text-sm text-yellow-700">Inconsistent</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {apiResponse.analysis.filter(r => r.status === 'ontbreekt').length}
                </div>
                <div className="text-sm text-red-700">Ontbreekt</div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>API Compliance Score:</strong> {apiResponse.metadata.complianceScore}%</p>
              <p><strong>Gemiddelde Confidence:</strong> {Math.round(apiResponse.analysis.reduce((sum, r) => sum + (r.confidence || 0), 0) / apiResponse.analysis.length)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}