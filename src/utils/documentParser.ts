// Document Parser supporting PDF, Word, TXT, Markdown, and text segmentation into pages
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker using Vite's URL resolution
try {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
} catch (e) {
  console.warn('PDF.js worker URL setup note:', e);
}

export interface ParsedCaseDocument {
  title: string;
  pages: Array<{
    pageNumber: number;
    title?: string;
    header?: string;
    footer?: string;
    paragraphs: string[];
    wordCount: number;
  }>;
  totalWords: number;
  rawText: string;
}

// Clean and normalize text into natural paragraphs
export function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 15);
}

// Helper to detect if a line looks like a header
function isLikelyHeader(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    (lower.includes('case') || lower.includes('harvard') || lower.includes('school') || lower.includes('university') || lower.includes('review') || lower.includes('journal')) &&
    line.length < 120
  );
}

// Helper to detect if a line looks like a footer
function isLikelyFooter(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    (lower.includes('copyright') || lower.includes('page ') || lower.includes('all rights reserved') || lower.includes('strictly for educational') || lower.includes('confidential')) &&
    line.length < 140
  );
}

// Helper to detect if a line looks like a section heading
function isLikelyHeading(line: string): boolean {
  if (line.length > 90) return false;
  const trimmed = line.trim();
  // Starts with Roman numeral, Section, Chapter, Part, or #
  if (/^(\b[IVXLCDM]+\.|\bSection\b|\bChapter\b|\bPart\b|#+\s)/i.test(trimmed)) return true;
  // Short uppercase or title-case without trailing punctuation
  if (trimmed.length < 60 && !/[.!?;,]$/.test(trimmed) && trimmed === trimmed.toUpperCase()) return true;
  return false;
}

// Structure raw paragraphs into clear header, section heading, paragraphs, and footer
function structurePageContent(rawParas: string[], pageNum: number, docTitle: string) {
  let header = '';
  let footer = '';
  let title = '';
  const bodyParas: string[] = [];

  for (let i = 0; i < rawParas.length; i++) {
    const p = rawParas[i];
    if (i === 0 && isLikelyHeader(p)) {
      header = p;
    } else if (i === rawParas.length - 1 && isLikelyFooter(p)) {
      footer = p;
    } else if (!title && isLikelyHeading(p)) {
      title = p.replace(/^#+\s*/, '');
    } else {
      bodyParas.push(p);
    }
  }

  // Ensure default academic fallbacks if not explicitly found
  if (!header) {
    header = `ACADEMIC CASE RECORD • ${docTitle.toUpperCase().slice(0, 45)} • PAGE ${pageNum}`;
  }
  if (!footer) {
    footer = `Page ${pageNum} • Educational Case Material • Authorized for Academic Study`;
  }
  if (!title) {
    title = `Section ${pageNum}: Analytical Overview & Narrative`;
  }

  return {
    title,
    header,
    footer,
    paragraphs: bodyParas.length > 0 ? bodyParas : (rawParas.length > 0 ? rawParas : ['No text content found on this page.']),
  };
}

// Split full text into logical pages (~350 words per page if no explicit page breaks)
export function paginateText(text: string, explicitPages?: string[], docTitle: string = 'Case Study Document'): ParsedCaseDocument['pages'] {
  if (explicitPages && explicitPages.length > 0) {
    return explicitPages.map((pageText, idx) => {
      const rawParas = splitIntoParagraphs(pageText);
      const structured = structurePageContent(rawParas, idx + 1, docTitle);
      const words = pageText.split(/\s+/).filter(Boolean).length;
      return {
        pageNumber: idx + 1,
        title: structured.title,
        header: structured.header,
        footer: structured.footer,
        paragraphs: structured.paragraphs,
        wordCount: words,
      };
    });
  }

  // Check if text has form-feed characters (\f) or standard page indicators (e.g. "Page 1", "---")
  if (text.includes('\f')) {
    const rawPages = text.split('\f').filter((p) => p.trim().length > 0);
    return rawPages.map((pageText, idx) => {
      const rawParas = splitIntoParagraphs(pageText);
      const structured = structurePageContent(rawParas, idx + 1, docTitle);
      return {
        pageNumber: idx + 1,
        title: structured.title,
        header: structured.header,
        footer: structured.footer,
        paragraphs: structured.paragraphs,
        wordCount: pageText.split(/\s+/).filter(Boolean).length,
      };
    });
  }

  // Otherwise paginate by ~300-400 words per page
  const rawParagraphs = splitIntoParagraphs(text);
  if (rawParagraphs.length === 0) {
    return [
      {
        pageNumber: 1,
        title: 'Section 1: Case Overview',
        header: `ACADEMIC CASE RECORD • ${docTitle.toUpperCase().slice(0, 45)} • PAGE 1`,
        footer: 'Page 1 • Educational Case Material',
        paragraphs: [text.trim() || 'No text content available in document.'],
        wordCount: text.split(/\s+/).filter(Boolean).length,
      },
    ];
  }

  const pages: ParsedCaseDocument['pages'] = [];
  let currentPageParas: string[] = [];
  let currentWordCount = 0;
  let pageNum = 1;

  for (const para of rawParagraphs) {
    const paraWords = para.split(/\s+/).filter(Boolean).length;
    if (currentWordCount + paraWords > 380 && currentPageParas.length > 0) {
      const structured = structurePageContent(currentPageParas, pageNum, docTitle);
      pages.push({
        pageNumber: pageNum,
        title: structured.title,
        header: structured.header,
        footer: structured.footer,
        paragraphs: structured.paragraphs,
        wordCount: currentWordCount,
      });
      pageNum++;
      currentPageParas = [para];
      currentWordCount = paraWords;
    } else {
      currentPageParas.push(para);
      currentWordCount += paraWords;
    }
  }

  if (currentPageParas.length > 0) {
    const structured = structurePageContent(currentPageParas, pageNum, docTitle);
    pages.push({
      pageNumber: pageNum,
      title: structured.title,
      header: structured.header,
      footer: structured.footer,
      paragraphs: structured.paragraphs,
      wordCount: currentWordCount,
    });
  }

  return pages;
}

// Fallback binary text stream extractor for PDFs
function extractTextFromBinaryPdf(buffer: ArrayBuffer): { pages: string[]; rawText: string } {
  try {
    const uint8 = new Uint8Array(buffer);
    let binaryStr = '';
    const chunk = 8192;
    for (let i = 0; i < uint8.length; i += chunk) {
      binaryStr += String.fromCharCode.apply(null, Array.from(uint8.subarray(i, i + chunk)));
    }

    // Extract text blocks inside BT ... ET (Begin Text ... End Text)
    const textBlocks: string[] = [];
    const btRegex = /BT([\s\S]*?)ET/g;
    let match: RegExpExecArray | null;

    while ((match = btRegex.exec(binaryStr)) !== null) {
      const blockContent = match[1];
      // Match (text) Tj or [(text)] TJ
      const strMatches = blockContent.match(/\(([^)]+)\)\s*Tj/g) || [];
      const tjMatches = blockContent.match(/\[(.*?)\]\s*TJ/g) || [];

      const extractedWords: string[] = [];
      for (const m of strMatches) {
        const cleaned = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').trim();
        if (cleaned.length > 0) extractedWords.push(cleaned);
      }
      for (const m of tjMatches) {
        const inner = m.match(/\(([^)]+)\)/g) || [];
        for (const word of inner) {
          const cleaned = word.replace(/[()]/g, '').trim();
          if (cleaned.length > 0) extractedWords.push(cleaned);
        }
      }

      if (extractedWords.length > 0) {
        textBlocks.push(extractedWords.join(' '));
      }
    }

    if (textBlocks.length > 0) {
      const combined = textBlocks.join('\n\n');
      const paragraphs = splitIntoParagraphs(combined);
      if (paragraphs.length > 0) {
        return {
          pages: [paragraphs.join('\n\n')],
          rawText: paragraphs.join('\n\n'),
        };
      }
    }
  } catch (e) {
    console.warn('Binary PDF extraction note:', e);
  }
  return { pages: [], rawText: '' };
}

// Extract text from PDF file using PDF.js with multiple fallback layers
export async function extractTextFromPdf(file: File): Promise<{ pages: string[]; rawText: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // 1. Primary: PDF.js getDocument
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });

      const pdf = await loadingTask.promise;
      const pageTexts: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageString = textContent.items
          .map((item: any) => (item && typeof item.str === 'string' ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (pageString.length > 0) {
          pageTexts.push(pageString);
        }
      }

      if (pageTexts.length > 0) {
        return {
          pages: pageTexts,
          rawText: pageTexts.join('\n\n'),
        };
      }
    } catch (pdfErr) {
      console.warn('PDF.js worker task note, running stream parser:', pdfErr);
    }

    // 2. Secondary: Binary text stream extractor
    const fallbackResult = extractTextFromBinaryPdf(arrayBuffer);
    if (fallbackResult.rawText.trim().length > 30) {
      return fallbackResult;
    }
  } catch (err) {
    console.warn('PDF extraction outer error:', err);
  }

  // 3. Plain text / string scan fallback
  try {
    const text = await file.text();
    const readable = text.replace(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g, ' ');
    const paragraphs = readable.split(/\n{2,}/).filter((s) => s.trim().length > 25);
    if (paragraphs.length > 0) {
      const raw = paragraphs.join('\n\n');
      return { pages: [raw], rawText: raw };
    }
  } catch (e) {
    // ignore
  }

  return { pages: [], rawText: '' };
}

// Extract text from Word (.docx) documents
export async function extractTextFromDocx(file: File): Promise<{ pages: string[]; rawText: string }> {
  try {
    // In docx, the text is inside word/document.xml
    const text = await file.text();
    // Match <w:t> tags
    const wtMatches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (wtMatches && wtMatches.length > 0) {
      const words = wtMatches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      const fullText = words.join(' ');
      const paragraphs = splitIntoParagraphs(fullText);
      if (paragraphs.length > 0) {
        return { pages: [paragraphs.join('\n\n')], rawText: paragraphs.join('\n\n') };
      }
    }
  } catch (e) {
    console.warn('Docx extraction note:', e);
  }
  return { pages: [], rawText: '' };
}

