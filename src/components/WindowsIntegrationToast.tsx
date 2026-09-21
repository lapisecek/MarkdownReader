import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Wrench, Check, Monitor, LayoutGrid, FileText, Menu } from 'lucide-react';
import appIconImg from '../../icon.ico';

export interface WindowsIntegrationStatus {
  isSupported: boolean;
  isDefaultApp: boolean;
  hasDesktopShortcut: boolean;
  hasStartMenuShortcut: boolean;
  hasContextMenu: boolean;
  allConfigured: boolean;
  error?: string;
}

interface WindowsIntegrationToastProps {
  themeAccent: string;
  isDark: boolean;
  onToast: (msg: string) => void;
}

export const WindowsIntegrationToast: React.FC<WindowsIntegrationToastProps> = ({
  themeAccent,
  onToast,
}) => {
  const [status, setStatus] = useState<WindowsIntegrationStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed with "don't show again"
    const isDismissed = localStorage.getItem('mdreader-hide-windows-setup') === 'true';
    if (isDismissed) return;

    // Grace delay of 2.5 seconds on startup
    const timer = setTimeout(async () => {
      try {
        if (!window.api?.checkWindowsIntegration) return;
        const res = await window.api.checkWindowsIntegration();
        setStatus(res);
        if (res.isSupported && !res.allConfigured) {
          setIsVisible(true);
        }
      } catch (err) {
        console.error('Error checking Windows integration:', err);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || !status || !status.isSupported || status.allConfigured) {
    return null;
  }

  const handleFixAll = async () => {
    setIsFixing(true);
    try {
      const res = await window.api.setupWindowsIntegration({
        defaultApp: true,
        desktopShortcut: true,
        startMenuShortcut: true,
        contextMenu: true,
      });

      if (res.success) {
        setIsSuccess(true);
        const updated = await window.api.checkWindowsIntegration();
        setStatus(updated);
        onToast('All Windows integrations successfully configured!');
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      } else {
        alert('Failed to apply integrations: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error during Windows setup: ' + err.message);
    } finally {
      setIsFixing(false);
    }
  };

  const handleFixSingle = async (key: 'defaultApp' | 'desktopShortcut' | 'startMenuShortcut' | 'contextMenu') => {
    try {
      const res = await window.api.setupWindowsIntegration({ [key]: true });
      if (res.success) {
        const updated = await window.api.checkWindowsIntegration();
        setStatus(updated);
        onToast('Windows feature configured successfully!');
        if (updated.allConfigured) {
          setIsSuccess(true);
          setTimeout(() => setIsVisible(false), 2500);
        }
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDismiss = (dontAskAgain: boolean = false) => {
    if (dontAskAgain) {
      localStorage.setItem('mdreader-hide-windows-setup', 'true');
    }
    setIsVisible(false);
  };

  const missingCount = [
    !status.isDefaultApp,
    !status.hasDesktopShortcut,
    !status.hasStartMenuShortcut,
    !status.hasContextMenu,
  ].filter(Boolean).length;

  return (
    <div
      className="fixed bottom-6 right-6 z-[300] w-[390px] max-w-[calc(100vw-32px)] bg-white/95 dark:bg-[#161618]/95 backdrop-blur-xl rounded-2xl border border-gray-200/90 dark:border-gray-800/90 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200 transition-all select-none"
      style={{
        boxShadow: `0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px ${themeAccent}25`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={appIconImg} alt="App Icon" className="w-7 h-7 object-contain drop-shadow-sm" />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#161618] bg-amber-500 animate-pulse"
              style={{ backgroundColor: isSuccess ? '#22c55e' : '#f59e0b' }}
            />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight">Windows Setup Assistant</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {isSuccess ? 'All integrations active!' : `${missingCount} integration${missingCount > 1 ? 's' : ''} not yet configured`}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleDismiss(false)}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          title="Dismiss for now"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-3 space-y-3">
        {isSuccess ? (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={22} className="shrink-0" />
            <div className="text-xs">
              <div className="font-semibold">Windows integration complete!</div>
              <div className="text-[11px] opacity-90 mt-0.5">
                MarkdownReader is now your default Markdown editor with shortcuts and context menus.
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              MarkdownReader can register with Windows so Markdown files open instantly, with Desktop & Start shortcuts and Explorer right-click integration.
            </p>

            {/* Checklist Preview */}
            <div className="space-y-1.5 pt-1">
              {/* Default App */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <FileText size={14} />
                  </div>
                  <div>
                    <div className="font-medium">Default .md & .markdown Handler</div>
                    <div className="text-[10px] text-gray-500">Double-click files to open</div>
                  </div>
                </div>
                {status.isDefaultApp ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Check size={11} /> Active
                  </span>
                ) : (
                  <button
                    onClick={() => handleFixSingle('defaultApp')}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg hover:underline transition-all"
                    style={{ color: themeAccent }}
                  >
                    Set Default
                  </button>
                )}
              </div>

              {/* Desktop Shortcut */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                    <Monitor size={14} />
                  </div>
                  <div>
                    <div className="font-medium">Desktop Shortcut</div>
                    <div className="text-[10px] text-gray-500">Quick launch from Desktop</div>
                  </div>
                </div>
                {status.hasDesktopShortcut ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Check size={11} /> Active
                  </span>
                ) : (
                  <button
                    onClick={() => handleFixSingle('desktopShortcut')}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg hover:underline transition-all"
                    style={{ color: themeAccent }}
                  >
                    Add Icon
                  </button>
                )}
              </div>

              {/* Start Menu Shortcut */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <LayoutGrid size={14} />
                  </div>
                  <div>
                    <div className="font-medium">Start Menu Programs</div>
                    <div className="text-[10px] text-gray-500">Windows Search & Start Pin</div>
                  </div>
                </div>
                {status.hasStartMenuShortcut ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Check size={11} /> Active
                  </span>
                ) : (
                  <button
                    onClick={() => handleFixSingle('startMenuShortcut')}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg hover:underline transition-all"
                    style={{ color: themeAccent }}
                  >
                    Add Shortcut
                  </button>
                )}
              </div>

              {/* Context Menu */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Menu size={14} />
                  </div>
                  <div>
                    <div className="font-medium">Explorer Context Menu</div>
                    <div className="text-[10px] text-gray-500">Right-click "Edit with MarkdownReader"</div>
                  </div>
                </div>
                {status.hasContextMenu ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Check size={11} /> Active
                  </span>
                ) : (
                  <button
                    onClick={() => handleFixSingle('contextMenu')}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg hover:underline transition-all"
                    style={{ color: themeAccent }}
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      {!isSuccess && (
        <div className="px-5 pb-4 pt-1 flex flex-col gap-2">
          <button
            onClick={handleFixAll}
            disabled={isFixing}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white transition-all shadow-md active:scale-98 disabled:opacity-50"
            style={{ backgroundColor: themeAccent }}
          >
            {isFixing ? (
              <span className="flex items-center gap-2">Configuring Windows...</span>
            ) : (
              <>
                <Wrench size={14} />
                Fix All & Apply (1-Click Setup)
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 px-1 pt-1">
            <button
              onClick={() => handleDismiss(true)}
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Don't show again
            </button>
            <span>You can also manage this in Settings anytime</span>
          </div>
        </div>
      )}
    </div>
  );
};
