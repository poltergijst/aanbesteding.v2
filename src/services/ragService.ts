import { supabase } from './supabase';
import { embed, chunkText, cosineSimilarity } from '../lib/embeddings';
import { getWeaviateClient, searchWeaviate, initializeWeaviateSchema } from '../lib/weaviate';
import { beschikbareChecklists } from '../data/checklists';
import type { Document, RAGQuery, RAGResult, ChecklistItem, DocumentAnalysis } from '../types/rag';

class RAGService {
  private weaviateInitialized = false;

  private async initializeWeaviate() {
    if (!this.weaviateInitialized) {
      this.weaviateInitialized = await initializeWeaviateSchema();
    }
  }
  
  // Document ingestion
  async ingestDocument(file: File, metadata: Partial<Document['metadata']>): Promise<string> {
    try {
      const content = await this.extractTextFromFile(file);
      const embeddings = await embed(content);
      
      const document: Omit<Document, 'id' | 'created_at' | 'updated_at'> = {
        title: file.name,
        type: metadata.type || 'bestek',
        content,
        metadata: {
          source: file.name,
          date: new Date(),
          tags: metadata.tags || [],
          ...metadata
        },
        embeddings
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(document)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error ingesting document:', error);
      throw error;
    }
  }

  // Text extraction from various file formats
  private async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;
    
    if (fileType === 'application/pdf') {
      return this.extractFromPDF(file);
    } else if (fileType.includes('word')) {
      return this.extractFromWord(file);
    } else if (fileType === 'text/plain') {
      return file.text();
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async extractFromPDF(file: File): Promise<string> {
    // In a real implementation, you would use pdf-parse or similar
    // For now, return placeholder
    return `PDF content extracted from ${file.name}`;
  }

  private async extractFromWord(file: File): Promise<string> {
    // In a real implementation, you would use mammoth.js or similar
    // For now, return placeholder
    return `Word document content extracted from ${file.name}`;
  }

  // Semantic search
  async searchDocuments(query: RAGQuery): Promise<RAGResult[]> {
    try {
      const queryEmbeddings = await embed(query.query);
      
      // Zoek in beide databases parallel
      const [supabaseResults, weaviateResults] = await Promise.all([
        this.searchSupabase(query, queryEmbeddings),
        this.searchWeaviateDocuments(query.query, queryEmbeddings, query.max_results || 5)
      ]);
      
      // Combineer en sorteer resultaten
      const combinedResults = [...supabaseResults, ...weaviateResults];
      
      // Dedupliceer op basis van content similarity
      const deduplicatedResults = this.deduplicateResults(combinedResults);
      
      // Sorteer op relevantie en limiteer
      return deduplicatedResults
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, query.max_results || 10);
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  // Zoek in Supabase documenten
  private async searchSupabase(query: RAGQuery, queryEmbeddings: number[]): Promise<RAGResult[]> {
    try {
      
      let dbQuery = supabase
        .from('documents')
        .select('*');

      // Apply filters
      if (query.document_types?.length) {
        dbQuery = dbQuery.in('type', query.document_types);
      }

      if (query.filters?.wetsartikel) {
        dbQuery = dbQuery.eq('metadata->wetsartikel', query.filters.wetsartikel);
      }

      if (query.filters?.tags?.length) {
        dbQuery = dbQuery.overlaps('metadata->tags', query.filters.tags);
      }

      const { data: documents, error } = await dbQuery;
      if (error) throw error;

      // Bereken similarity scores
      return documents
        .map(doc => ({
          document: doc,
          relevance_score: cosineSimilarity(queryEmbeddings, doc.embeddings || []),
          matched_content: this.extractRelevantContent(doc.content, query.query),
          context: this.generateContext(doc.content, query.query)
        }));
    } catch (error) {
      console.error('Supabase search failed:', error);
      return [];
    }
  }

  // Zoek in Weaviate kennisbasis
  private async searchWeaviateDocuments(query: string, queryEmbeddings: number[], limit: number): Promise<RAGResult[]> {
    try {
      const weaviateResults = await searchWeaviate(query, queryEmbeddings, limit);
      
      return weaviateResults.map(result => ({
        document: {
          id: `weaviate-${Date.now()}-${Math.random()}`,
          title: `${result.source} - ${result.article || 'Juridische tekst'}`,
          type: 'wetgeving' as const,
          content: result.text,
          metadata: {
            source: result.source,
            date: new Date(result.date || Date.now()),
            tags: [result.category].filter(Boolean),
            wetsartikel: result.article
          },
          created_at: new Date(result.date || Date.now()),
          updated_at: new Date(result.date || Date.now())
        },
        relevance_score: result._additional?.certainty || 0.5,
        matched_content: this.extractRelevantContent(result.text, query),
        context: this.generateContext(result.text, query)
      }));
    } catch (error) {
      console.error('Weaviate search failed:', error);
      return [];
    }
  }

  // Dedupliceer resultaten op basis van content similarity
  private deduplicateResults(results: RAGResult[]): RAGResult[] {
    const deduplicated: RAGResult[] = [];
    const SIMILARITY_THRESHOLD = 0.85;
    
    for (const result of results) {
      const isDuplicate = deduplicated.some(existing => {
        const similarity = this.calculateTextSimilarity(
          result.document.content,
          existing.document.content
        );
        return similarity > SIMILARITY_THRESHOLD;
      });
      
      if (!isDuplicate) {
        deduplicated.push(result);
      }
    }
    
    return deduplicated;
  }

  // Bereken text similarity voor deduplicatie
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Eenvoudige Jaccard similarity op woord niveau
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  // Chunk en indexeer juridische teksten in Weaviate
  async indexLegalDocument(
    content: string,
    metadata: {
      source: string;
      article?: string;
      category?: string;
      date?: Date;
    }
  ): Promise<boolean> {
    try {
      await this.initializeWeaviate();
      
      const chunks = chunkText(content, 500);
      let successCount = 0;
      
      for (const chunk of chunks) {
        const vector = await embed(chunk);
        const success = await this.addChunkToWeaviate(chunk, vector, metadata);
        if (success) successCount++;
      }
      
      console.log(`Indexed ${successCount}/${chunks.length} chunks for ${metadata.source}`);
      return successCount > 0;
    } catch (error) {
      console.error('Error indexing legal document:', error);
      throw error;
    }
  }

  // Voeg chunk toe aan Weaviate
  private async addChunkToWeaviate(
    text: string,
    vector: number[],
    metadata: {
      source: string;
      article?: string;
      category?: string;
      date?: Date;
    }
  ): Promise<boolean> {
    const weaviateClient = getWeaviateClient();
    if (!weaviateClient) return false;

    try {
      await weaviateClient.data
        .creator()
        .withClassName('LawChunk')
        .withProperties({
          text,
          source: metadata.source,
          article: metadata.article || '',
          category: metadata.category || '',
          date: metadata.date?.toISOString() || new Date().toISOString()
        })
        .withVector(vector)
        .do();

      return true;
    } catch (error) {
      console.error('Failed to add chunk to Weaviate:', error);
      return false;
    }
  }

  private extractRelevantContent(content: string, query: string): string {
    // Simple keyword-based extraction (in real implementation, use more sophisticated methods)
    const sentences = content.split(/[.!?]+/);
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const relevantSentences = sentences.filter(sentence => 
      queryWords.some(word => sentence.toLowerCase().includes(word))
    );
    
    return relevantSentences.slice(0, 3).join('. ');
  }

  private generateContext(content: string, query: string): string {
    // Generate contextual information around matches
    return content.substring(0, 500) + '...';
  }

  // Checklist-driven analysis
  async analyzeDocument(documentId: string, checklistId: string): Promise<DocumentAnalysis> {
    try {
      // Haal document op uit Supabase
      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !document) {
        throw new Error('Document not found');
      }

      // Get checklist from local data
      const checklist = beschikbareChecklists.find(c => c.id === checklistId);
      if (!checklist) throw new Error('Checklist not found');

      // Analyze each checklist item
      const checklistResults = await Promise.all(
        checklist.items.map(item => this.analyzeChecklistItem(document, item))
      );

      // Calculate compliance score
      const complianceScore = this.calculateComplianceScore(checklistResults);
      const riskLevel = this.assessRiskLevel(checklistResults, complianceScore);

      const analysis: Omit<DocumentAnalysis, 'id'> = {
        document_id: documentId,
        checklist_results: checklistResults,
        compliance_score: complianceScore,
        risk_level: riskLevel,
        recommendations: this.generateRecommendations(checklistResults),
        missing_requirements: this.identifyMissingRequirements(checklistResults),
        inconsistencies: this.identifyInconsistencies(checklistResults),
        analyzed_at: new Date(),
        analyst: 'AI System',
        status: 'concept'
      };

      // Mock return for demo - in production, save to database
      return {
        id: Date.now().toString(),
        ...analysis
      };
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw error;
    }
  }

  private async analyzeChecklistItem(document: Document, item: any) {
    // Use RAG to find relevant content for this checklist item
    const searchResults = await this.searchDocuments({
      query: item.vraag,
      document_types: [document.type, 'wetgeving'], // Zoek ook in juridische kennisbasis
      max_results: 5
    });

    // Analyze if requirement is met
    const status = this.determineItemStatus(document.content, item, searchResults);
    const confidence = this.calculateConfidence(searchResults, item);
    const evidence = this.extractEvidence(document.content, item);

    return {
      checklist_item_id: item.id,
      status,
      confidence,
      evidence,
      notes: this.generateItemNotes(status, evidence, item),
      page_references: this.findPageReferences(document.content, item)
    };
  }

  private determineItemStatus(content: string, item: any, searchResults: RAGResult[]) {
    // Simplified logic - in real implementation, use more sophisticated NLP
    const keywords = item.vraag.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    const foundKeywords = keywords.filter(keyword => contentLower.includes(keyword));
    const coverage = foundKeywords.length / keywords.length;
    
    if (coverage >= 0.8) return 'aanwezig';
    if (coverage >= 0.4) return 'inconsistent';
    return 'ontbreekt';
  }

  private calculateConfidence(searchResults: RAGResult[], item: ChecklistItem): number {
    if (searchResults.length === 0) return 0.1;
    
    const avgRelevance = searchResults.reduce((sum, result) => sum + result.relevance_score, 0) / searchResults.length;
    return Math.min(avgRelevance * 100, 95);
  }

  private extractEvidence(content: string, item: any): string[] {
    // Extract sentences that contain evidence for this requirement
    const sentences = content.split(/[.!?]+/);
    const keywords = item.vraag.toLowerCase().split(/\s+/);
    
    return sentences
      .filter(sentence => 
        keywords.some(keyword => sentence.toLowerCase().includes(keyword))
      )
      .slice(0, 3);
  }

  private generateItemNotes(status: string, evidence: string[], item: any): string {
    switch (status) {
      case 'aanwezig':
        return `Vereiste is aangetroffen. Gevonden bewijs: ${evidence.length} relevante passages.`;
      case 'inconsistent':
        return `Vereiste is gedeeltelijk aangetroffen maar mogelijk inconsistent. Nadere controle vereist.`;
      case 'ontbreekt':
        return `Vereiste niet aangetroffen in document. ${item.verplicht ? 'Dit is een verplichte eis.' : 'Dit is een optionele eis.'}`;
      default:
        return 'Status onbekend.';
    }
  }

  private findPageReferences(content: string, item: any): number[] {
    // Simplified - in real implementation, track page numbers during text extraction
    return [1];
  }

  private calculateComplianceScore(results: any[]): number {
    const totalWeight = results.reduce((sum, result) => sum + (result.weight || 1), 0);
    const achievedScore = results.reduce((sum, result) => {
      const weight = result.weight || 1;
      const score = result.status === 'aanwezig' ? 1 : result.status === 'inconsistent' ? 0.5 : 0;
      return sum + (score * weight);
    }, 0);
    
    return Math.round((achievedScore / totalWeight) * 100);
  }

  private assessRiskLevel(results: any[], score: number): 'laag' | 'middel' | 'hoog' | 'kritiek' {
    const criticalMissing = results.filter(r => r.status === 'ontbreekt' && r.mandatory).length;
    
    if (criticalMissing > 2 || score < 50) return 'kritiek';
    if (criticalMissing > 0 || score < 70) return 'hoog';
    if (score < 85) return 'middel';
    return 'laag';
  }

  private generateRecommendations(results: any[]): string[] {
    const recommendations: string[] = [];
    
    const missing = results.filter(r => r.status === 'ontbreekt');
    const inconsistent = results.filter(r => r.status === 'inconsistent');
    
    if (missing.length > 0) {
      recommendations.push(`${missing.length} verplichte eisen ontbreken en moeten worden toegevoegd.`);
    }
    
    if (inconsistent.length > 0) {
      recommendations.push(`${inconsistent.length} eisen zijn inconsistent en vereisen verduidelijking.`);
    }
    
    return recommendations;
  }

  private identifyMissingRequirements(results: any[]): string[] {
    return results
      .filter(r => r.status === 'ontbreekt')
      .map(r => 'Ontbrekende vereiste geïdentificeerd');
  }

  private identifyInconsistencies(results: any[]): string[] {
    return results
      .filter(r => r.status === 'inconsistent')
      .map(r => 'Inconsistentie geïdentificeerd');
  }
}

export const ragService = new RAGService();