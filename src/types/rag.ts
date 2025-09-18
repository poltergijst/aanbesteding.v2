export interface Document {
  id: string;
  title: string;
  type: 'wetgeving' | 'jurisprudentie' | 'checklist' | 'template' | 'bestek' | 'inzending';
  content: string;
  metadata: {
    source: string;
    date: Date;
    version?: string;
    tags: string[];
    wetsartikel?: string;
    rechtbank?: string;
    uitspraakdatum?: Date;
  };
  embeddings?: number[];
  created_at: Date;
  updated_at: Date;
}

export interface ChecklistItem {
  id: string;
  category: string;
  requirement: string;
  wetsartikel?: string;
  mandatory: boolean;
  description: string;
  examples: string[];
  weight: number;
}

export interface DocumentAnalysis {
  id: string;
  document_id: string;
  checklist_results: ChecklistResult[];
  compliance_score: number;
  risk_level: 'laag' | 'middel' | 'hoog' | 'kritiek';
  recommendations: string[];
  missing_requirements: string[];
  inconsistencies: string[];
  analyzed_at: Date;
  analyst: string;
  status: 'concept' | 'reviewed' | 'approved';
}

export interface ChecklistResult {
  checklist_item_id: string;
  status: 'aanwezig' | 'ontbreekt' | 'inconsistent' | 'niet-van-toepassing';
  confidence: number;
  evidence: string[];
  notes: string;
  page_references?: number[];
}

export interface RAGQuery {
  query: string;
  document_types?: string[];
  filters?: {
    wetsartikel?: string;
    date_range?: {
      start: Date;
      end: Date;
    };
    tags?: string[];
  };
  max_results?: number;
}

export interface RAGResult {
  document: Document;
  relevance_score: number;
  matched_content: string;
  context: string;
}

export interface ComplianceMatrix {
  categories: {
    [category: string]: {
      items: ChecklistResult[];
      score: number;
      status: 'compliant' | 'non-compliant' | 'partial';
    };
  };
  overall_score: number;
  overall_status: 'compliant' | 'non-compliant' | 'requires-review';
  critical_issues: string[];
  recommendations: string[];
}