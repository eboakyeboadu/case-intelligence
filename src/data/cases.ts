import { DefenseMetrics, ExhibitRow, SocraticMessage, SupportingDocument } from '../types.ts';

export interface CaseExhibit {
  id: string;
  title: string;
  category: string;
  description: string;
  tableHeaders?: string[];
  tableRows?: Array<{
    metric: string;
    col1: string;
    col2: string;
    delta: string;
    isDeltaPositive?: boolean;
    isHighlight?: boolean;
  }>;
  keyFinding?: string;
  defenseFindingText?: string;
  relatedFile?: string;
}

export interface CasePage {
  pageNumber: number;
  title?: string;
  header?: string;
  footer?: string;
  paragraphs: string[];
}

export interface CaseItem {
  id: string;
  projectNumber: number;
  projectName: string;
  course: string; // Dynamic academic domain or course
  caseNumber: string;
  title: string;
  subtitle: string;
  section: string;
  pagesCount: number;
  estimatedReadTime: string;
  syncedAudioTimestamp?: string;
  syncedHost?: string;
  tags: string[];
  summary: string;
  paragraphs: string[];
  pages?: CasePage[];
  hasSupportingDocuments?: boolean;
  supportingDocuments?: SupportingDocument[];
  keyDefensePassage?: {
    title: string;
    timestamp: string;
    citation: string;
    exhibitId: string;
    quote: string;
  };
  keyDefenseSnippet?: string;
  facultyPrompt?: {
    professor: string;
    role: string;
    section: string;
    prompt: string;
    defaultChallenge: string;
  };
  coldCall: {
    amphitheater: string;
    professor: string;
    context: string;
    prompt: string;
    defaultMetrics: DefenseMetrics;
    suggestedRebuttals: string[];
  };
  exhibits: CaseExhibit[];
  audioTrack?: {
    title: string;
    timeline: string;
    host1: { name: string; role: string; initials: string };
    host2: { name: string; role: string; initials: string };
    dialogue: Array<{
      speaker: string;
      time: string;
      text: string;
      isHighlight?: boolean;
    }>;
  };
  projectId?: string;
  originalFileUrl?: string;
  originalFileName?: string;
  originalFileType?: 'pdf' | 'docx' | 'txt' | 'md';
  uploadedFiles?: Array<{
    name: string;
    size: string;
    type: 'case_doc' | 'excel_model' | 'teaching_note';
    uploadDate: string;
  }>;
}

