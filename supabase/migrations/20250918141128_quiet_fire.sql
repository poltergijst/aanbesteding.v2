/*
  # Create database indexes for performance

  1. Performance Indexes
    - Organizations: name, type, is_active
    - Profiles: email, role, organization_id, is_active
    - Tenders: organization_id, status, closing_date
    - Documents: type, tender_id, created_at
    - Submissions: tender_id, status, submission_date
    - Evaluations: submission_id, evaluator_id
    - Legal Reviews: tender_id, reviewer_id, compliance_status
    - Document Analyses: document_id, status, analyzed_at
    - Audit Logs: user_id, action, created_at
*/

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- Profiles indexes  
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);

-- Tenders indexes
CREATE INDEX IF NOT EXISTS idx_tenders_organization ON tenders(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_closing_date ON tenders(closing_date);
CREATE INDEX IF NOT EXISTS idx_tenders_created_by ON tenders(created_by);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_tender ON documents(tender_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_tender ON submissions(tender_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_date ON submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_submissions_company ON submissions(company_name);

-- Evaluations indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_submission ON evaluations(submission_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(evaluation_date);

-- Legal Reviews indexes
CREATE INDEX IF NOT EXISTS idx_legal_reviews_tender ON legal_reviews(tender_id);
CREATE INDEX IF NOT EXISTS idx_legal_reviews_reviewer ON legal_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_legal_reviews_status ON legal_reviews(compliance_status);
CREATE INDEX IF NOT EXISTS idx_legal_reviews_date ON legal_reviews(review_date);

-- Document Analyses indexes
CREATE INDEX IF NOT EXISTS idx_document_analyses_document ON document_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_checklist ON document_analyses(checklist_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_status ON document_analyses(status);
CREATE INDEX IF NOT EXISTS idx_document_analyses_date ON document_analyses(analyzed_at);

-- Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tenders_org_status ON tenders(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_org_role ON profiles(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_documents_tender_type ON documents(tender_id, type);
CREATE INDEX IF NOT EXISTS idx_submissions_tender_status ON submissions(tender_id, status);