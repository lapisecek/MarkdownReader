import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Settings, X, Palette, Pen, Keyboard, Download, Type, Monitor,
  CheckCircle2, Wrench, RefreshCw, FileText, LayoutGrid, Menu, Check,
  Search, ChevronDown, Sparkles, Pipette
} from 'lucide-react';

export type AppTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'custom';
export type EditorFontFamily = 'sans' | 'mono' | 'serif' | 'custom';
export type DefaultEditorMode = 'smart' | 'edit' | 'read';

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
  customFontFamily: string;
  customAccentColor: string;
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
  customFontFamily: '',
  customAccentColor: '#8b5cf6',
  defaultMode: 'smart',
};

export const THEME_COLORS: Record<Exclude<AppTheme, 'custom'>, { accent: string, accentBg: string, label: string }> = {
  default: { accent: '#3b82f6', accentBg: 'rgba(59,130,246,0.12)', label: 'Default Blue' },
  ocean: { accent: '#06b6d4', accentBg: 'rgba(6,182,212,0.12)', label: 'Ocean Cyan' },
  forest: { accent: '#22c55e', accentBg: 'rgba(34,197,94,0.12)', label: 'Forest Green' },
  sunset: { accent: '#f97316', accentBg: 'rgba(249,115,22,0.12)', label: 'Sunset Orange' },
  midnight: { accent: '#a78bfa', accentBg: 'rgba(167,139,250,0.12)', label: 'Midnight Violet' },
};

