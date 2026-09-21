import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Palette, Pen, Keyboard, Download, Type } from 'lucide-react';

export type AppTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight';
export type EditorFontFamily = 'sans' | 'mono' | 'serif';
export type DefaultEditorMode = 'edit' | 'read';

export interface AppSettings {
  theme: AppTheme;
  isDark: boolean;
  fontSize: number;
  lineHeight: number;
  editorMaxWidth: number;
  wordWrap: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  animationsEnabled: boolean;
  showStatusBar: boolean;
  sidebarWidth: number;
  spellCheck: boolean;
  copyAsMarkdown: boolean;
  fontFamily: EditorFontFamily;
  defaultMode: DefaultEditorMode;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'default',
  isDark: true,
  fontSize: 18,
  lineHeight: 1.75,
  editorMaxWidth: 768,
  wordWrap: true,
  autoSave: false,
  autoSaveInterval: 30,
  animationsEnabled: true,
  showStatusBar: true,
  sidebarWidth: 260,
  spellCheck: false,
  copyAsMarkdown: true,
  fontFamily: 'sans',
  defaultMode: 'edit',
};

export const THEME_COLORS: Record<AppTheme, { accent: string, accentBg: string, label: string }> = {
  default: { accent: '#3b82f6', accentBg: 'rgba(59,130,246,0.1)', label: 'Default Blue' },
  ocean: { accent: '#06b6d4', accentBg: 'rgba(6,182,212,0.1)', label: 'Ocean Cyan' },
  forest: { accent: '#22c55e', accentBg: 'rgba(34,197,94,0.1)', label: 'Forest Green' },
  sunset: { accent: '#f97316', accentBg: 'rgba(249,115,22,0.1)', label: 'Sunset Orange' },
  midnight: { accent: '#a78bfa', accentBg: 'rgba(167,139,250,0.1)', label: 'Midnight Violet' },
};

export const SHORTCUTS = [
  { label: 'Save Document', keys: 'Ctrl+S' },
  { label: 'Save As Document', keys: 'Ctrl+Shift+S' },
  { label: 'Export Document', keys: 'Ctrl+E' },
  { label: 'Print Document', keys: 'Ctrl+P' },
  { label: 'Find / Search in Text', keys: 'Ctrl+F' },
  { label: 'Toggle Edit / Reading Mode', keys: 'Ctrl+Shift+R' },
  { label: 'Toggle Source Code View', keys: 'Ctrl+Alt+S' },
  { label: 'Toggle Minimalist Mode', keys: 'Ctrl+Alt+M' },
  { label: 'Toggle Formatting Bar', keys: 'Ctrl+/' },
  { label: 'Settings', keys: 'Ctrl+,' },
  { label: 'Bold Text', keys: 'Ctrl+B' },
  { label: 'Italic Text', keys: 'Ctrl+I' },
  { label: 'Strikethrough', keys: 'Ctrl+Shift+X' },
  { label: 'Inline Code', keys: 'Ctrl+`' },
  { label: 'Code Block', keys: 'Ctrl+Alt+C' },
  { label: 'Heading 1 / 2 / 3', keys: 'Ctrl+Alt+1/2/3' },
  { label: 'Bullet List', keys: 'Ctrl+Shift+8' },
  { label: 'Numbered List', keys: 'Ctrl+Shift+9' },
  { label: 'Blockquote', keys: 'Ctrl+Shift+B' },
  { label: 'Highlight Text', keys: 'Ctrl+Shift+H' },
  { label: 'Undo / Redo', keys: 'Ctrl+Z / Ctrl+Y' },
];

export const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <div className={`toggle-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} />
);

export const RangeSlider = ({ min, max, step, value, onChange, accent }: any) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className="w-32"
      style={{
        background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, rgba(128,128,128,0.2) ${pct}%, rgba(128,128,128,0.2) 100%)`
      }}
    />
  );
};

