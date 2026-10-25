import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  UploadCloud,
} from 'lucide-react';

// Configure worker safely without triggering sandboxed iframe errors
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
}

interface NativePdfCanvasViewerProps {
  fileUrl?: string;
  fileName?: string;
  zoomLevel?: number;
  layoutMode?: 'singlePage' | 'continuous';
  onPageChange?: (page: number, total: number) => void;
  initialPage?: number;
  onOpenUpload?: () => void;
}

// Individual page canvas renderer for smooth, isolated rendering
const PdfPageItem: React.FC<{
  pdfDoc: any;
  pageNumber: number;
  zoomLevel: number;
  fileName: string;
  totalPages: number;
}> = ({ pdfDoc, pageNumber, zoomLevel, fileName, totalPages }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    let currentRenderTask: any = null;

    const render = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        setIsRendering(true);
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const scale = (zoomLevel / 100) * 1.5;
        const viewport = page.getViewport({ scale });
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        currentRenderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });

        await currentRenderTask.promise;
        if (!isCancelled) {
          setIsRendering(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Render error on page ${pageNumber}:`, err);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (currentRenderTask) {
        try {
          currentRenderTask.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNumber, zoomLevel]);

  return (
    <div className="bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-400 max-w-full relative mb-8">
      {/* Header bar on each page */}
      <div className="bg-[#f8f9fa] border-b border-[#e2e8f0] px-3 sm:px-4 py-1.5 text-[11px] font-ui-label-mono text-[#64748b] flex items-center justify-between">
        <span className="font-bold text-[#191c1e] truncate max-w-[200px] sm:max-w-none">
          {fileName}
        </span>
        <span className="text-[#81001d] font-bold">
          PAGE {pageNumber} OF {totalPages}
        </span>
      </div>

      <div className="relative overflow-x-auto flex justify-center bg-[#525659] p-2 sm:p-4">
        {isRendering && (
          <div className="absolute inset-0 bg-[#525659]/60 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        )}
        <canvas ref={canvasRef} className="block mx-auto max-w-full h-auto bg-white shadow-md" />
      </div>
    </div>
  );
};

export const NativePdfCanvasViewer: React.FC<NativePdfCanvasViewerProps> = ({
  fileUrl,
  fileName = 'Case Document.pdf',
  zoomLevel = 100,
  layoutMode = 'continuous',
  onPageChange,
  initialPage = 1,
  onOpenUpload,
}) => {
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Load PDF Document via PDF.js
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage((prev) => Math.min(prev, doc.numPages));
        setLoading(false);

        if (onPageChange) {
          onPageChange(Math.min(currentPage, doc.numPages), doc.numPages);
        }
      } catch (err: any) {
        if (isCancelled) return;
        console.warn('PDF.js rendering note:', err);
        setError(
          'Direct canvas rendering encountered an issue with this file format. You can still view the document in a new tab or use the Structured Socratic Reader.'
        );
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [fileUrl]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const nextP = currentPage - 1;
      setCurrentPage(nextP);
      if (onPageChange) onPageChange(nextP, numPages);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const nextP = currentPage + 1;
      setCurrentPage(nextP);
      if (onPageChange) onPageChange(nextP, numPages);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Canvas Document Stage */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 text-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#d32f2f]" />
          <span className="font-ui-header text-[13px]">
            Rendering original PDF pages with PDF.js engine...
          </span>
        </div>
      )}

      {error ? (
        <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md shadow-xl text-center space-y-4 m-4 border border-[#e2e8f0]">
          <div className="w-12 h-12 rounded-full bg-[#ffdad9] text-[#81001d] flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-ui-header text-[16px] font-bold text-gray-900">
              Upload document (s)
            </h4>
            <p className="font-reading-serif text-[13px] text-gray-600 leading-relaxed mt-1">
              Upload document (s) to view, navigate, and read case materials.
            </p>
          </div>
          {onOpenUpload && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onOpenUpload}
                className="px-5 py-2.5 bg-[#81001d] hover:bg-[#680017] text-white font-ui-header text-[12px] font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors active:scale-98"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload document (s)</span>
              </button>
            </div>
          )}
        </div>
      ) : null}

      {!loading && !error && pdfDoc && (
        <div className="w-full max-w-full overflow-x-auto flex flex-col items-center py-2 sm:py-4 px-1">
          {layoutMode === 'continuous' ? (
            // CONTINUOUS SCROLL: Render ALL pages sequentially
            <div className="w-full flex flex-col items-center">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <PdfPageItem
                  key={pageNum}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNum}
                  zoomLevel={zoomLevel}
                  fileName={fileName}
                  totalPages={numPages}
                />
              ))}
            </div>
          ) : (
            // SINGLE PAGE MODE: Render only active page
            <div className="w-full flex flex-col items-center">
              <PdfPageItem
                key={currentPage}
                pdfDoc={pdfDoc}
                pageNumber={currentPage}
                zoomLevel={zoomLevel}
                fileName={fileName}
                totalPages={numPages}
              />
              {numPages > 1 && (
                <div className="flex items-center gap-2 bg-[#2a2e33] text-gray-200 px-3 py-1.5 rounded-full border border-gray-600 shadow-md my-2 text-[12px] font-ui-label-mono">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className="p-1 rounded hover:bg-gray-700 disabled:opacity-30"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>
                    Page <strong className="text-white">{currentPage}</strong> of {numPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= numPages}
                    className="p-1 rounded hover:bg-gray-700 disabled:opacity-30"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

