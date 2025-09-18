import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, X, Database } from 'lucide-react';
import { ragService } from '../services/ragService';
import { juridischeChunks, groepeerPerBron } from '../data/juridische-chunks';
import { validateFile, sanitizeHtml, createAuditLog, sanitizeFilePath } from '../lib/security';
import type { Document } from '../types/rag';

export default function DocumentIngestion() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ file: string; status: 'success' | 'error'; message: string }[]>([]);
  const [indexingLegal, setIndexingLegal] = useState(false);

  const documentTypes = [
    { value: 'wetgeving', label: 'Wetgeving' },
    { value: 'jurisprudentie', label: 'Jurisprudentie' },
    { value: 'checklist', label: 'Checklist' },
    { value: 'template', label: 'Template' },
    { value: 'bestek', label: 'Bestek' },
    { value: 'inzending', label: 'Inzending' }
  ];

  const [metadata, setMetadata] = useState({
    type: 'bestek' as Document['type'],
    tags: '',
    wetsartikel: '',
    source: ''
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // SECURITY: Limit total number of files
    if (selectedFiles.length > 10) {
      alert('Maximum 10 bestanden per keer toegestaan.');
      return;
    }
    
    // Valideer elk bestand
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    selectedFiles.forEach(file => {
      // Sanitize filename
      const sanitizedName = sanitizeFilePath(file.name);
      if (sanitizedName !== file.name) {
        errors.push(`${file.name}: Bestandsnaam bevat ongeldige karakters`);
        return;
      }
      
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
        // Audit log voor file upload
        console.log('Audit:', createAuditLog('FILE_SELECTED', 'document', { 
          fileName: sanitizeHtml(file.name), 
          fileSize: file.size,
          fileType: sanitizeHtml(file.type)
        }));
      } else {
        errors.push(`${sanitizeHtml(file.name)}: ${sanitizeHtml(validation.error || 'Onbekende fout')}`);
      }
    });
    
    if (errors.length > 0) {
      alert(`Sommige bestanden zijn niet toegevoegd:\n${errors.join('\n')}`);
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    
    // Gebruik dezelfde validatie als handleFileSelect
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    droppedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      alert(`Sommige bestanden zijn niet toegevoegd:\n${errors.join('\n')}`);
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadResults([]);

    const results = await Promise.allSettled(
      files.map(async (file) => {
        try {
          const documentMetadata = {
            type: metadata.type,
            tags: metadata.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            wetsartikel: metadata.wetsartikel || undefined,
            source: metadata.source || file.name
          };

          await ragService.ingestDocument(file, documentMetadata);
          return { file: file.name, status: 'success' as const, message: 'Document succesvol geïndexeerd' };
        } catch (error) {
          return { 
            file: file.name, 
            status: 'error' as const, 
            message: error instanceof Error ? error.message : 'Onbekende fout' 
          };
        }
      })
    );

    setUploadResults(results.map(result => result.status === 'fulfilled' ? result.value : result.reason));
    setUploading(false);
    setFiles([]);
  };

  const handleIndexLegalDocuments = async () => {
    setIndexingLegal(true);
    try {
      // Gebruik de voorbeeld juridische chunks dataset
      const legalTexts = juridischeChunks.map(chunk => ({
        content: `${chunk.artikel || chunk.paragraaf || ''} ${chunk.bron} - ${chunk.text}`,
        metadata: {
          source: chunk.bron,
          article: chunk.artikel || chunk.paragraaf || '',
          category: chunk.bron.includes('ARW') ? 'ARW Regelgeving' : 'Nederlandse wetgeving',
          date: chunk.datum || new Date('2012-07-01')
        }
      }));

      let successCount = 0;
      for (const legalText of legalTexts) {
        const success = await ragService.indexLegalDocument(legalText.content, legalText.metadata);
        if (success) successCount++;
      }

      setUploadResults([{
        file: 'Juridische Kennisbasis',
        status: 'success',
        message: `${successCount}/${legalTexts.length} juridische documenten geïndexeerd (${juridischeChunks.length} chunks uit Aanbestedingswet & ARW)`
      }]);
    } catch (error) {
      setUploadResults([{
        file: 'Juridische Kennisbasis',
        status: 'error',
        message: error instanceof Error ? error.message : 'Indexering mislukt'
      }]);
    } finally {
      setIndexingLegal(false);
    }
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Document Corpus Beheer</h2>
        <p className="text-gray-600">Upload documenten voor de juridische kennisbank</p>
      </div>

      {/* Metadata Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Document Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={metadata.type}
              onChange={(e) => setMetadata(prev => ({ ...prev, type: e.target.value as Document['type'] }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wetsartikel (optioneel)
            </label>
            <input
              type="text"
              value={metadata.wetsartikel}
              onChange={(e) => setMetadata(prev => ({ ...prev, wetsartikel: e.target.value }))}
              placeholder="bijv. Art. 2.16 Aanbestedingswet"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (komma gescheiden)
            </label>
            <input
              type="text"
              value={metadata.tags}
              onChange={(e) => setMetadata(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="bijv. drempelwaarde, EU-richtlijn, publicatie"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bron (optioneel)
            </label>
            <input
              type="text"
              value={metadata.source}
              onChange={(e) => setMetadata(prev => ({ ...prev, source: e.target.value }))}
              placeholder="bijv. Staatsblad, Rechtbank Den Haag"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Juridische Kennisbasis Indexering */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2 text-purple-600" />
          Juridische Kennisbasis (Weaviate)
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Indexeer juridische teksten zoals wetten en EU-richtlijnen in de Weaviate vector database 
          voor verbeterde RAG-functionaliteit.
        </p>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <p>• Aanbestedingswet 2012 (7 artikelen)</p>
            <p>• ARW 2016 (3 paragrafen)</p>
            <p>• Totaal 10 juridische chunks in laws.json</p>
            <p>• Ready voor Weaviate indexering</p>
          </div>
          
          <button
            onClick={handleIndexLegalDocuments}
            disabled={indexingLegal}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Database className="h-4 w-4 mr-2" />
            {indexingLegal ? 'Indexeren...' : 'Indexeer laws.json in Weaviate'}
          </button>
        </div>
      </div>
      {/* File Upload Area */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Documenten Uploaden</h3>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">Sleep bestanden hierheen of klik om te selecteren</p>
          <p className="text-sm text-gray-500 mb-4">Ondersteunde formaten: PDF, Word, TXT</p>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer inline-block"
          >
            Bestanden Selecteren
          </label>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Geselecteerde Bestanden ({files.length})</h4>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploaden...' : `${files.length} Document(en) Uploaden`}
              </button>
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Upload Resultaten</h4>
            <div className="space-y-2">
              {uploadResults.map((result, index) => (
                <div key={index} className={`flex items-center p-3 rounded-md ${
                  result.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {result.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{result.file}</p>
                    <p className={`text-xs ${
                      result.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Corpus Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Database Statistieken</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Supabase (Gebruikersdocumenten)</h4>
            <div className="grid grid-cols-3 gap-2">
              {documentTypes.slice(0, 3).map(type => (
                <div key={type.value} className="text-center p-2 bg-white rounded">
                  <p className="text-lg font-bold text-blue-600">-</p>
                  <p className="text-xs text-blue-700">{type.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Weaviate (Juridische Kennisbasis)</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-white rounded">
                <p className="text-lg font-bold text-purple-600">-</p>
                <p className="text-xs text-purple-700">Wetgeving</p>
              </div>
              <div className="text-center p-2 bg-white rounded">
                <p className="text-lg font-bold text-purple-600">-</p>
                <p className="text-xs text-purple-700">EU-richtlijnen</p>
              </div>
              <div className="text-center p-2 bg-white rounded">
                <p className="text-lg font-bold text-purple-600">-</p>
                <p className="text-xs text-purple-700">Jurisprudentie</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {documentTypes.map(type => (
            <div key={type.value} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">-</p>
              <p className="text-sm text-gray-600">{type.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>Supabase documenten: <span className="font-medium">-</span> | Juridische chunks: <span className="font-medium">{juridischeChunks.length}</span></p>
          <p>Bronnen: <span className="font-medium">{Object.keys(groepeerPerBron()).join(', ')}</span></p>
        </div>
      </div>
    </div>
  );
}