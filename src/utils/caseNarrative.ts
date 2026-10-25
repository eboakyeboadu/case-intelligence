import { CaseItem } from '../data/cases.ts';
import { paginateText } from './documentParser.ts';

export interface CaseNarrativeUnit {
  id: string;
  type: 'title' | 'quote' | 'heading' | 'paragraph';
  text: string; // The natural text spoken by the TTS engine
  displayText: string; // The formatted text displayed on screen
  pageNumber: number;
  label: string;
  estimatedSeconds?: number;
}

// Regex patterns to detect unwanted headers, footers, copyrights, and prep metadata
const UNWANTED_PATTERNS = [
  /copyright\s*©/i,
  /copyright\s*\(c\)/i,
  /all\s*rights\s*reserved/i,
  /to\s*order\s*copies\s*or\s*request\s*permission/i,
  /harvard\s*business\s*school\s*publishing/i,
  /harvard\s*business\s*school\s*case/i,
  /authorized\s*for\s*use\s*only/i,
  /strictly\s*for\s*educational\s*use/i,
  /strictly\s*confidential/i,
  /educational\s*material/i,
  /academic\s*case\s*record/i,
  /this\s*case\s*was\s*prepared\s*by/i,
  /prepared\s*by\s*professor/i,
  /author:\s*faculty\s*case/i,
  /written\s*by\s*professor/i,
  /to\s*reproduce\s*materials,\s*call/i,
  /boston,\s*ma\s*02163/i,
  /^page\s*\d+(\s*of\s*\d+)?$/i,
  /^rev(\.|\:)\s*[a-z]+\s*\d{4}/i,
  /^case\s*number\s*[\w\-]+/i,
];

