import { CloudProject, SupportingDocument } from '../types.ts';
import { CaseExhibit } from './cases.ts';

export const DEFAULT_STRATEGY_DOCS: SupportingDocument[] = [];
export const DEFAULT_STRATEGY_EXHIBITS: CaseExhibit[] = [];

// Strictly empty by default: no pre-populated mock projects or courses unless created/uploaded by user
export const DEFAULT_PROJECTS: CloudProject[] = [];

export interface CourseDomainSuggestion {
  domain: string;
  codePrefix: string;
  defaultPrompt: string;
  description: string;
}

export const SUGGESTED_COURSE_DOMAINS: CourseDomainSuggestion[] = [
  {
    domain: 'Strategy & Competitive Advantage',
    codePrefix: 'STRAT',
    defaultPrompt: 'You are a distinguished Socratic Strategy Professor. Demand empirical data on unit margins, sustainable competitive advantages, and economic moats. Challenge superficial claims and test defensibility against aggressive rival retaliation.',
    description: 'Competitive positioning, unit economics, barriers to entry, and industry cost curves.',
  },
  {
    domain: 'Corporate Finance & Valuation',
    codePrefix: 'FIN',
    defaultPrompt: 'You are a rigorous Corporate Finance and Valuation Faculty Chair. Challenge capital structure, WACC calculations, DCF sensitivities, and return on invested capital hurdle rates.',
    description: 'Valuation models, debt covenants, capital structure, and M&A transaction mechanics.',
  },
  {
    domain: 'Operations & Supply Chain',
    codePrefix: 'OPS',
    defaultPrompt: 'You are an Operations Management Faculty Leader. Interrogate process bottlenecks, Little\'s Law, inventory carrying tradeoffs, and capacity utilization constraints.',
    description: 'Process throughput, bottleneck discovery, WIP inventory, and supply chain resilience.',
  },
  {
    domain: 'Marketing & Customer Acquisition',
    codePrefix: 'MKTG',
    defaultPrompt: 'You are a Senior Marketing Strategy Professor. Probe customer acquisition costs (CAC), lifetime value (LTV), brand elasticity, segmentation rigor, and distribution channel leverage.',
    description: 'Customer segmentation, pricing elasticity, go-to-market channels, and unit LTV/CAC.',
  },
  {
    domain: 'Organizational Behavior & Leadership',
    codePrefix: 'LEAD',
    defaultPrompt: 'You are an Organizational Dynamics and Executive Leadership Professor. Evaluate executive coalition building, incentive alignment, change management friction, and ethical dilemmas.',
    description: 'Executive decision-making, organizational structure, culture, and incentive alignment.',
  },
  {
    domain: 'Technology & AI Strategy',
    codePrefix: 'TECH',
    defaultPrompt: 'You are a Technology and Innovation Management Professor. Scrutinize network effects, architectural lock-in, platform commoditization, and compute infrastructure economics.',
    description: 'Platform dynamics, technology inflection curves, AI unit economics, and ecosystem lock-in.',
  },
  {
    domain: 'Healthcare & Life Sciences',
    codePrefix: 'HLTH',
    defaultPrompt: 'You are a Healthcare Systems and Pharmaceutical Economics Faculty Chair. Probe reimbursement structures, FDA trial pathway costs, patent cliffs, and clinical value economics.',
    description: 'Clinical trials, regulatory approval pathways, payer reimbursement, and healthcare delivery.',
  },
  {
    domain: 'Entrepreneurship & New Ventures',
    codePrefix: 'VENT',
    defaultPrompt: 'You are an Entrepreneurial Management Professor and Venture Partner. Grill the founders on cash runway, unit economics, product-market fit metrics, and founder dilution.',
    description: 'Seed-to-scale venture economics, runway preservation, and go-to-market validation.',
  },
  {
    domain: 'Economics & Public Policy',
    codePrefix: 'ECON',
    defaultPrompt: 'You are an Applied Economics and Antitrust Regulation Professor. Test elasticity assumptions, deadweight losses, regulatory compliance exposure, and market externalities.',
    description: 'Market externalities, regulatory risk, antitrust scrutiny, and macroeconomic policy.',
  },
];

