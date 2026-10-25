export type NavigationTab = 'reader' | 'intel' | 'project' | 'supporting' | 'exhibits' | 'defense' | 'library';
export type ChamberTab = 'simulator' | 'audio' | 'socratic';

export type SupportingDocType = 'strategy_framework' | 'excel_model' | 'teaching_note' | 'industry_data' | 'other';

export interface SupportingDocument {
  id: string;
  name: string;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'txt';
  category: SupportingDocType;
  categoryLabel: string;
  uploadDate: string;
  size: string;
  content: string; // extracted text or markdown summary
  expertAnalysis?: {
    summary: string;
    keyTakeaways: string[];
    suggestedDefensePoints: string[];
  };
  tableRows?: Array<{
    metric: string;
    col1: string;
    col2: string;
    delta: string;
    isDeltaPositive?: boolean;
    isHighlight?: boolean;
  }>;
}

export interface CloudProject {
  id: string;
  name: string;
  domain: string; // Dynamic academic course / domain
  code: string;
  instructionPrompt: string; // Custom instructions / Socratic persona prompt for this project
  description: string;
  supportingDocuments: SupportingDocument[]; // General project-wide supporting materials
  exhibits: any[]; // Project-wide exhibits & financial models
  caseIds: string[]; // Associated case/conversation IDs
  activeCaseId: string;
  createdAt: string;
}

export interface DefenseMetrics {
  decisiveness: number;
  decisivenessLabel: string;
  rigor: number;
  rigorLabel: string;
  framework: number;
  frameworkLabel: string;
  facultyNote: string;
}

export interface ExhibitRow {
  metric: string;
  modelYBerlin?: string;
  competitorValue?: string;
  col1?: string;
  col2?: string;
  delta: string;
  isDeltaPositive?: boolean;
  isHighlight?: boolean;
}

export interface SocraticMessage {
  id: string;
  sender: 'professor' | 'student' | 'analyst';
  name: string;
  role?: string;
  timestamp: string;
  text: string;
  exhibitReference?: string;
}

export interface UploadedCasePayload {
  title: string;
  course: 'Strategy' | 'Financial Accounting' | 'Operations' | 'Corporate Finance' | 'Leadership';
  caseNumber: string;
  caseText: string;
  excelFileName?: string;
  excelDataRows?: Array<{
    metric: string;
    col1: string;
    col2: string;
    delta: string;
    isDeltaPositive?: boolean;
    isHighlight?: boolean;
  }>;
  excelHeaders?: string[];
  professorName?: string;
  coldCallQuestion?: string;
}

