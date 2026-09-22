import React, { useState, useMemo } from 'react';
import {
  X, FileText, Download, Printer, Globe,
  ZoomIn, ZoomOut, RotateCcw, Sliders, Eye
} from 'lucide-react';

export type ExportPageSize = 'A4' | 'Letter' | 'A3' | 'Legal' | 'Tabloid';
export type ExportOrientation = 'portrait' | 'landscape';
export type ExportMargin = 'normal' | 'compact' | 'none' | 'wide';
export type ExportTheme = 'light' | 'dark';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  getEditorHTML: () => string;
  themeAccent: string;
  isDark: boolean;
  onToast: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  fileName,
  getEditorHTML,
  themeAccent,
  isDark,
  onToast,
}) => {
  const [pageSize, setPageSize] = useState<ExportPageSize>('A4');
  const [orientation, setOrientation] = useState<ExportOrientation>('portrait');
  const [margin, setMargin] = useState<ExportMargin>('normal');
  const [scale, setScale] = useState<number>(100);
  const [exportTheme, setExportTheme] = useState<ExportTheme>('light');
  const [headerFooter, setHeaderFooter] = useState<boolean>(true);
  const [printBackground, setPrintBackground] = useState<boolean>(true);

  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingHTML, setIsExportingHTML] = useState(false);

  if (!isOpen) return null;

  const baseTitle = fileName.replace(/\.md$/, '') || 'Document';
  const rawHtml = getEditorHTML();

  // Clean HTML for export/preview by stripping any stray selection or UI markers
  const cleanHtml = useMemo(() => {
    if (!rawHtml) return '<p>No content available.</p>';
    // Clean up empty paragraphs at start or search markers
    return rawHtml
      .replace(/class="[^"]*search-result[^"]*"/g, '')
      .replace(/class="[^"]*selectedCell[^"]*"/g, '');
  }, [rawHtml]);

  // Margin CSS values
  const marginValues: Record<ExportMargin, { css: string, mm: number, label: string }> = {
    none: { css: '0mm', mm: 0, label: 'None (0mm)' },
    compact: { css: '10mm', mm: 10, label: 'Compact (10mm)' },
    normal: { css: '20mm', mm: 20, label: 'Normal (20mm)' },
    wide: { css: '30mm', mm: 30, label: 'Wide (30mm)' },
  };

  // Dimensions & Aspect Ratios
  const pageRatios: Record<ExportPageSize, { w: number, h: number, name: string }> = {
    A4: { w: 210, h: 297, name: 'A4 (210 × 297 mm)' },
    Letter: { w: 215.9, h: 279.4, name: 'US Letter (8.5 × 11 in)' },
    A3: { w: 297, h: 420, name: 'A3 (297 × 420 mm)' },
    Legal: { w: 215.9, h: 355.6, name: 'US Legal (8.5 × 14 in)' },
    Tabloid: { w: 279.4, h: 431.8, name: 'Tabloid (11 × 17 in)' },
  };

  const currentRatio = pageRatios[pageSize];
  const paperWidthMm = orientation === 'portrait' ? currentRatio.w : currentRatio.h;
  const paperHeightMm = orientation === 'portrait' ? currentRatio.h : currentRatio.w;

  // Margin config for Electron printToPDF
  const getElectronMargins = () => {
    switch (margin) {
      case 'none':
        return { marginType: 'none' };
      case 'compact':
        return { marginType: 'custom', top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 };
      case 'wide':
        return { marginType: 'custom', top: 1.2, bottom: 1.2, left: 1.2, right: 1.2 };
      case 'normal':
      default:
        return { marginType: 'default' };
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const res = await window.api.exportToPDF({
        html: cleanHtml,
        title: baseTitle,
        options: {
          defaultName: `${baseTitle}.pdf`,
          pageSize,
          landscape: orientation === 'landscape',
          margins: getElectronMargins(),
          scale: scale / 100,
          theme: exportTheme,
          headerFooter,
          printBackground,
        },
      });

      if (res.success) {
        onToast('Document exported to PDF successfully!');
        onClose();
      } else if (!res.canceled) {
        alert('Failed to export PDF: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error exporting PDF: ' + err.message);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const res = await window.api.printDocument({
        html: cleanHtml,
        title: baseTitle,
        options: {
          pageSize,
          landscape: orientation === 'landscape',
          margins: getElectronMargins(),
          scale: scale / 100,
          theme: exportTheme,
          headerFooter,
          printBackground,
        },
      });
      if (res.success) {
        onToast('Print job initiated.');
      } else if (res.error) {
        console.warn('Print canceled or failed:', res.error);
      }
    } catch (err: any) {
      alert('Error during printing: ' + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportHTML = async () => {
    setIsExportingHTML(true);
    try {
      const isDarkHTML = exportTheme === 'dark';
      const standaloneHTML = `<!DOCTYPE html>
<html lang="en" class="${isDarkHTML ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${baseTitle}</title>
  <style>
    :root {
      --accent: ${themeAccent};
      --bg: ${isDarkHTML ? '#121212' : '#ffffff'};
      --text: ${isDarkHTML ? '#e4e4e7' : '#18181b'};
      --border: ${isDarkHTML ? '#27272a' : '#e4e4e7'};
      --code-bg: ${isDarkHTML ? '#1a1a1a' : '#f4f4f5'};
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.7;
      margin: 0;
      padding: 3rem 1.5rem;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
    }
    h1, h2, h3, h4, h5, h6 { font-weight: 600; line-height: 1.3; margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { font-size: 2.25rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
    h2 { font-size: 1.75rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: var(--code-bg); padding: 0.2em 0.4em; border-radius: 4px; font-size: 85%; }
    pre { background: var(--code-bg); padding: 1rem; border-radius: 8px; overflow-x: auto; border: 1px solid var(--border); }
    pre code { background: transparent; padding: 0; }
    blockquote { border-left: 4px solid var(--accent); margin: 1em 0; padding-left: 1rem; color: #71717a; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 1.5em 0; }
    th, td { border: 1px solid var(--border); padding: 0.6em 1em; text-align: left; }
    th { background: var(--code-bg); font-weight: 600; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
    hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }
    .mermaid-container svg { max-width: 100%; height: auto; }
    @media print {
      body { background: white !important; color: black !important; padding: 0; }
      .container { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${cleanHtml}
  </div>
</body>
</html>`;

      const res = await window.api.saveAsFile({
        defaultName: `${baseTitle}.html`,
        content: standaloneHTML,
      });

      if (res.success) {
        onToast('Document exported to HTML successfully!');
        onClose();
      }
    } catch (err: any) {
      alert('Error exporting HTML: ' + err.message);
    } finally {
      setIsExportingHTML(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 select-none ${isDark ? 'dark' : ''}`} onClick={onClose}>
      <div
        className="bg-white dark:bg-[#181818] w-full max-w-5xl h-[88vh] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-[#151515]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${themeAccent}18`, color: themeAccent }}>
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Export & Print Studio</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 uppercase tracking-wider">
                  Isolated Publication Engine
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              title="Close Export Studio"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Split View */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Customization Settings (Width: 360px) */}
          <div className="w-[360px] border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto p-5 shrink-0 space-y-4 bg-gray-50/30 dark:bg-[#161616]">
            {/* Quick Export Actions */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Primary Output
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  style={{ backgroundColor: themeAccent }}
                >
                  <Download size={15} />
                  {isExportingPDF ? 'Exporting...' : 'Save as PDF'}
                </button>

                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202020] hover:bg-gray-100 dark:hover:bg-[#282828] active:scale-95 transition-all text-gray-800 dark:text-gray-200"
                >
                  <Printer size={15} />
                  {isPrinting ? 'Preparing...' : 'Direct Print'}
                </button>
              </div>

              <button
                onClick={handleExportHTML}
                disabled={isExportingHTML}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
              >
                <Globe size={14} />
                Export Standalone HTML Webpage
              </button>
            </div>

            <hr className="border-gray-200 dark:border-gray-800" />

            {/* Layout Customization */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <Sliders size={13} />
                <span>Page Layout & Sizing</span>
              </div>

              {/* Page Format */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1.5">Paper Size</label>
                <div className="grid grid-cols-3 gap-1.5 bg-gray-100 dark:bg-[#222] p-1 rounded-xl text-xs">
                  {(['A4', 'Letter', 'A3', 'Legal', 'Tabloid'] as ExportPageSize[]).map(ps => (
                    <button
                      key={ps}
                      onClick={() => setPageSize(ps)}
                      className={`py-1.5 px-2 rounded-lg font-medium transition-all text-center truncate ${
                        pageSize === ps
                          ? 'bg-white dark:bg-[#121212] shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                      style={pageSize === ps ? { color: themeAccent } : {}}
                    >
                      {ps}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1.5">Orientation</label>
                <div className="grid grid-cols-2 gap-1.5 bg-gray-100 dark:bg-[#222] p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`py-1.5 px-3 rounded-lg font-medium transition-all ${
                      orientation === 'portrait'
                        ? 'bg-white dark:bg-[#121212] shadow-sm font-semibold'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    style={orientation === 'portrait' ? { color: themeAccent } : {}}
                  >
                    Portrait
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`py-1.5 px-3 rounded-lg font-medium transition-all ${
                      orientation === 'landscape'
                        ? 'bg-white dark:bg-[#121212] shadow-sm font-semibold'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    style={orientation === 'landscape' ? { color: themeAccent } : {}}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              {/* Margins */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1.5">Margins</label>
                <div className="grid grid-cols-4 gap-1 bg-gray-100 dark:bg-[#222] p-1 rounded-xl text-xs">
                  {(['none', 'compact', 'normal', 'wide'] as ExportMargin[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setMargin(m)}
                      className={`py-1.5 px-1 rounded-lg font-medium capitalize transition-all text-center ${
                        margin === m
                          ? 'bg-white dark:bg-[#121212] shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                      style={margin === m ? { color: themeAccent } : {}}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Scale */}
              <div>
                <div className="flex justify-between items-center text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <span>Document Zoom / Scale</span>
                  <span className="font-mono text-[11px] font-bold" style={{ color: themeAccent }}>{scale}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={140}
                  step={5}
                  value={scale}
                  onChange={e => setScale(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 rounded-lg bg-gray-200 dark:bg-gray-700"
                  style={{ accentColor: themeAccent }}
                />
              </div>

              {/* Color Mode / Theme */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1.5">Print Appearance</label>
                <div className="grid grid-cols-2 gap-1.5 bg-gray-100 dark:bg-[#222] p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setExportTheme('light')}
                    className={`py-1.5 px-3 rounded-lg font-medium transition-all ${
                      exportTheme === 'light'
                        ? 'bg-white dark:bg-[#121212] shadow-sm font-semibold'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    style={exportTheme === 'light' ? { color: themeAccent } : {}}
                  >
                    Clean White Paper
                  </button>
                  <button
                    onClick={() => setExportTheme('dark')}
                    className={`py-1.5 px-3 rounded-lg font-medium transition-all ${
                      exportTheme === 'dark'
                        ? 'bg-white dark:bg-[#121212] shadow-sm font-semibold'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    style={exportTheme === 'dark' ? { color: themeAccent } : {}}
                  >
                    Dark Mode Style
                  </button>
                </div>
              </div>

              {/* Options Checkboxes */}
              <div className="pt-2 space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={headerFooter}
                    onChange={e => setHeaderFooter(e.target.checked)}
                    className="rounded border-gray-300 text-blue-500 focus:ring-0"
                    style={{ accentColor: themeAccent }}
                  />
                  <span>Include Header & Page Numbers</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={printBackground}
                    onChange={e => setPrintBackground(e.target.checked)}
                    className="rounded border-gray-300 text-blue-500 focus:ring-0"
                    style={{ accentColor: themeAccent }}
                  />
                  <span>Print Background Graphics & Colors</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Panel: Accurate Real-time Visual Paper Preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-200/70 dark:bg-[#0c0c0c] relative">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-300/60 dark:border-gray-800/80 bg-white/70 dark:bg-[#141414]/90 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Eye size={15} style={{ color: themeAccent }} />
                <span className="font-semibold text-gray-800 dark:text-gray-200">Live Paper Preview</span>
                <span className="text-gray-400">•</span>
                <span className="font-mono text-[11px]">{pageRatios[pageSize].name}</span>
                <span className="text-gray-400">•</span>
                <span className="capitalize">{orientation}</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setPreviewZoom(z => Math.max(50, z - 15))}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="font-mono text-[11px] w-9 text-center text-gray-600 dark:text-gray-400">
                  {previewZoom}%
                </span>
                <button
                  onClick={() => setPreviewZoom(z => Math.min(150, z + 15))}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={() => setPreviewZoom(100)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 ml-1"
                  title="Reset Preview Zoom"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Paper Sheet Preview Area */}
            <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
              <div
                className="transition-all duration-200 shadow-2xl relative flex flex-col"
                style={{
                  width: `${(paperWidthMm / 210) * 580 * (previewZoom / 100)}px`,
                  minHeight: `${(paperHeightMm / 297) * 820 * (previewZoom / 100)}px`,
                  backgroundColor: exportTheme === 'dark' ? '#121212' : '#ffffff',
                  color: exportTheme === 'dark' ? '#e4e4e7' : '#18181b',
                  borderRadius: '4px',
                  border: exportTheme === 'dark' ? '1px solid #282828' : '1px solid #e0e0e0',
                }}
              >
                {/* Simulated Header */}
                {headerFooter && (
                  <div
                    className="flex justify-between items-center text-[10px] text-gray-400 border-b pb-1 select-none"
                    style={{
                      margin: `${marginValues[margin].mm * 1.5 * (previewZoom / 100)}px ${marginValues[margin].mm * 1.5 * (previewZoom / 100)}px 0`,
                      borderColor: exportTheme === 'dark' ? '#262626' : '#f0f0f0',
                    }}
                  >
                    <span className="font-semibold truncate max-w-[240px]">{baseTitle}</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                )}

                {/* Simulated Paper Content */}
                <div
                  className="flex-1 overflow-hidden"
                  style={{
                    padding: `${marginValues[margin].mm * 1.5 * (previewZoom / 100)}px`,
                    fontSize: `${13 * (scale / 100) * (previewZoom / 100)}px`,
                    lineHeight: 1.6,
                  }}
                >
                  <div
                    className="prose max-w-none preview-document-container"
                    style={{
                      color: exportTheme === 'dark' ? '#e4e4e7' : '#18181b',
                    }}
                    dangerouslySetInnerHTML={{ __html: cleanHtml }}
                  />
                </div>

                {/* Simulated Footer */}
                {headerFooter && (
                  <div
                    className="flex justify-center items-center text-[10px] text-gray-400 border-t pt-1 pb-2 select-none"
                    style={{
                      margin: `0 ${marginValues[margin].mm * 1.5 * (previewZoom / 100)}px ${marginValues[margin].mm * 1.5 * (previewZoom / 100)}px`,
                      borderColor: exportTheme === 'dark' ? '#262626' : '#f0f0f0',
                    }}
                  >
                    <span>Page 1</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
