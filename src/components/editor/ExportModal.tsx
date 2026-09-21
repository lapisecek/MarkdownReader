import React, { useState } from 'react';
import { X, FileText, Download, Printer, Globe } from 'lucide-react';

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
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingHTML, setIsExportingHTML] = useState(false);

  if (!isOpen) return null;

  const baseTitle = fileName.replace(/\.md$/, '');

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const res = await window.api.exportToPDF({
        defaultName: `${baseTitle}.pdf`,
        pageSize,
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

  const handleExportHTML = async () => {
    setIsExportingHTML(true);
    try {
      const htmlBody = getEditorHTML();
      const standaloneHTML = `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${baseTitle}</title>
  <style>
    :root {
      --accent: ${themeAccent};
      --bg: ${isDark ? '#121212' : '#ffffff'};
      --text: ${isDark ? '#e4e4e7' : '#18181b'};
      --border: ${isDark ? '#27272a' : '#e4e4e7'};
      --code-bg: ${isDark ? '#1a1a1a' : '#f4f4f5'};
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
      max-width: 800px;
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
    @media print {
      body { background: white !important; color: black !important; padding: 0; }
      .container { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${htmlBody}
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

  const handlePrint = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${themeAccent}18`, color: themeAccent }}>
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Export Document</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[260px]">{fileName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Export Formats</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-center group"
              >
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                  <Download size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold">PDF Document</div>
                  <div className="text-[10px] text-gray-500">Paginated print-ready</div>
                </div>
              </button>

              <button
                onClick={handleExportHTML}
                disabled={isExportingHTML}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-center group"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold">Standalone HTML</div>
                  <div className="text-[10px] text-gray-500">Self-contained browser file</div>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500">PDF Page Layout</span>
            <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => setPageSize('A4')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${pageSize === 'A4' ? 'bg-white dark:bg-[#121212] shadow-sm text-blue-500' : 'text-gray-500'}`}
              >
                A4
              </button>
              <button
                onClick={() => setPageSize('Letter')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${pageSize === 'Letter' ? 'bg-white dark:bg-[#121212] shadow-sm text-blue-500' : 'text-gray-500'}`}
              >
                Letter
              </button>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Printer size={15} />
            Direct System Print (Ctrl+P)
          </button>
        </div>
      </div>
    </div>
  );
};