// Determine if a text paragraph is unwanted header/footer/metadata
export function isMetadataOrCopyright(text: string): boolean {
  if (!text || text.trim().length === 0) return true;
  const trimmed = text.trim();

  // Purely empty or trivially short non-sentences
  if (trimmed.length < 5) return true;

  for (const pattern of UNWANTED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  return false;
}

// Clean text for speech synthesis: strips out remaining page numbers, footnote markers
export function cleanSpokenNarrativeText(text: string): string {
  return text
    .replace(/\[\d+\]/g, '') // remove bracket citations [1], [2]
    .replace(/\bPage\s+\d+(\s+of\s+\d+)?\b/gi, '') // remove stray inline "Page 1 of 4"
    .replace(/https?:\/\/\S+/g, '') // remove raw URLs
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts the smart reading units for the case in the exact order requested:
 * 1. Case Title & Subtitle
 * 2. Key Defense Quote (if present)
 * 3. Page by page: Section Heading -> Substantive Paragraphs
 * 
 * Completely filters out headers, footers, copyright, and author preparation notices.
 */
export function getSmartCaseReadingUnits(caseItem: CaseItem): CaseNarrativeUnit[] {
  if (!caseItem) return [];

  const units: CaseNarrativeUnit[] = [];

  // 1. Case Title
  const spokenTitle = caseItem.subtitle
    ? `${caseItem.title}. ${caseItem.subtitle}.`
    : `${caseItem.title}.`;

  const cleanTitle = cleanSpokenNarrativeText(spokenTitle);
  if (cleanTitle) {
    units.push({
      id: `title-${caseItem.id}`,
      type: 'title',
      text: cleanTitle,
      displayText: caseItem.title,
      pageNumber: 1,
      label: 'Case Title',
      estimatedSeconds: Math.max(2, Math.round((cleanTitle.split(/\s+/).length / 140) * 60)),
    });
  }

  // 2. Opening Quote / Key Defense Passage (if available)
  if (caseItem.keyDefenseSnippet && caseItem.keyDefenseSnippet.trim().length > 10) {
    const cleanQuote = cleanSpokenNarrativeText(caseItem.keyDefenseSnippet);
    units.push({
      id: `quote-${caseItem.id}`,
      type: 'quote',
      text: `Key Case Quote: "${cleanQuote}"`,
      displayText: `"${caseItem.keyDefenseSnippet.trim()}"`,
      pageNumber: 1,
      label: 'Opening Key Quote',
      estimatedSeconds: Math.max(3, Math.round((cleanQuote.split(/\s+/).length / 140) * 60)),
    });
  }

  // 3. Extract substantive pages
  let pages = caseItem.pages;
  if (!pages || pages.length === 0) {
    const fullText = (caseItem.paragraphs || []).join('\n\n');
    if (fullText.trim().length > 0) {
      pages = paginateText(fullText, undefined, caseItem.title);
    }
  }

  // Process page by page
  if (pages && pages.length > 0) {
    pages.forEach((page, pageIdx) => {
      const pageNum = page.pageNumber || pageIdx + 1;

      // Section Heading (if meaningful, not boilerplate, and not a repetition of the case title or page number)
      const isTitleRepeated =
        page.title &&
        (page.title.trim().toLowerCase() === caseItem.title.trim().toLowerCase() ||
          page.title.toLowerCase().includes(caseItem.title.toLowerCase()) ||
          /^page\s*\d+(\s*:\s*.+)?$/i.test(page.title.trim()));

      if (
        page.title &&
        page.title.trim().length > 0 &&
        !isMetadataOrCopyright(page.title) &&
        !isTitleRepeated
      ) {
        const cleanHeading = cleanSpokenNarrativeText(page.title);
        if (cleanHeading.length > 0) {
          const wordCount = cleanHeading.split(/\s+/).filter(Boolean).length;
          units.push({
            id: `heading-p${pageNum}-${pageIdx}`,
            type: 'heading',
            text: cleanHeading,
            displayText: page.title.trim(),
            pageNumber: pageNum,
            label: `Section Heading (Page ${pageNum})`,
            estimatedSeconds: Math.max(2, Math.ceil(wordCount / 2.25)),
          });
        }
      }

      // Substantive Paragraphs on this page
      let validParaCount = 0;
      (page.paragraphs || []).forEach((rawPara, pIdx) => {
        if (isMetadataOrCopyright(rawPara)) {
          return; // Skip unwanted headers, footers, copyrights, and prep notes
        }

        const cleanText = cleanSpokenNarrativeText(rawPara);
        if (cleanText.length < 10) {
          return; // Skip non-substantive lines
        }

        validParaCount++;
        units.push({
          id: `para-p${pageNum}-${pIdx}`,
          type: 'paragraph',
          text: cleanText,
          displayText: rawPara.trim(),
          pageNumber: pageNum,
          label: `Page ${pageNum}, Paragraph ${validParaCount}`,
          estimatedSeconds: Math.max(3, Math.round((cleanText.split(/\s+/).length / 140) * 60)),
        });
      });
    });
  }

  // 4. Safety net: If only title/quote were added, but paragraphs exist in caseItem, add them
  const hasBodyParas = units.some((u) => u.type === 'paragraph');
  if (!hasBodyParas && caseItem.paragraphs && caseItem.paragraphs.length > 0) {
    caseItem.paragraphs.forEach((rawPara, idx) => {
      if (isMetadataOrCopyright(rawPara)) return;
      const cleanText = cleanSpokenNarrativeText(rawPara);
      if (cleanText.length < 10) return;

      units.push({
        id: `para-fallback-${idx}`,
        type: 'paragraph',
        text: cleanText,
        displayText: rawPara.trim(),
        pageNumber: 1,
        label: `Paragraph ${idx + 1}`,
        estimatedSeconds: Math.max(3, Math.round((cleanText.split(/\s+/).length / 140) * 60)),
      });
    });
  }

  // 5. Fallback to case summary if still empty
  if (units.length <= 1 && caseItem.summary && caseItem.summary.trim().length > 15) {
    const cleanSummary = cleanSpokenNarrativeText(caseItem.summary);
    units.push({
      id: `summary-${caseItem.id}`,
      type: 'paragraph',
      text: cleanSummary,
      displayText: caseItem.summary,
      pageNumber: 1,
      label: 'Executive Summary',
      estimatedSeconds: Math.max(3, Math.round((cleanSummary.split(/\s+/).length / 140) * 60)),
    });
  }

  return units;
}

/**
 * Calculates the exact total estimated seconds for the case speech playback.
 */
export function getTotalCaseDuration(units: CaseNarrativeUnit[]): number {
  if (!units || units.length === 0) return 0;
  return units.reduce((acc, u) => acc + (u.estimatedSeconds || 3), 0);
}

/**
 * Returns the cumulative second offset at the beginning of a given unit index.
 */
export function getSecondOffsetForUnit(units: CaseNarrativeUnit[], unitIndex: number): number {
  if (!units || units.length === 0 || unitIndex <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < Math.min(unitIndex, units.length); i++) {
    sum += units[i].estimatedSeconds || 3;
  }
  return sum;
}

/**
 * Given elapsed seconds, returns the active unit index.
 */
export function getUnitIndexForSecond(units: CaseNarrativeUnit[], elapsedSeconds: number): number {
  if (!units || units.length === 0 || elapsedSeconds <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < units.length; i++) {
    sum += units[i].estimatedSeconds || 3;
    if (elapsedSeconds < sum) {
      return i;
    }
  }
  return units.length - 1;
}


