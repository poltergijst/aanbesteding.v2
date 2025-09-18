// Application constants

export const FILE_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES_PER_UPLOAD: 10,
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.txt']
} as const;

export const API_CONSTRAINTS = {
  RATE_LIMIT_REQUESTS: 5,
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds
  MAX_RETRIES: 3
} as const;

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  KVK_NUMBER: /^\d{8}$/,
  DUTCH_PHONE: /^(\+31|0)[1-9]\d{8}$/,
  POSTAL_CODE: /^\d{4}\s?[A-Z]{2}$/i
} as const;

export const TENDER_TYPES = [
  { value: 'openbaar', label: 'Openbare Procedure' },
  { value: 'niet-openbaar', label: 'Niet-openbare Procedure' },
  { value: 'concurrentiegerichte-dialoog', label: 'Concurrentiegerichte Dialoog' },
  { value: 'onderhandelingsprocedure', label: 'Onderhandelingsprocedure' }
] as const;

export const TENDER_STATUSES = [
  { value: 'voorbereiding', label: 'Voorbereiding', color: 'gray' },
  { value: 'concept', label: 'Concept', color: 'gray' },
  { value: 'gepubliceerd', label: 'Gepubliceerd', color: 'blue' },
  { value: 'actief', label: 'Actief', color: 'green' },
  { value: 'gesloten', label: 'Gesloten', color: 'yellow' },
  { value: 'in-beoordeling', label: 'In Beoordeling', color: 'orange' },
  { value: 'beoordeeld', label: 'Beoordeeld', color: 'purple' },
  { value: 'juridisch-getoetst', label: 'Juridisch Getoetst', color: 'indigo' },
  { value: 'gegund', label: 'Gegund', color: 'green' },
  { value: 'afgerond', label: 'Afgerond', color: 'emerald' }
] as const;

export const USER_ROLES = [
  { value: 'admin', label: 'Administrator', permissions: ['*'] },
  { value: 'jurist', label: 'Jurist', permissions: ['analyses', 'legal_reviews', 'documents'] },
  { value: 'procurement_officer', label: 'Inkoper', permissions: ['tenders', 'submissions', 'evaluations'] }
] as const;

export const DOCUMENT_TYPES = [
  { value: 'wetgeving', label: 'Wetgeving', category: 'legal' },
  { value: 'jurisprudentie', label: 'Jurisprudentie', category: 'legal' },
  { value: 'checklist', label: 'Checklist', category: 'template' },
  { value: 'template', label: 'Template', category: 'template' },
  { value: 'bestek', label: 'Bestek', category: 'tender' },
  { value: 'inzending', label: 'Inzending', category: 'submission' }
] as const;

export const COMPLIANCE_LEVELS = [
  { value: 'compliant', label: 'Compliant', color: 'green', icon: 'CheckCircle' },
  { value: 'niet-compliant', label: 'Niet-compliant', color: 'red', icon: 'XCircle' },
  { value: 'onduidelijk', label: 'Onduidelijk', color: 'yellow', icon: 'AlertTriangle' }
] as const;

export const RISK_LEVELS = [
  { value: 'laag', label: 'Laag', color: 'green', priority: 1 },
  { value: 'middel', label: 'Middel', color: 'yellow', priority: 2 },
  { value: 'hoog', label: 'Hoog', color: 'orange', priority: 3 },
  { value: 'kritiek', label: 'Kritiek', color: 'red', priority: 4 }
] as const;