import React, { useState } from 'react';
import { Brain, FileSearch, CheckSquare, AlertTriangle, Download, Eye } from 'lucide-react';
import { ragService } from '../services/ragService';
import { beschikbareChecklists } from '../data/checklists';
import { juridischeChunks, haalJuridischeContext } from '../data/juridische-chunks';
import type { DocumentAnalysis, ComplianceMatrix, ChecklistResult } from '../types/rag';

export default function AIDocumentAnalyzer() {
  const [selectedDocument, setSelectedDocument] = useState('');
  const [selectedChecklist, setSelectedChecklist] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [complianceMatrix, setComplianceMatrix] = useState<ComplianceMatrix | null>(null);

  const mockDocuments = [
    { id: '1', name: 'IT-infrastructuur bestek.pdf', type: 'bestek' },
    { id: '2', name: 'Groenbeheer offerte TechSolutions.pdf', type: 'inzending' },
    { id: '3', name: 'Wegenbouw inzending InnovatieGroep.pdf', type: 'inzending' }
  ];

  const handleAnalyze = async () => {
    if (!selectedDocument || !selectedChecklist) return;

    setAnalyzing(true);
    try {
      const result = await ragService.analyzeDocument(selectedDocument, selectedChecklist);
      setAnalysis(result);
      setComplianceMatrix(generateComplianceMatrix(result));
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateComplianceMatrix = (analysis: DocumentAnalysis): ComplianceMatrix => {
    // Group results by category
    const categories: { [key: string]: ChecklistResult[] } = {};
    
    // Mock categorization
    analysis.checklist_results.forEach((result, index) => {
      const category = index < 8 ? 'Procedurele Vereisten' : 
                     index < 16 ? 'Technische Specificaties' : 
                     'Juridische Compliance';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(result);
    });

    // Calculate scores per category
    const processedCategories: ComplianceMatrix['categories'] = {};
    Object.entries(categories).forEach(([category, items]) => {
      const score = Math.round(
        items.reduce((sum, item) => {
          const itemScore = item.status === 'aanwezig' ? 100 : 
                          item.status === 'inconsistent' ? 50 : 0;
          return sum + itemScore;
        }, 0) / items.length
      );
      
      processedCategories[category] = {
        items,
        score,
        status: score >= 80 ? 'compliant' : score >= 60 ? 'partial' : 'non-compliant'
      };
    });

    const overallScore = analysis.compliance_score;
    const criticalIssues = analysis.checklist_results
      .filter(r => r.status === 'ontbreekt')
      .map(r => `Ontbrekende vereiste: ${r.checklist_item_id}`)
      .slice(0, 5);

    return {
      categories: processedCategories,
      overall_score: overallScore,
      overall_status: overallScore >= 80 ? 'compliant' : 
                     overallScore >= 60 ? 'requires-review' : 'non-compliant',
      critical_issues: criticalIssues,
      recommendations: analysis.recommendations
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aanwezig': return 'text-green-600 bg-green-100';
      case 'inconsistent': return 'text-yellow-600 bg-yellow-100';
      case 'ontbreekt': return 'text-red-600 bg-red-100';
      case 'niet-van-toepassing': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aanwezig': return <CheckSquare className="h-4 w-4 text-green-500" />;
      case 'inconsistent': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'ontbreekt': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <FileSearch className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'border-green-200 bg-green-50';
      case 'partial': return 'border-yellow-200 bg-yellow-50';
      case 'non-compliant': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Document Analyzer</h2>
        <p className="text-gray-600">Geautomatiseerde juridische documentanalyse met checklist-validatie</p>
      </div>

      {/* Analysis Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-blue-600" />
          Analyse Configuratie
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Te Analyseren Document
            </label>
            <select
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecteer document...</option>
              {mockDocuments.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.type})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Checklist Template
            </label>
            <select
              value={selectedChecklist}
              onChange={(e) => setSelectedChecklist(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecteer checklist...</option>
              {beschikbareChecklists.map(checklist => (
                <option key={checklist.id} value={checklist.id}>
                  {checklist.naam} ({checklist.items.length} items)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={!selectedDocument || !selectedChecklist || analyzing}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Brain className="h-4 w-4 mr-2" />
            {analyzing ? 'Analyseren...' : 'Start AI Analyse'}
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && complianceMatrix && (
        <div className="space-y-6">
          {/* Gebruikte Checklist Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckSquare className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Geanalyseerd met: {beschikbareChecklists.find(c => c.id === selectedChecklist)?.naam}
                </p>
                <p className="text-xs text-blue-700">
                  {beschikbareChecklists.find(c => c.id === selectedChecklist)?.items.length} checklist items • 
                  Versie {beschikbareChecklists.find(c => c.id === selectedChecklist)?.versie} • 
                  {juridischeChunks.length} juridische chunks beschikbaar
                </p>
              </div>
            </div>
          </div>

          {/* Overall Compliance Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Compliance Score</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                  complianceMatrix.overall_score >= 80 ? 'bg-green-100 text-green-600' :
                  complianceMatrix.overall_score >= 60 ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {complianceMatrix.overall_score}%
                </div>
                <div className="ml-4">
                  <p className="text-lg font-medium text-gray-900">
                    Status: <span className={`${
                      complianceMatrix.overall_status === 'compliant' ? 'text-green-600' :
                      complianceMatrix.overall_status === 'requires-review' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {complianceMatrix.overall_status === 'compliant' ? 'Compliant' :
                       complianceMatrix.overall_status === 'requires-review' ? 'Vereist Review' :
                       'Non-Compliant'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Geanalyseerd op: {analysis.analyzed_at.toLocaleDateString('nl-NL')}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800 flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </button>
                <button className="text-blue-600 hover:text-blue-800 flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  Rapport
                </button>
              </div>
            </div>
          </div>

          {/* Compliance Matrix by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Matrix per Categorie</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Object.entries(complianceMatrix.categories).map(([category, data]) => (
                <div key={category} className={`border-2 rounded-lg p-4 ${getCategoryColor(data.status)}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">{category}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      data.status === 'compliant' ? 'bg-green-100 text-green-800' :
                      data.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {data.score}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {data.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          {getStatusIcon(item.status)}
                          <span className="ml-2 text-gray-700">Item {index + 1}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                    {data.items.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{data.items.length - 3} meer items
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Issues & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Kritieke Issues
              </h3>
              {complianceMatrix.critical_issues.length > 0 ? (
                <ul className="space-y-2">
                  {complianceMatrix.critical_issues.map((issue, index) => (
                    <li key={index} className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{issue}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Geen kritieke issues geïdentificeerd.</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CheckSquare className="h-5 w-5 mr-2 text-blue-500" />
                AI Aanbevelingen
              </h3>
              {complianceMatrix.recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {complianceMatrix.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <CheckSquare className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Geen specifieke aanbevelingen.</p>
              )}
            </div>
          </div>

          {/* Detailed Checklist Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gedetailleerde Checklist Resultaten</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bewijs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notities
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysis.checklist_results.slice(0, 10).map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {beschikbareChecklists.find(c => c.id === selectedChecklist)?.items[index]?.vraag.substring(0, 50) || `Item ${index + 1}`}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(result.status)}
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.round(result.confidence)}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {result.evidence.length} bewijs(stukken)
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {result.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {analysis.checklist_results.length > 10 && (
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  Toon alle {analysis.checklist_results.length} resultaten
                </button>
              </div>
            )}
          </div>

          {/* Checklist Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Checklist Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {beschikbareChecklists.find(c => c.id === selectedChecklist)?.items.slice(0, 6).map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item.verplicht ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.verplicht ? 'Verplicht' : 'Optioneel'}
                    </span>
                    <span className="text-xs text-gray-500">{item.wegingsfactor}%</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{item.vraag}</p>
                  <p className="text-xs text-gray-600">{item.toelichting}</p>
                  {item.wetsartikel && (
                    <p className="text-xs text-blue-600 mt-1">📖 {item.wetsartikel}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Human Review Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-yellow-600" />
              Menselijke Review Vereist
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Deze AI-analyse dient als eerste screening. Een juridische professional moet de resultaten 
              valideren voordat definitieve besluiten worden genomen.
            </p>
            <div className="flex space-x-4">
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm">
                Goedkeuren
              </button>
              <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors text-sm">
                Aanpassingen Vereist
              </button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm">
                Afwijzen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}