export const SettingRow = ({ label, desc, children }: { label: string, desc?: string, children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-1">
    <div>
      <div className="text-sm font-medium">{label}</div>
      {desc && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>}
    </div>
    {children}
  </div>
);

interface SettingsModalProps {
  settings: AppSettings;
  onUpdate: (s: Partial<AppSettings>) => void;
  onClose: () => void;
  themeColors: typeof THEME_COLORS[AppTheme];
  onOpenExport?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onClose,
  themeColors,
  onOpenExport,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'editor' | 'keybindings' | 'export'>('appearance');
  const historyRef = useRef<AppSettings[]>([]);

  const stabs = [
    { id: 'appearance' as const, label: 'Appearance', icon: <Palette size={15} /> },
    { id: 'editor' as const, label: 'Editor', icon: <Pen size={15} /> },
    { id: 'export' as const, label: 'Export', icon: <Download size={15} /> },
    { id: 'keybindings' as const, label: 'Shortcuts', icon: <Keyboard size={15} /> },
  ];

  const handleUpdate = (s: Partial<AppSettings>) => {
    historyRef.current.push({ ...settings });
    onUpdate(s);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const last = historyRef.current.pop();
        if (last) {
          e.preventDefault();
          e.stopPropagation();
          onUpdate(last);
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [settings, onUpdate]);

  return (
    <div className="fixed inset-0 z-[200] flex justify-center items-start py-20 bg-black/50 backdrop-blur-sm px-4 select-none" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1e1e1e] shadow-2xl w-full max-w-2xl flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden rounded-2xl max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings size={18} style={{ color: themeColors.accent }} /> Settings
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-3 pb-2 border-b border-gray-200 dark:border-gray-800 shrink-0 overflow-x-auto">
          {stabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`settings-tab flex items-center gap-2 whitespace-nowrap ${activeTab === t.id ? 'active' : ''}`}
              style={activeTab === t.id ? { color: themeColors.accent } : {}}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 block">Color Theme</label>
                <div className="grid grid-cols-5 gap-2.5">
                  {(Object.keys(THEME_COLORS) as AppTheme[]).map(t => (
                    <button
                      key={t}
                      onClick={() => handleUpdate({ theme: t })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        settings.theme === t
                          ? 'shadow-md scale-105'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                      style={settings.theme === t ? { borderColor: THEME_COLORS[t].accent } : {}}
                    >
                      <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: THEME_COLORS[t].accent }} />
                      <span className="text-[11px] font-medium">{THEME_COLORS[t].label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-4">
                <SettingRow label="Dark Mode" desc="Switch between dark and light appearance">
                  <Toggle checked={settings.isDark} onChange={v => handleUpdate({ isDark: v })} />
                </SettingRow>

                <SettingRow label="Interface Animations" desc="Enable smooth transitions and responsive effects">
                  <Toggle checked={settings.animationsEnabled} onChange={v => handleUpdate({ animationsEnabled: v })} />
                </SettingRow>

                <SettingRow label="Word & Character Count" desc="Display document metrics in the bottom status bar">
                  <Toggle checked={settings.showStatusBar} onChange={v => handleUpdate({ showStatusBar: v })} />
                </SettingRow>

                <SettingRow label="Editor Typography" desc="Choose preferred reading and editing typeface">
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs">
                    {(['sans', 'mono', 'serif'] as EditorFontFamily[]).map(f => (
                      <button
                        key={f}
                        onClick={() => handleUpdate({ fontFamily: f })}
                        className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                          settings.fontFamily === f
                            ? 'bg-white dark:bg-[#121212] shadow-sm text-blue-500'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                      >
                        {f === 'sans' ? 'Sans-Serif' : f === 'mono' ? 'Monospace' : 'Serif'}
                      </button>
                    ))}
                  </div>
                </SettingRow>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="space-y-5">
              <SettingRow label="Font Size" desc={`${settings.fontSize}px`}>
                <RangeSlider min={12} max={28} step={1} value={settings.fontSize} onChange={(e: any) => handleUpdate({ fontSize: +e.target.value })} accent={themeColors.accent} />
              </SettingRow>

              <SettingRow label="Line Spacing" desc={`${settings.lineHeight}`}>
                <RangeSlider min={1.2} max={2.5} step={0.05} value={settings.lineHeight} onChange={(e: any) => handleUpdate({ lineHeight: +e.target.value })} accent={themeColors.accent} />
              </SettingRow>

              <SettingRow label="Reading Column Max Width" desc={`${settings.editorMaxWidth}px`}>
                <RangeSlider min={480} max={1400} step={20} value={settings.editorMaxWidth} onChange={(e: any) => handleUpdate({ editorMaxWidth: +e.target.value })} accent={themeColors.accent} />
              </SettingRow>

              <SettingRow label="Word Wrap" desc="Wrap text lines to fit the reading viewport">
                <Toggle checked={settings.wordWrap} onChange={v => handleUpdate({ wordWrap: v })} />
              </SettingRow>

              <SettingRow label="Copy as Markdown" desc="Ctrl+C copies raw markdown syntax rather than HTML">
                <Toggle checked={settings.copyAsMarkdown} onChange={v => handleUpdate({ copyAsMarkdown: v })} />
              </SettingRow>

              <SettingRow label="Spell Check" desc="Enable browser native spelling grammar underline">
                <Toggle checked={settings.spellCheck} onChange={v => handleUpdate({ spellCheck: v })} />
              </SettingRow>

              <SettingRow label="Auto Save" desc="Automatically save open files to disk on background interval">
                <Toggle checked={settings.autoSave} onChange={v => handleUpdate({ autoSave: v })} />
              </SettingRow>

              {settings.autoSave && (
                <SettingRow label="Auto Save Interval" desc={`Every ${settings.autoSaveInterval} seconds`}>
                  <RangeSlider min={5} max={120} step={5} value={settings.autoSaveInterval} onChange={(e: any) => handleUpdate({ autoSaveInterval: +e.target.value })} accent={themeColors.accent} />
                </SettingRow>
              )}

              <SettingRow label="Default Document Mode" desc="Preferred mode when launching files">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs">
                  <button
                    onClick={() => handleUpdate({ defaultMode: 'edit' })}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${settings.defaultMode === 'edit' ? 'bg-white dark:bg-[#121212] shadow-sm text-blue-500' : 'text-gray-500'}`}
                  >
                    Edit Mode
                  </button>
                  <button
                    onClick={() => handleUpdate({ defaultMode: 'read' })}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${settings.defaultMode === 'read' ? 'bg-white dark:bg-[#121212] shadow-sm text-blue-500' : 'text-gray-500'}`}
                  >
                    Reading Mode
                  </button>
                </div>
              </SettingRow>

              <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={async () => {
                    const res = await window.api.setAsDefault();
                    if (res.success) {
                      alert('Successfully associated MarkdownReader as the default Windows application for .md files!');
                    } else {
                      alert('Failed to register: ' + (res.error || 'Unknown error'));
                    }
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
                  style={{ backgroundColor: themeColors.accentBg, color: themeColors.accent }}
                >
                  Set as Default Windows Markdown App (.md)
                </button>
                <p className="text-[11px] text-gray-500 mt-2 text-center">
                  Links Windows Shell and Explorer icon directly to MarkdownReader.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                MarkdownReader provides publishing capabilities. You can export the active document directly to print-ready PDF, self-contained standalone HTML, or output to a physical printer.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenExport?.();
                  }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 transition-all text-left group"
                >
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                    <Download size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Open Export Studio</div>
                    <div className="text-[10px] text-gray-500">PDF, HTML, and Print tools</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    setTimeout(() => window.print(), 150);
                  }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 transition-all text-left group"
                >
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                    <Type size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Quick Print</div>
                    <div className="text-[10px] text-gray-500">Direct system printer dialog</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'keybindings' && (
            <div className="space-y-1.5">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{s.label}</span>
                  <kbd className="px-2.5 py-1 text-[11px] font-mono rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