export const SAMPLE_CASES: CaseItem[] = [
  {
    id: 'case-demo-001',
    projectId: 'proj-strategy',
    projectNumber: 1,
    projectName: 'Case Project 1: Meridian Mobility',
    course: 'Strategy',
    caseNumber: 'DEMO CASE #001',
    title: 'Meridian Mobility: Pricing the São Paulo Expansion',
    subtitle: 'Sec. I • Unit Economics & Competitive Entry',
    section: 'SEC. I',
    hasSupportingDocuments: true,
    supportingDocuments: [],
    pagesCount: 3,
    estimatedReadTime: '12 MIN ESTIMATED READ',
    syncedHost: 'Host Riley',
    syncedAudioTimestamp: '03:10',
    tags: ['Mobility', 'Pricing', 'Market Entry', 'Unit Economics'],
    summary: 'Sample analysis of Meridian Mobility, an e-bike sharing startup deciding how to price and sequence its entry into São Paulo against an entrenched local incumbent.',
    paragraphs: [
      'By early 2025, Meridian Mobility had reached breakeven contribution margin in its two launch cities, and the founding team faced pressure from its seed investors to prove the model could travel. São Paulo was the obvious next market: dense, congested, and underserved by affordable last-mile transit. It was also home to VoltRide, a local incumbent with 40,000 deployed bikes and an exclusive advertising partnership with the metro authority.',
      'Meridian’s advantage was operational, not technological. Its swappable-battery system cut rebalancing cost per bike to $1.10, roughly half of VoltRide’s reported figure, and its dynamic pricing engine had lifted revenue per ride 18% in its second city. The question was whether those margins would survive a market where the incumbent could subsidize rides for a year.',
      'The board asked for a recommendation on two options: a premium launch targeting business districts at $0.42 per minute, or a penetration launch at $0.29 per minute with a commuter subscription. Each option implied a different fleet size, a different payback period, and a different answer to the same question: how much margin are you willing to burn to learn?'
    ],
    pages: [
      {
        pageNumber: 1,
        header: 'SAMPLE CASE • DEMO-001 • STRATEGY & MARKET ENTRY',
        footer: 'Page 1 of 3 • Sample case created for demonstration. No real company data.',
        paragraphs: [
          'By early 2025, Meridian Mobility had reached breakeven contribution margin in its two launch cities, and the founding team faced pressure from its seed investors to prove the model could travel. São Paulo was the obvious next market: dense, congested, and underserved by affordable last-mile transit.',
          'It was also home to VoltRide, a local incumbent with 40,000 deployed bikes and an exclusive advertising partnership with the metro authority.'
        ]
      },
      {
        pageNumber: 2,
        header: 'SAMPLE CASE • DEMO-001 • STRATEGY & MARKET ENTRY',
        footer: 'Page 2 of 3 • Sample case created for demonstration. No real company data.',
        paragraphs: [
          'Meridian’s advantage was operational, not technological. Its swappable-battery system cut rebalancing cost per bike to $1.10, roughly half of VoltRide’s reported figure, and its dynamic pricing engine had lifted revenue per ride 18% in its second city.'
        ]
      },
      {
        pageNumber: 3,
        header: 'SAMPLE CASE • DEMO-001 • STRATEGY & MARKET ENTRY',
        footer: 'Page 3 of 3 • Sample case created for demonstration. No real company data.',
        paragraphs: [
          'The board asked for a recommendation on two options: a premium launch targeting business districts at $0.42 per minute, or a penetration launch at $0.29 per minute with a commuter subscription.'
        ]
      }
    ],
    keyDefensePassage: {
      title: 'Rebalancing cost advantage',
      timestamp: '02:14',
      citation: 'Page 2, Paragraph 1',
      exhibitId: 'exhibit1',
      quote: 'Its swappable-battery system cut rebalancing cost per bike to $1.10, roughly half of VoltRide’s reported figure.'
    },
    keyDefenseSnippet: 'Cite the $1.10 rebalancing cost advantage as the foundation of the pricing defense.',
    facultyPrompt: {
      professor: 'Prof. A. Whitfield',
      role: 'Strategy Faculty (sample)',
      section: 'SEC. I',
      prompt: 'You are a Socratic strategy professor. Push the student to defend whether an operational cost advantage is durable when the incumbent can cross-subsidize.',
      defaultChallenge: 'Your entire pricing defense rests on a $1.10 rebalancing cost. What happens to that advantage when VoltRide copies the swappable-battery design within eighteen months?'
    },
    coldCall: {
      amphitheater: 'Main Amphitheater • Row C',
      professor: 'Professor Whitfield',
      context: 'The class is waiting. Defend your market-entry pricing before the podium timer expires.',
      prompt: '“Given Exhibit 1’s contribution margins, defend the penetration price of $0.29 per minute against an incumbent that can subsidize rides for a year. Do you anchor on cost advantage or switch to differentiation?”',
      defaultMetrics: {
        decisiveness: 86,
        decisivenessLabel: 'Clear Stance',
        rigor: 90,
        rigorLabel: 'Ex. 1 Cited',
        framework: 80,
        frameworkLabel: 'Testable',
        facultyNote: 'Faculty note: Anchor your defense in the rebalancing cost gap before discussing pricing tiers.'
      },
      suggestedRebuttals: [
        'Cite $1.10 rebalancing gap',
        'Quantify subscription lock-in',
        'Challenge incumbent subsidy endurance'
      ]
    },
    exhibits: [
      {
        id: 'exhibit1',
        title: 'Exhibit 1: Contribution Margin per Ride (Sample)',
        category: 'Financial Model',
        description: 'Sample per-ride unit economics for Meridian versus VoltRide under both pricing options.',
        tableHeaders: ['METRIC ($ / RIDE)', 'MERIDIAN @ $0.29', 'MERIDIAN @ $0.42', 'VOLTRIDE'],
        tableRows: [
          { metric: 'Revenue per ride', col1: '$2.35', col2: '$3.40', delta: 'Voltride $3.05', isDeltaPositive: true },
          { metric: 'Rebalancing cost', col1: '$1.10', col2: '$1.10', delta: 'Voltride $2.20', isDeltaPositive: true, isHighlight: true },
          { metric: 'Other variable cost', col1: '$0.75', col2: '$0.75', delta: 'Voltride $0.70', isDeltaPositive: false },
          { metric: 'Contribution margin', col1: '$0.50', col2: '$1.55', delta: 'Voltride $0.15', isDeltaPositive: true, isHighlight: true }
        ],
        keyFinding: 'PENETRATION PRICE STILL CLEARS INCUMBENT MARGIN 3:1',
        defenseFindingText: 'Cite Exhibit 1 contribution margin of $0.50 vs VoltRide $0.15 at penetration pricing'
      },
      {
        id: 'exhibit2',
        title: 'Exhibit 2: Fleet Payback Scenarios (Sample)',
        category: 'Scenario Analysis',
        description: 'Sample payback period for a 5,000-bike pilot fleet under three ridership adoption curves.',
        keyFinding: 'PAYBACK STRETCHES FROM 14 TO 31 MONTHS IF ADOPTION MISSES BY 25%',
        defenseFindingText: 'Cite Exhibit 2 payback sensitivity to adoption shortfall'
      }
    ],
    audioTrack: {
      title: 'Case Discussion Synthesis: Segment I',
      timeline: '03:10 / 22:00',
      host1: { name: 'Riley Park', role: 'Mobility Analyst (sample)', initials: 'RP' },
      host2: { name: 'Jordan Ellis', role: 'Strategy Fellow (sample)', initials: 'JE' },
      dialogue: [
        { speaker: 'Riley Park', time: '03:05', text: '“The whole case turns on whether the rebalancing gap survives contact with a well-funded incumbent.”' },
        { speaker: 'Jordan Ellis', time: '03:10', text: '“Exactly. Cost advantages in hardware get copied; the subscription book is what compounds.”', isHighlight: true }
      ]
    },
    uploadedFiles: [
      { name: 'Demo_Case_Meridian_Mobility.pdf', size: '1.1 MB', type: 'case_doc', uploadDate: 'Oct 1, 2026' }
    ]
  },
  {
    id: 'case-demo-002',
    projectId: 'proj-operations',
    projectNumber: 2,
    projectName: 'Case Project 2: Northstar Foods',
    course: 'Operations',
    caseNumber: 'DEMO CASE #002',
    title: 'Northstar Foods: The Toledo Plant Bottleneck',
    subtitle: 'Sec. II • Throughput, Changeovers & Working Capital',
    section: 'SEC. II',
    hasSupportingDocuments: false,
    supportingDocuments: [],
    pagesCount: 2,
    estimatedReadTime: '10 MIN ESTIMATED READ',
    syncedHost: 'Host Sam',
    syncedAudioTimestamp: '01:45',
    tags: ['Operations', 'Bottleneck', 'Changeover', 'Inventory'],
    summary: 'Sample operations case: Northstar Foods must relieve a packaging-line bottleneck at its Toledo plant without missing the holiday retail window.',
    paragraphs: [
      'Northstar Foods, a sample mid-sized packaged foods company, entered the third quarter with orders running 22% ahead of plan and a packaging line at its Toledo plant already at 96% utilization. Every SKU shared the same line, and changeovers between formats consumed 70 minutes each.',
      'The operations director modeled three options: cut changeover time with a quick-change tooling kit ($180,000, six-week install), add a weekend shift (12% wage premium, immediate), or outsource overflow to a co-packer (18% cost penalty on outsourced volume, plus freight). Each option had a different effect on inventory, and the treasury team reminded her that every day of extra finished goods tied up $95,000 in working capital.',
      'The holiday retail window was eleven weeks away. Whatever she chose had to be defensible on throughput math, not intuition.'
    ],
    pages: [
      {
        pageNumber: 1,
        header: 'SAMPLE CASE • DEMO-002 • OPERATIONS & THROUGHPUT',
        footer: 'Page 1 of 2 • Sample case created for demonstration. No real company data.',
        paragraphs: [
          'Northstar Foods, a sample mid-sized packaged foods company, entered the third quarter with orders running 22% ahead of plan and a packaging line at its Toledo plant already at 96% utilization.'
        ]
      },
      {
        pageNumber: 2,
        header: 'SAMPLE CASE • DEMO-002 • OPERATIONS & THROUGHPUT',
        footer: 'Page 2 of 2 • Sample case created for demonstration. No real company data.',
        paragraphs: [
          'The holiday retail window was eleven weeks away. Whatever she chose had to be defensible on throughput math, not intuition.'
        ]
      }
    ],
    keyDefensePassage: {
      title: 'Changeover time cost',
      timestamp: '01:12',
      citation: 'Page 1, Paragraph 1',
      exhibitId: 'exhibit1',
      quote: 'Every SKU shared the same line, and changeovers between formats consumed 70 minutes each.'
    },
    keyDefenseSnippet: 'Open with the 70-minute changeover as the true bottleneck lever.',
    facultyPrompt: {
      professor: 'Prof. M. Reyes',
      role: 'Operations Faculty (sample)',
      section: 'SEC. II',
      prompt: 'You are a Socratic operations professor. Force the student to quantify the bottleneck before accepting any capital proposal.',
      defaultChallenge: 'You propose the tooling kit. Show me the changeover math: how many weekly changeovers, at 70 minutes each, and what does the recovered capacity actually buy you in units?'
    },
    coldCall: {
      amphitheater: 'Main Amphitheater • Row B',
      professor: 'Professor Reyes',
      context: 'The class is waiting. Defend your bottleneck recommendation before the podium timer expires.',
      prompt: '“Eleven weeks to the retail window. Defend your choice: tooling kit, weekend shift, or co-packer. And show me the throughput math, not the narrative.”',
      defaultMetrics: {
        decisiveness: 84,
        decisivenessLabel: 'Clear Stance',
        rigor: 88,
        rigorLabel: 'Math Cited',
        framework: 82,
        frameworkLabel: 'Testable',
        facultyNote: 'Faculty note: Quantify recovered changeover hours before comparing the three options.'
      },
      suggestedRebuttals: [
        'Compute weekly changeover hours',
        'Compare cost per recovered unit',
        'Stress-test the 11-week install window'
      ]
    },
    exhibits: [
      {
        id: 'exhibit1',
        title: 'Exhibit 1: Weekly Capacity Math (Sample)',
        category: 'Operations Model',
        description: 'Sample line-capacity breakdown showing changeover drag on weekly throughput.',
        tableHeaders: ['METRIC', 'CURRENT', 'WITH TOOLING KIT', 'DELTA'],
        tableRows: [
          { metric: 'Changeovers / week', col1: '18', col2: '18', delta: '—', isDeltaPositive: true },
          { metric: 'Minutes per changeover', col1: '70', col2: '25', delta: '-64%', isDeltaPositive: true, isHighlight: true },
          { metric: 'Lost production hrs / week', col1: '21.0', col2: '7.5', delta: '+13.5 hrs recovered', isDeltaPositive: true, isHighlight: true },
          { metric: 'Effective utilization', col1: '96%', col2: '82%', delta: 'Headroom restored', isDeltaPositive: true }
        ],
        keyFinding: 'TOOLING KIT RECOVERS 13.5 PRODUCTION HOURS WEEKLY',
        defenseFindingText: 'Cite Exhibit 1 recovery of 13.5 weekly production hours from changeover reduction'
      }
    ],
    audioTrack: {
      title: 'Case Discussion Synthesis: Segment II',
      timeline: '01:45 / 18:30',
      host1: { name: 'Sam Delgado', role: 'Operations Analyst (sample)', initials: 'SD' },
      host2: { name: 'Casey Lin', role: 'Supply Chain Fellow (sample)', initials: 'CL' },
      dialogue: [
        { speaker: 'Sam Delgado', time: '01:40', text: '“Everyone wants the co-packer until they price the working capital.”' },
        { speaker: 'Casey Lin', time: '01:45', text: '“Right. $95,000 a day of extra inventory changes what ‘cheap’ means.”', isHighlight: true }
      ]
    },
    uploadedFiles: [
      { name: 'Demo_Case_Northstar_Foods.pdf', size: '940 KB', type: 'case_doc', uploadDate: 'Oct 3, 2026' }
    ]
  }
];

export const INITIAL_CASES: CaseItem[] = [];
export const DEFAULT_FALLBACK_CASE: CaseItem = SAMPLE_CASES[0];