export const PRESET_CUSTOM_COLORS = [
  '#ef4444', // Crimson
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#84cc16', // Lime
];

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
  <div className="flex items-center justify-between py-1 gap-4">
    <div className="flex-1">
      <div className="text-sm font-medium">{label}</div>
      {desc && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

interface SettingsModalProps {
  settings: AppSettings;
  onUpdate: (s: Partial<AppSettings>) => void;
  onClose: () => void;
  themeColors: { accent: string, accentBg: string, label?: string };
  onOpenExport?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onClose,
  themeColors,
  onOpenExport,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'editor' | 'windows' | 'export' | 'keybindings'>('appearance');
  const [winStatus, setWinStatus] = useState<any>(null);
  const [isFixingWin, setIsFixingWin] = useState(false);
  const [winToastMsg, setWinToastMsg] = useState<string | null>(null);
  const historyRef = useRef<AppSettings[]>([]);

  // Custom Color State
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorInput, setColorInput] = useState(settings.customAccentColor || '#8b5cf6');

  // Installed System Fonts State
  const [systemFonts, setSystemFonts] = useState<string[]>([]);
  const [fontSearch, setFontSearch] = useState('');
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.api?.getSystemFonts) {
      window.api.getSystemFonts().then(fonts => {
        if (Array.isArray(fonts) && fonts.length > 0) {
          setSystemFonts(fonts);
        }
      });
    }
  }, []);

  // Filter fonts by search query
  const filteredFonts = useMemo(() => {
    if (!fontSearch.trim()) return systemFonts.slice(0, 150);
    const q = fontSearch.toLowerCase();
    return systemFonts.filter(f => f.toLowerCase().includes(q)).slice(0, 150);
  }, [systemFonts, fontSearch]);

  // Close font dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setIsFontDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkWinStatus = async () => {
    if (window.api?.checkWindowsIntegration) {
      const res = await window.api.checkWindowsIntegration();
      setWinStatus(res);
    }
  };

  useEffect(() => {
    if (activeTab === 'windows') {
      checkWinStatus();
    }
  }, [activeTab]);

  const handleFixAllWin = async () => {
    setIsFixingWin(true);
    try {
      const res = await window.api.setupWindowsIntegration();
      if (res.success) {
        await checkWinStatus();
        setWinToastMsg('All Windows integrations successfully configured!');
        setTimeout(() => setWinToastMsg(null), 3000);
      }
    } catch (err: any) {
      alert('Error configuring Windows: ' + err.message);
    } finally {
      setIsFixingWin(false);
    }
  };

  const handleFixSingleWin = async (feature: 'defaultApp' | 'desktopShortcut' | 'startMenuShortcut' | 'contextMenu') => {
    try {
      const res = await window.api.setupWindowsIntegration({ [feature]: true });
      if (res.success) {
        await checkWinStatus();
        setWinToastMsg('Feature configured successfully!');
        setTimeout(() => setWinToastMsg(null), 3000);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const stabs = [
    { id: 'appearance' as const, label: 'Appearance', icon: <Palette size={15} /> },
    { id: 'editor' as const, label: 'Editor', icon: <Pen size={15} /> },
    { id: 'windows' as const, label: 'Windows', icon: <Monitor size={15} /> },
    { id: 'export' as const, label: 'Export', icon: <Download size={15} /> },
    { id: 'keybindings' as const, label: 'Shortcuts', icon: <Keyboard size={15} /> },
  ];

  const handleUpdate = (s: Partial<AppSettings>) => {
    historyRef.current.push({ ...settings });
    onUpdate(s);
  };

  const handleApplyCustomColor = (color: string) => {
    setColorInput(color);
    handleUpdate({
      theme: 'custom',
      customAccentColor: color,
    });
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
    <div className="fixed inset-0 z-[200] flex justify-center items-start py-14 sm:py-20 bg-black/50 backdrop-blur-sm px-4 select-none" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1e1e1e] shadow-2xl w-full max-w-2xl flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden rounded-2xl max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings size={18} style={{ color: themeColors.accent }} /> Settings
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tab Strip */}
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

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Selector */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Color Palette</label>
                  {settings.theme === 'custom' && (
                    <span className="text-[11px] font-mono font-semibold" style={{ color: settings.customAccentColor || '#8b5cf6' }}>
                      {settings.customAccentColor}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {/* Preset Themes */}
                  {(Object.keys(THEME_COLORS) as Array<Exclude<AppTheme, 'custom'>>).map(t => (
                    <button
                      key={t}
                      onClick={() => handleUpdate({ theme: t })}
                      className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                        settings.theme === t
                          ? 'shadow-md scale-105 bg-gray-50 dark:bg-white/[0.04]'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                      style={settings.theme === t ? { borderColor: THEME_COLORS[t].accent } : {}}
                    >
                      <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: THEME_COLORS[t].accent }} />
                      <span className="text-[10px] font-medium truncate max-w-[50px]">{THEME_COLORS[t].label.split(' ')[0]}</span>
                    </button>
                  ))}

                  {/* Custom Theme Card */}
                  <button
                    onClick={() => {
                      handleUpdate({ theme: 'custom' });
                      setShowColorPicker(true);
                    }}
                    className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border-2 transition-all group ${
                      settings.theme === 'custom'
                        ? 'shadow-md scale-105 bg-gray-50 dark:bg-white/[0.04]'
                        : 'border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500'
                    }`}
                    style={settings.theme === 'custom' ? { borderColor: settings.customAccentColor || '#8b5cf6' } : {}}
                  >
                    <div
                      className="w-5 h-5 rounded-full shadow-inner flex items-center justify-center text-white"
                      style={{
                        backgroundColor: settings.customAccentColor || '#8b5cf6',
                        boxShadow: `0 0 8px ${(settings.customAccentColor || '#8b5cf6')}60`
                      }}
                    >
                      <Sparkles size={11} />
                    </div>
                    <span className="text-[10px] font-semibold">Custom</span>
                  </button>
                </div>

                {/* Custom Color Palette Popover / Inline Box */}
                {(settings.theme === 'custom' || showColorPicker) && (
                  <div className="mt-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#161616] space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <Pipette size={14} style={{ color: settings.customAccentColor || '#8b5cf6' }} />
                        Custom Accent Color
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={colorInput}
                          onChange={e => handleApplyCustomColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                          title="Open OS Color Palette"
                        />
                        <input
                          type="text"
                          value={colorInput}
                          onChange={e => handleApplyCustomColor(e.target.value)}
                          placeholder="#8b5cf6"
                          className="w-20 px-2 py-0.5 text-xs font-mono rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#202020] text-center"
                        />
                      </div>
                    </div>

                    {/* Quick Swatches */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PRESET_CUSTOM_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => handleApplyCustomColor(c)}
                          className="w-5 h-5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-transform relative flex items-center justify-center"
                          style={{ backgroundColor: c }}
                          title={c}
                        >
                          {settings.customAccentColor?.toLowerCase() === c.toLowerCase() && (
                            <Check size={11} className="text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

                {/* Typography / Font Customization with System Fonts Search */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Editor & Reader Typography</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Choose preset styles or select any font installed on your Windows computer
                      </div>
                    </div>
                  </div>

                  {/* Standard Typeface Pills */}
                  <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs">
                    {(['sans', 'mono', 'serif'] as EditorFontFamily[]).map(f => (
                      <button
                        key={f}
                        onClick={() => handleUpdate({ fontFamily: f, customFontFamily: '' })}
                        className={`flex-1 py-1.5 rounded-lg capitalize font-medium transition-all ${
                          settings.fontFamily === f && !settings.customFontFamily
                            ? 'bg-white dark:bg-[#121212] shadow-sm font-semibold'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                        style={settings.fontFamily === f && !settings.customFontFamily ? { color: themeColors.accent } : {}}
                      >
                        {f === 'sans' ? 'Sans-Serif' : f === 'mono' ? 'Monospace' : 'Serif'}
                      </button>
                    ))}
                    <button
                      onClick={() => setIsFontDropdownOpen(p => !p)}
                      className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                        settings.customFontFamily
                          ? 'bg-white dark:bg-[#121212] shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                      style={settings.customFontFamily ? { color: themeColors.accent } : {}}
                    >
                      <Type size={13} />
                      <span className="truncate max-w-[80px]">{settings.customFontFamily || 'Installed...'}</span>
                      <ChevronDown size={12} className={`transition-transform ${isFontDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* System Fonts Dropdown Menu with Search Bar */}
                  {isFontDropdownOpen && (
                    <div
                      ref={fontDropdownRef}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#171717] shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      {/* Search Bar */}
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#202020]">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input
                          type="text"
                          value={fontSearch}
                          onChange={e => setFontSearch(e.target.value)}
                          placeholder="Search installed fonts (e.g. Cascadia, Segoe, Arial)..."
                          className="bg-transparent outline-none text-xs w-full text-gray-800 dark:text-gray-200 placeholder-gray-400"
                          autoFocus
                        />
                        {fontSearch && (
                          <button onClick={() => setFontSearch('')} className="p-0.5 text-gray-400 hover:text-gray-600">
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Font List */}
                      <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                        {filteredFonts.length === 0 ? (
                          <div className="text-xs text-center py-4 text-gray-400">No matching fonts found.</div>
                        ) : (
                          filteredFonts.map(fontName => {
                            const isSelected = settings.customFontFamily === fontName;
                            return (
                              <button
                                key={fontName}
                                onClick={() => {
                                  handleUpdate({
                                    fontFamily: 'custom',
                                    customFontFamily: fontName,
                                  });
                                  setIsFontDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition-colors ${
                                  isSelected
                                    ? 'bg-blue-500/10 font-semibold text-blue-500'
                                    : 'hover:bg-gray-100 dark:hover:bg-[#242424] text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <span style={{ fontFamily: fontName }} className="truncate max-w-[280px]">
                                  {fontName}
                                </span>
                                {isSelected && <Check size={14} className="shrink-0 text-blue-500" />}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Font Preview Sentence */}
                      {settings.customFontFamily && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                          <span className="font-semibold text-[11px] text-gray-400 uppercase tracking-wider">Preview:</span>
                          <span style={{ fontFamily: settings.customFontFamily }} className="text-sm truncate max-w-[340px] text-gray-800 dark:text-gray-200">
                            The quick brown fox jumps over the lazy dog.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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

              {/* Default Document Opening Mode */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <div className="text-sm font-medium">Default Opening Mode</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Controls whether documents open in Reading Mode or Editing Mode
                </div>
                <div className="grid grid-cols-3 gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs mt-1">
                  <button
                    onClick={() => handleUpdate({ defaultMode: 'smart' })}
                    className={`py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                      settings.defaultMode === 'smart'
                        ? 'bg-white dark:bg-[#121212] shadow-sm font-semibold'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    style={settings.defaultMode === 'smart' ? { color: themeColors.accent } : {}}
                    title="Read for new external files; Edit for files created/modified in this app"
                  >
                    Smart Auto-detect
                  </button>
                  <button
                    onClick={() => handleUpdate({ defaultMode: 'read' })}
                    className={`py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                      settings.defaultMode === 'read'
                        ? 'bg-white dark:bg-[#121212] shadow-sm font-semibold'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    style={settings.defaultMode === 'read' ? { color: themeColors.accent } : {}}
                  >
                    Always Reading
                  </button>
                  <button
                    onClick={() => handleUpdate({ defaultMode: 'edit' })}
                    className={`py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                      settings.defaultMode === 'edit'
                        ? 'bg-white dark:bg-[#121212] shadow-sm font-semibold'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    style={settings.defaultMode === 'edit' ? { color: themeColors.accent } : {}}
                  >
                    Always Editing
                  </button>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setActiveTab('windows')}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: themeColors.accentBg, color: themeColors.accent }}
                >
                  <Monitor size={15} />
                  Manage Windows Integration (File Associations, Shortcuts & Menus)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Windows Ecosystem Integration</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Configure file associations, system shortcuts, and Explorer context menus.
                  </p>
                </div>
                <button
                  onClick={checkWinStatus}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
                  title="Refresh Windows Status"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {winToastMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{winToastMsg}</span>
                </div>
              )}

              {winStatus && (
                <div className="space-y-2.5">
                  {/* Default App */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                        <FileText size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">Default File Handler (.md, .markdown)</div>
                        <div className="text-[11px] text-gray-500">Associated in Windows Shell and Registry</div>
                      </div>
                    </div>
                    {winStatus.isDefaultApp ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <Check size={13} /> Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleFixSingleWin('defaultApp')}
                        className="px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all text-white"
                        style={{ backgroundColor: themeColors.accent }}
                      >
                        Set Default
                      </button>
                    )}
                  </div>

                  {/* Desktop Shortcut */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                        <Monitor size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">Desktop Shortcut</div>
                        <div className="text-[11px] text-gray-500">MarkdownReader icon on user's Desktop</div>
                      </div>
                    </div>
                    {winStatus.hasDesktopShortcut ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <Check size={13} /> Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleFixSingleWin('desktopShortcut')}
                        className="px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all text-white"
                        style={{ backgroundColor: themeColors.accent }}
                      >
                        Create Icon
                      </button>
                    )}
                  </div>

                  {/* Start Menu Shortcut */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                        <LayoutGrid size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">Start Menu Programs</div>
                        <div className="text-[11px] text-gray-500">Searchable from Windows Start menu</div>
                      </div>
                    </div>
                    {winStatus.hasStartMenuShortcut ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <Check size={13} /> Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleFixSingleWin('startMenuShortcut')}
                        className="px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all text-white"
                        style={{ backgroundColor: themeColors.accent }}
                      >
                        Pin to Start
                      </button>
                    )}
                  </div>

                  {/* Explorer Context Menu */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                        <Menu size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">Explorer Context Menu</div>
                        <div className="text-[11px] text-gray-500">Right-click "Edit with MarkdownReader" on files & folders</div>
                      </div>
                    </div>
                    {winStatus.hasContextMenu ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <Check size={13} /> Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleFixSingleWin('contextMenu')}
                        className="px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all text-white"
                        style={{ backgroundColor: themeColors.accent }}
                      >
                        Register
                      </button>
                    )}
                  </div>

                  {/* Fix All Button */}
                  {!winStatus.allConfigured && (
                    <button
                      onClick={handleFixAllWin}
                      disabled={isFixingWin}
                      className="w-full mt-2 py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2"
                      style={{ backgroundColor: themeColors.accent }}
                    >
                      <Wrench size={15} />
                      {isFixingWin ? 'Applying Configurations...' : '1-Click Fix & Configure All'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Document Export & Sharing</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Export publication-quality PDFs, self-contained standalone HTML, or print directly.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                    <Download size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">Isolated Export Studio</h4>
                    <p className="text-[11px] text-gray-500">
                      Configure page sizes, orientation, margins, headers/footers with an accurate real-time paper preview.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    if (onOpenExport) onOpenExport();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: themeColors.accent }}
                >
                  <Download size={15} /> Open Export Studio
                </button>
              </div>
            </div>
          )}

          {activeTab === 'keybindings' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Keyboard Shortcuts</div>
              <div className="grid grid-cols-2 gap-2">
                {SHORTCUTS.map(sc => (
                  <div key={sc.label} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-[#202020] text-xs">
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[170px]">{sc.label}</span>
                    <kbd className="px-2 py-0.5 rounded bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-700 font-mono text-[10px] text-gray-600 dark:text-gray-400 shrink-0">
                      {sc.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
