import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import {
  X, Folder, File, FolderOpen, Plus, FileText, Save,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, ListTree, Book, Search, ArrowUp, ArrowDown,
  Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Terminal, Undo, Redo,
  Minus, Square, Settings,
  Keyboard, Palette, Volume2, Pen, Eye, EyeOff,
  Pencil, ChevronUp, ChevronDown, BookOpen, AlignLeft, AlignCenter, AlignRight, AlignJustify, Table as TableIcon
} from 'lucide-react';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, all } from 'lowlight';
import { SearchExtension } from './SearchExtension';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import appIconImg from '../icon.ico';

const lowlight = createLowlight(all);

/**
 * ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 */
declare global {
  interface Window {
    api: {
      onFileLoaded: (callback: (data: { filePath: string, content: string }) => void) => void;
      saveFile: (data: { filePath: string | null, content: string }) => Promise<{ success: boolean, filePath?: string }>;
      saveAsFile: (data: { content: string, defaultName?: string }) => Promise<{ success: boolean, filePath?: string }>;
      onAppCloseRequest: (callback: () => void) => void;
      closeWindowConfirmed: () => void;
      showUnsavedDialog: () => Promise<number>;
      selectDirectory: () => Promise<string | null>;
      readDirectory: (dirPath: string) => Promise<Array<{ name: string, isDirectory: boolean, path: string }>>;
      readFile: (filePath: string) => Promise<{ success: boolean, content?: string }>;
      rendererReady: () => void;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
    }
  }
}

interface Tab {
  id: string;
  filePath: string | null;
  fileName: string;
  content: string;
  isUnsaved: boolean;
  isReadOnly: boolean;
}

type AppTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight';

interface AppSettings {
  theme: AppTheme;
  isDark: boolean;
  fontSize: number;
  lineHeight: number;
  editorMaxWidth: number;
  wordWrap: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  typewriterSound: boolean;
  saveSound: boolean;
  ambientSound: boolean;
  notificationSound: boolean;
  backgroundMusic: boolean;
  backgroundMusicTrack: string;
  soundVolume: number;
  animationsEnabled: boolean;
  showStatusBar: boolean;
  sidebarWidth: number;
  spellCheck: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'default', isDark: true, fontSize: 18, lineHeight: 1.75,
  editorMaxWidth: 768, wordWrap: true, autoSave: false, autoSaveInterval: 30,
  typewriterSound: false, saveSound: true, ambientSound: false,
  notificationSound: true, backgroundMusic: false, backgroundMusicTrack: 'none',
  soundVolume: 50, animationsEnabled: true, showStatusBar: true,
  sidebarWidth: 260, spellCheck: false,
};

const THEME_COLORS: Record<AppTheme, { accent: string, accentBg: string, label: string }> = {
  default: { accent: '#3b82f6', accentBg: 'rgba(59,130,246,0.1)', label: 'Default Blue' },
  ocean: { accent: '#06b6d4', accentBg: 'rgba(6,182,212,0.1)', label: 'Ocean Cyan' },
  forest: { accent: '#22c55e', accentBg: 'rgba(34,197,94,0.1)', label: 'Forest Green' },
  sunset: { accent: '#f97316', accentBg: 'rgba(249,115,22,0.1)', label: 'Sunset Orange' },
  midnight: { accent: '#a78bfa', accentBg: 'rgba(167,139,250,0.1)', label: 'Midnight Violet' },
};

const SHORTCUTS = [
  { label: 'Save', keys: 'Ctrl+S' }, { label: 'Save As', keys: 'Ctrl+Shift+S' },
  { label: 'Minimalist Mode', keys: 'Ctrl+Alt+M' }, { label: 'Toggle Bottom Bar', keys: 'Ctrl+/' },
  { label: 'Settings', keys: 'Ctrl+,' }, { label: 'Bold', keys: 'Ctrl+B' },
  { label: 'Italic', keys: 'Ctrl+I' }, { label: 'Strikethrough', keys: 'Ctrl+Shift+X' },
  { label: 'Inline Code', keys: 'Ctrl+E' }, { label: 'Code Block', keys: 'Ctrl+Alt+C' },
  { label: 'H1 / H2 / H3', keys: 'Ctrl+Alt+1/2/3' }, { label: 'Bullet List', keys: 'Ctrl+Shift+8' },
  { label: 'Numbered List', keys: 'Ctrl+Shift+9' }, { label: 'Blockquote', keys: 'Ctrl+Shift+B' },
  { label: 'Undo / Redo', keys: 'Ctrl+Z / Ctrl+Y' },
];

const loadSettings = (): AppSettings => {
  try { const s = localStorage.getItem('mdreader-settings'); if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) }; } catch {}
  return { ...DEFAULT_SETTINGS };
};
const saveSettingsToLS = (s: AppSettings) => { try { localStorage.setItem('mdreader-settings', JSON.stringify(s)); } catch {} };

/**
 * Helper to get the parent directory path from a full path.
 */
const getParentDirectory = (dirPath: string) => {
  const parts = dirPath.split(/[/\\]/);
  if (parts.length <= 1 || (parts.length === 2 && parts[1] === '')) return null;
  parts.pop();
  return parts.join('\\');
};

/**
 * ============================================================================
 * EDITOR COMPONENT
 * Handles the actual Tiptap instance, extensions, and the Bubble Menu.
 * ============================================================================
 */

const EditorComponent = ({ tab, isActive, setUnsaved, onEditorActive, onEditorReady, onSelectionUpdate, settings }: any) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Markdown,
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: null }),
      SearchExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: tab.content,
    editable: !tab.isReadOnly,
    onUpdate: () => {
      setUnsaved(tab.id, true);
      onSelectionUpdate();
    },
    onSelectionUpdate: () => onSelectionUpdate(),
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-150px)] px-12 pt-6 pb-32 ${tab.isReadOnly ? 'cursor-default' : ''}`,
        style: `font-size: ${settings.fontSize}px; line-height: ${settings.lineHeight}`,
        spellcheck: settings.spellCheck ? 'true' : 'false',
      },
    },
  });

  useEffect(() => { if (editor) editor.setEditable(!tab.isReadOnly); }, [tab.isReadOnly, editor]);

  useEffect(() => {
    if (!editor) return;
    // @ts-ignore
    const cur = editor.storage.markdown.getMarkdown();
    if (cur !== tab.content) editor.commands.setContent(tab.content);
  }, [tab.content, editor]);

  useEffect(() => { 
    if (isActive && editor) onEditorActive(editor);
    if (editor && onEditorReady) onEditorReady(tab.id, editor);
  }, [isActive, editor, onEditorActive, onEditorReady, tab.id]);

  return (
    <div style={{ display: isActive ? 'block' : 'none' }} className="h-full w-full relative">
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
};

/* ── Small Components ── */
const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <div className={`toggle-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} />
);

const RangeSlider = ({ min, max, step, value, onChange, accent }: any) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className="w-32"
      style={{ background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, rgba(128,128,128,0.2) ${pct}%, rgba(128,128,128,0.2) 100%)` }}
    />
  );
};

const SR = ({ label, desc, children }: { label: string, desc?: string, children: React.ReactNode }) => (
  <div className="flex items-center justify-between">
    <div><div className="text-sm font-medium">{label}</div>{desc && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>}</div>
    {children}
  </div>
);

/* ── Settings Modal ── */
const SettingsModal = ({ settings, onUpdate, onClose, themeColors }: {
  settings: AppSettings, onUpdate: (s: Partial<AppSettings>) => void, onClose: () => void, themeColors: typeof THEME_COLORS[AppTheme]
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'editor' | 'keybindings' | 'sounds'>('appearance');
  const stabs = [
    { id: 'appearance' as const, label: 'Appearance', icon: <Palette size={15} /> },
    { id: 'editor' as const, label: 'Editor', icon: <Pen size={15} /> },
    { id: 'keybindings' as const, label: 'Keys', icon: <Keyboard size={15} /> },
    { id: 'sounds' as const, label: 'Sounds', icon: <Volume2 size={15} /> },
  ];

  const historyRef = useRef<AppSettings[]>([]);

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
    <div className="fixed inset-0 z-[200] flex justify-center items-start py-24 bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1e1e1e] shadow-2xl w-full max-w-2xl flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden rounded-xl max-h-full"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Settings size={18} style={{ color: themeColors.accent }} /> Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X size={18} /></button>
        </div>
        <div className="flex gap-1 px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-800 shrink-0 overflow-x-auto">
          {stabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`settings-tab flex items-center gap-2 whitespace-nowrap ${activeTab === t.id ? 'active' : ''}`}
              style={activeTab === t.id ? { color: themeColors.accent } : {}}
            >{t.icon}{t.label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5" key={activeTab}>
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">Color Theme</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(THEME_COLORS) as AppTheme[]).map(t => (
                    <button key={t} onClick={() => handleUpdate({ theme: t })}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${settings.theme === t ? 'shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                      style={settings.theme === t ? { borderColor: THEME_COLORS[t].accent } : {}}>
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: THEME_COLORS[t].accent }} />
                      <span className="text-[10px]">{THEME_COLORS[t].label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <SR label="Dark Mode" desc="Use dark color scheme"><Toggle checked={settings.isDark} onChange={v => handleUpdate({ isDark: v })} /></SR>
              <SR label="Animations" desc="Smooth transitions"><Toggle checked={settings.animationsEnabled} onChange={v => handleUpdate({ animationsEnabled: v })} /></SR>
              <SR label="Status Bar" desc="Show word/char count"><Toggle checked={settings.showStatusBar} onChange={v => handleUpdate({ showStatusBar: v })} /></SR>
            </div>
          )}
          {activeTab === 'editor' && (
            <div className="space-y-6">
              <SR label="Font Size" desc={`${settings.fontSize}px`}><RangeSlider min={12} max={28} step={1} value={settings.fontSize} onChange={(e: any) => handleUpdate({ fontSize: +e.target.value })} accent={themeColors.accent} /></SR>
              <SR label="Line Height" desc={`${settings.lineHeight}`}><RangeSlider min={1.2} max={2.5} step={0.05} value={settings.lineHeight} onChange={(e: any) => handleUpdate({ lineHeight: +e.target.value })} accent={themeColors.accent} /></SR>
              <SR label="Max Width" desc={`${settings.editorMaxWidth}px`}><RangeSlider min={480} max={1400} step={20} value={settings.editorMaxWidth} onChange={(e: any) => handleUpdate({ editorMaxWidth: +e.target.value })} accent={themeColors.accent} /></SR>
              <SR label="Word Wrap"><Toggle checked={settings.wordWrap} onChange={v => handleUpdate({ wordWrap: v })} /></SR>
              <SR label="Spell Check"><Toggle checked={settings.spellCheck} onChange={v => handleUpdate({ spellCheck: v })} /></SR>
              <SR label="Auto Save"><Toggle checked={settings.autoSave} onChange={v => handleUpdate({ autoSave: v })} /></SR>
              {settings.autoSave && <SR label="Interval" desc={`${settings.autoSaveInterval}s`}><RangeSlider min={5} max={120} step={5} value={settings.autoSaveInterval} onChange={(e: any) => handleUpdate({ autoSaveInterval: +e.target.value })} accent={themeColors.accent} /></SR>}
            </div>
          )}
          {activeTab === 'keybindings' && (
            <div className="space-y-1">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <span className="text-sm">{s.label}</span>
                  <kbd className="px-2.5 py-1 text-xs font-mono rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">{s.keys}</kbd>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'sounds' && (
            <div className="space-y-6">
              <SR label="Master Volume" desc={`${settings.soundVolume}%`}><RangeSlider min={0} max={100} step={1} value={settings.soundVolume} onChange={(e: any) => handleUpdate({ soundVolume: +e.target.value })} accent={themeColors.accent} /></SR>
              <SR label="Typewriter Sounds" desc="Click sound on keypress"><Toggle checked={settings.typewriterSound} onChange={v => handleUpdate({ typewriterSound: v })} /></SR>
              <SR label="Save Sound" desc="Chime on save"><Toggle checked={settings.saveSound} onChange={v => handleUpdate({ saveSound: v })} /></SR>
              <SR label="Notification Sounds" desc="Alert & status sounds"><Toggle checked={settings.notificationSound} onChange={v => handleUpdate({ notificationSound: v })} /></SR>
              <SR label="Ambient Sound" desc="Soft background noise"><Toggle checked={settings.ambientSound} onChange={v => handleUpdate({ ambientSound: v })} /></SR>
              <SR label="Background Music" desc="Lo-fi / calm music"><Toggle checked={settings.backgroundMusic} onChange={v => handleUpdate({ backgroundMusic: v })} /></SR>
              {settings.backgroundMusic && (
                <SR label="Music Track">
                  <select value={settings.backgroundMusicTrack} onChange={e => handleUpdate({ backgroundMusicTrack: e.target.value })}
                    className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none">
                    <option value="none">None</option>
                    <option value="lofi">Lo-Fi Beats</option>
                    <option value="rain">Rain Sounds</option>
                    <option value="forest">Forest Ambience</option>
                    <option value="cafe">Café Chatter</option>
                    <option value="piano">Soft Piano</option>
                    <option value="ocean">Ocean Waves</option>
                  </select>
                </SR>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-[#161616]">
          <button onClick={() => handleUpdate(DEFAULT_SETTINGS)} className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">Reset Defaults</button>
          <span className="text-xs text-gray-400">Auto-saved</span>
        </div>
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * MAIN APPLICATION COMPONENT
 * The core layout, state manager, and event handler for MarkdownReader.
 * ============================================================================
 */
function App() {
  /**
   * --------------------------------------------------------------------------
   * GLOBAL STATE
   * --------------------------------------------------------------------------
   */
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMinimalistMode, setIsMinimalistMode] = useState(false);
  
  // Tiptap active editor reference for toolbar commands
  const [activeEditor, setActiveEditor] = useState<any>(null);
  
  // Bottom formatting bar state
  const [isBottomBarOpen, setIsBottomBarOpen] = useState(true);
  const [selectionTick, setSelectionTick] = useState(0);
  
  // Filename editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [isStructureOpen, setIsStructureOpen] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [structureWidth, setStructureWidth] = useState(260);
  const [headings, setHeadings] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Table Size Picker State
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tablePickerLeft, setTablePickerLeft] = useState(0);
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);

  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', filePath: null, fileName: 'Untitled.md', content: '', isUnsaved: false, isReadOnly: false }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const editorsRef = useRef<Record<string, any>>({});

  const [rootDir, setRootDir] = useState<string | null>(null);
  const [currentDir, setCurrentDir] = useState<string | null>(null);
  const [dirItems, setDirItems] = useState<Array<{ name: string, isDirectory: boolean, path: string }>>([]);

  const [sidebarWidth, setSidebarWidth] = useState(settings.sidebarWidth);
  const isResizing = useRef(false);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  /**
   * --------------------------------------------------------------------------
   * THEME & EFFECTS
   * --------------------------------------------------------------------------
   */
  const themeColors = THEME_COLORS[settings.theme];
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const isReading = activeTab.isReadOnly;
  const tr = settings.animationsEnabled ? 'all 0.25s cubic-bezier(0.4,0,0.2,1)' : 'none';
  const dk = settings.isDark;

  // Apply dark mode and theme colors to the document body
  useEffect(() => { dk ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark'); }, [dk]);
  useEffect(() => { 
    document.documentElement.style.setProperty('--accent-color', themeColors.accent);
    document.documentElement.style.setProperty('--accent-bg', themeColors.accentBg);
  }, [themeColors.accent, themeColors.accentBg]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => { const next = { ...prev, ...partial }; saveSettingsToLS(next); return next; });
  }, []);

  /**
   * --------------------------------------------------------------------------
   * LAYOUT RESIZING HANDLERS
   * --------------------------------------------------------------------------
   */
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const handle = e.currentTarget as HTMLDivElement;
    const inner = handle.firstChild as HTMLDivElement;
    if (inner) inner.style.backgroundColor = 'white';
    handle.style.opacity = '1';
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
    const move = (ev: MouseEvent) => { if (isResizing.current) setSidebarWidth(Math.min(Math.max(ev.clientX, 180), 500)); };
    const up = () => { isResizing.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; document.body.classList.remove('resizing'); handle.style.opacity = ''; if (inner) inner.style.backgroundColor = ''; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, []);

  const startStructureResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const handle = e.currentTarget as HTMLDivElement;
    const inner = handle.firstChild as HTMLDivElement;
    if (inner) inner.style.backgroundColor = 'white';
    handle.style.opacity = '1';
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
    const move = (ev: MouseEvent) => { if (isResizing.current) setStructureWidth(Math.min(Math.max(window.innerWidth - ev.clientX, 150), 400)); };
    const up = () => { isResizing.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; document.body.classList.remove('resizing'); handle.style.opacity = ''; if (inner) inner.style.backgroundColor = ''; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, []);

  const startEditorResize = useCallback((e: React.MouseEvent, direction: 'left' | 'right') => {
    e.preventDefault();
    const handle = e.currentTarget as HTMLDivElement;
    // For editor handle which has an inner div, we style the inner div for color
    const inner = handle.firstChild as HTMLDivElement;
    if (inner) inner.style.backgroundColor = 'white';
    handle.style.opacity = '1';
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = settings.editorMaxWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
    const move = (ev: MouseEvent) => { 
      if (!isResizing.current) return;
      let delta = ev.clientX - startX;
      if (direction === 'left') delta = -delta;
      const newWidth = Math.min(Math.max(startWidth + delta * 2, 400), window.innerWidth - 100);
      updateSettings({ editorMaxWidth: newWidth });
    };
    const up = () => { 
      isResizing.current = false; 
      document.body.style.cursor = ''; 
      document.body.style.userSelect = ''; 
      document.body.classList.remove('resizing');
      handle.style.opacity = '';
      if (inner) inner.style.backgroundColor = '';
      document.removeEventListener('mousemove', move); 
      document.removeEventListener('mouseup', up); 
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [settings.editorMaxWidth, updateSettings]);

  useEffect(() => {
    if (!activeEditor) return;
    const newHeadings: any[] = [];
    activeEditor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading') {
        newHeadings.push({ level: node.attrs.level, text: node.textContent, pos });
      }
    });
    setHeadings(newHeadings);
  }, [activeEditor, activeTab.content]);

  /**
   * --------------------------------------------------------------------------
   * SEARCH & HIGHLIGHT LOGIC
   * Manages text searching and navigation through document matches.
   * --------------------------------------------------------------------------
   */
  useEffect(() => {
    if (!activeEditor) return;
    activeEditor.commands.setSearchTerm(searchQuery);

    if (!searchQuery) {
      setTotalMatches(0);
      return;
    }
    let count = 0;
    const regex = new RegExp(searchQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');
    activeEditor.state.doc.descendants((node: any, pos: number) => {
      if (node.isText && node.text) {
        regex.lastIndex = 0;
        while (regex.exec(node.text) !== null) {
          count++;
        }
      }
    });
    setTotalMatches(count);
  }, [activeEditor, searchQuery, selectionTick]);

  useEffect(() => {
    if (!activeEditor) return;
    activeEditor.commands.setActiveMatchIndex(searchMatchIndex);
    
    if (!searchQuery || totalMatches === 0) return;
    const matches: {start: number, end: number}[] = [];
    const regex = new RegExp(searchQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');
    activeEditor.state.doc.descendants((node: any, pos: number) => {
      if (node.isText && node.text) {
        let m;
        regex.lastIndex = 0;
        while ((m = regex.exec(node.text)) !== null) {
          matches.push({ start: pos + m.index, end: pos + m.index + m[0].length });
        }
      }
    });
    const match = matches[searchMatchIndex];
    if (match) activeEditor.chain().setTextSelection({ from: match.start, to: match.end }).scrollIntoView().run();
  }, [searchMatchIndex, searchQuery, totalMatches, activeEditor]);

  /**
   * --------------------------------------------------------------------------
   * DIRECTORY & FILE EXPLORER LOGIC
   * --------------------------------------------------------------------------
   */
  const loadDir = async (dir: string) => { const items = await window.api.readDirectory(dir); setDirItems(items); setCurrentDir(dir); };

  const handleSelectDir = async () => { const dir = await window.api.selectDirectory(); if (dir) { setRootDir(dir); loadDir(dir); } };

  const handleOpenFile = async (filePath: string) => {
    const existing = tabs.find(t => t.filePath === filePath);
    if (existing) { setActiveTabId(existing.id); return; }
    const res = await window.api.readFile(filePath);
    if (res.success && res.content !== undefined) {
      const fileName = filePath.split(/[/\\]/).pop() || 'Untitled.md';
      const newTab: Tab = { id: Date.now().toString(), filePath, fileName, content: res.content, isUnsaved: false, isReadOnly: false };
      setTabs(prev => (prev.length === 1 && !prev[0].filePath && !prev[0].content && !prev[0].isUnsaved) ? [newTab] : [...prev, newTab]);
      setActiveTabId(newTab.id);
    }
  };

  useEffect(() => {
    if (!window.api) return;
    window.api.onFileLoaded((data) => {
      setTabs(prev => {
        const existing = prev.find(t => t.filePath === data.filePath);
        if (existing) { setActiveTabId(existing.id); return prev; }
        const fileName = data.filePath.split(/[/\\]/).pop() || 'Untitled.md';
        const newTab: Tab = { id: Date.now().toString(), filePath: data.filePath, fileName, content: data.content, isUnsaved: false, isReadOnly: true };
        if (prev.length === 1 && !prev[0].filePath && !prev[0].content && !prev[0].isUnsaved) { setActiveTabId(newTab.id); return [newTab]; }
        setActiveTabId(newTab.id);
        return [...prev, newTab];
      });
    });
    window.api.onAppCloseRequest(async () => {
      const unsaved = tabsRef.current.filter(t => t.isUnsaved);
      if (unsaved.length > 0) {
        setShowCloseDialog(true);
      } else {
        window.api.closeWindowConfirmed();
      }
    });
    window.api.rendererReady();
  }, []);

  const handleCloseSaveAll = async () => {
    const unsaved = tabs.filter(t => t.isUnsaved);
    for (const t of unsaved) {
      if (t.filePath) {
        await window.api.saveFile({ filePath: t.filePath, content: t.content });
      } else {
        const defaultPath = currentDir ? `${currentDir}\\${t.fileName}` : t.fileName;
        await window.api.saveAsFile({ content: t.content, defaultName: defaultPath });
      }
    }
    setShowCloseDialog(false);
    window.api.closeWindowConfirmed();
  };

  const handleCloseDontSave = () => {
    setShowCloseDialog(false);
    window.api.closeWindowConfirmed();
  };

  const handleCloseCancel = () => {
    setShowCloseDialog(false);
  };

  /**
   * --------------------------------------------------------------------------
   * FILE SAVING LOGIC
   * Saves content to disk, avoiding serialization loops via activeEditor.
   * --------------------------------------------------------------------------
   */
  const handleSave = async (tabId: string, saveAs = false) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    // Grab the latest content if saving
    const editor = editorsRef.current[tabId];
    let contentToSave = editor ? editor.storage.markdown.getMarkdown() : tab.content;
    
    // Update state to match saved content
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, content: contentToSave } : t));
    
    // Construct default save path using currentDir if available
    let defaultPath = tab.fileName;
    if (currentDir) {
      defaultPath = `${currentDir}\\${tab.fileName}`;
    }

    const result = (saveAs || !tab.filePath)
      ? await window.api.saveAsFile({ content: contentToSave, defaultName: defaultPath })
      : await window.api.saveFile({ filePath: tab.filePath, content: contentToSave });

    if (result.success && result.filePath) {
      const fileName = result.filePath.split(/[/\\]/).pop() || 'Untitled.md';
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, filePath: result.filePath!, fileName, isUnsaved: false } : t));
      
      // Refresh explorer if a folder is open
      if (currentDir) {
        loadDir(currentDir);
      }
    }
  };

  // Auto save
  useEffect(() => {
    if (!settings.autoSave) return;
    const iv = setInterval(() => {
      tabsRef.current.forEach(t => {
        if (t.isUnsaved && t.filePath) {
          const editor = editorsRef.current[t.id];
          const contentToSave = editor ? editor.storage.markdown.getMarkdown() : t.content;
          window.api.saveFile({ filePath: t.filePath, content: contentToSave }).then(r => { 
            if (r.success) {
              setTabs(p => p.map(x => x.id === t.id ? { ...x, content: contentToSave, isUnsaved: false } : x)); 
            }
          });
        }
      });
    }, settings.autoSaveInterval * 1000);
    return () => clearInterval(iv);
  }, [settings.autoSave, settings.autoSaveInterval]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 's') { e.preventDefault(); handleSave(activeTabId, e.shiftKey); }
      if (mod && e.key === 'f') { 
        e.preventDefault(); 
        setIsSearchExpanded(true); 
        setTimeout(() => { searchInputRef.current?.focus(); searchInputRef.current?.select(); }, 50); 
      }
      if (mod && e.altKey && e.key.toLowerCase() === 'm') { e.preventDefault(); setIsMinimalistMode(p => !p); }
      if (mod && e.key === '/') { e.preventDefault(); setIsBottomBarOpen(p => !p); }
      if (mod && e.key === ',') { e.preventDefault(); setIsSettingsOpen(p => !p); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [activeTabId, tabs]);

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let nt = tabs.filter(t => t.id !== id);
    if (!nt.length) nt = [{ id: Date.now().toString(), filePath: null, fileName: 'Untitled.md', content: '', isUnsaved: false, isReadOnly: false }];
    setTabs(nt);
    if (activeTabId === id) setActiveTabId(nt[nt.length - 1].id);
  };

  const toggleReadOnly = () => setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isReadOnly: !t.isReadOnly } : t));

  // Filename editing
  const startEditingName = () => { setEditNameValue(activeTab.fileName.replace(/\.md$/, '')); setIsEditingName(true); setTimeout(() => nameInputRef.current?.select(), 50); };
  const commitNameEdit = () => {
    setIsEditingName(false);
    let name = editNameValue.trim();
    if (!name) return;
    if (!name.endsWith('.md')) name += '.md';
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t;
      const nameChanged = t.fileName !== name;
      return { 
        ...t, 
        fileName: name, 
        isUnsaved: nameChanged ? true : t.isUnsaved,
        filePath: nameChanged ? null : t.filePath
      };
    }));
  };

  const parentDir = currentDir ? getParentDirectory(currentDir) : null;
  const canGoUp = !!(parentDir && rootDir && currentDir !== rootDir);
  const folderName = rootDir ? rootDir.split(/[/\\]/).pop() : null;

  const showSidebar = !isMinimalistMode && !isReading && isSidebarOpen;
  const showStructure = (!isMinimalistMode || isReading) && isStructureOpen;
  const showTabs = !isMinimalistMode && !isReading;
  const showBottomBar = !isMinimalistMode && !isReading && isBottomBarOpen && activeEditor;
  const showFileInfo = !isMinimalistMode || isReading;

  const wordCount = activeTab.content ? activeTab.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = activeTab.content ? activeTab.content.length : 0;

  return (
    <div className={`h-screen w-screen ${dk ? 'dark' : ''} flex flex-col overflow-hidden`}
      style={{ backgroundColor: dk ? '#121212' : '#ffffff', color: dk ? '#f4f4f5' : '#111111' }}>

      {/* ── Title Bar ── */}
      <div className="h-10 flex items-center justify-between shrink-0 select-none"
        style={{ backgroundColor: dk ? '#1a1a1a' : '#e4e4e7', borderBottom: `1px solid ${dk ? '#2a2a2a' : '#d4d4d8'}`, WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center gap-2 pl-4" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <img src={appIconImg} alt="App Icon" className="w-4 h-4 object-contain" />
          <span className="text-xs font-bold uppercase tracking-[0.15em] shrink-0" style={{ color: themeColors.accent }}>MarkdownReader</span>
          {isReading && (
            <>
              <span className="text-xs shrink-0" style={{ color: dk ? '#444' : '#71717a' }}>•</span>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: themeColors.accentBg, color: themeColors.accent }}>Reading</span>
            </>
          )}
        </div>

        <div className="flex items-center h-full shrink-0 justify-end" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <WinBtn onClick={() => window.api.minimizeWindow()} icon={<Minus size={14} />} dk={dk} />
          <WinBtn onClick={() => window.api.maximizeWindow()} icon={<Square size={12} />} dk={dk} />
          <WinBtn onClick={() => window.api.closeWindow()} icon={<X size={14} />} dk={dk} isClose />
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex shrink-0 overflow-hidden" style={{ width: showSidebar ? sidebarWidth : 0, opacity: showSidebar ? 1 : 0, transition: tr }}>
          <div className="flex flex-col overflow-hidden relative w-full h-full" style={{ backgroundColor: dk ? '#151515' : '#f4f4f5', borderRight: `1px solid ${dk ? '#2a2a2a' : '#e4e4e7'}` }}>
            <div className="absolute top-0 bottom-0 -right-1.5 w-4 cursor-col-resize z-50 flex justify-center opacity-0 hover:opacity-100 transition-opacity" onMouseDown={startResize}>
              <div className="w-[2px] h-full bg-blue-500" />
            </div>
            <div className="flex justify-between items-center shrink-0 px-4 py-3" style={{ borderBottom: `1px solid ${dk ? '#2a2a2a' : '#e4e4e7'}` }}>
              <span className="font-semibold text-sm truncate">{folderName || 'Explorer'}</span>
              <div className="flex items-center gap-0.5">
                <SideBtn onClick={handleSelectDir} icon={<FolderOpen size={15} />} dk={dk} title="Open Folder" />
                <SideBtn onClick={() => setIsSidebarOpen(false)} icon={<PanelLeftClose size={15} />} dk={dk} title="Hide" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {!currentDir && (
                <div className="text-xs text-center mt-10" style={{ color: dk ? '#555' : '#71717a' }}>
                  No folder opened.<br />
                  <button onClick={handleSelectDir} className="mt-3 px-3 py-1.5 text-xs rounded-lg transition-colors" style={{ backgroundColor: themeColors.accentBg, color: themeColors.accent }}>Open Folder</button>
                </div>
              )}
              {canGoUp && <DirItem name=".." icon={<FolderOpen size={15} className="text-yellow-500" />} onClick={() => loadDir(parentDir!)} dk={dk} />}
              {dirItems.map((item, i) => (
                <DirItem key={i} name={item.name}
                  icon={item.isDirectory ? <Folder size={15} style={{ color: themeColors.accent }} /> : <FileText size={15} style={{ color: dk ? '#52525b' : '#71717a' }} />}
                  onClick={() => { if (item.isDirectory) loadDir(item.path); else if (item.name.endsWith('.md')) handleOpenFile(item.path); }}
                  dk={dk} disabled={!item.isDirectory && !item.name.endsWith('.md')} />
              ))}
            </div>
          </div>
        </div>

        {/* Editor Panel */}
        <div className="flex-1 flex flex-col overflow-hidden relative" style={{ backgroundColor: dk ? '#101010' : '#f9fafb' }}>
          {/* Tab bar */}
          <div className="shrink-0 overflow-hidden" style={{
            maxHeight: showTabs ? 40 : 0, opacity: showTabs ? 1 : 0, transition: tr,
            backgroundColor: dk ? '#1a1a1a' : '#e4e4e7', borderBottom: showTabs ? `1px solid ${dk ? '#2a2a2a' : '#d4d4d8'}` : 'none'
          }}>
            <div className="flex items-center h-[37px] overflow-x-auto" onWheel={e => { e.currentTarget.scrollLeft += e.deltaY; }}>
              {!isSidebarOpen && <SideBtn onClick={() => setIsSidebarOpen(true)} icon={<PanelLeftOpen size={15} />} dk={dk} title="Show Sidebar"
                className="shrink-0 h-full" style={{ borderRight: `1px solid ${dk ? '#2a2a2a' : '#d4d4d8'}` }} />}
              {tabs.map(tab => (
                <div key={tab.id} onClick={() => setActiveTabId(tab.id)}
                  className="flex items-center gap-2 px-4 h-full cursor-pointer min-w-[120px] max-w-[200px] transition-colors shrink-0"
                  style={{
                    borderRight: `1px solid ${dk ? '#2a2a2a' : '#d4d4d8'}`,
                    backgroundColor: activeTabId === tab.id ? (dk ? '#121212' : '#ffffff') : 'transparent',
                    color: activeTabId === tab.id ? themeColors.accent : (dk ? '#888' : '#52525b'),
                    borderBottom: activeTabId === tab.id ? `2px solid ${themeColors.accent}` : '2px solid transparent',
                  }}>
                  {tab.isReadOnly ? <BookOpen size={13} className="shrink-0" /> : <File size={13} className="shrink-0" />}
                  <span className="truncate flex-1 text-sm font-medium">{tab.fileName}</span>
                  {tab.isUnsaved && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: themeColors.accent }} />}
                  <button onClick={e => closeTab(tab.id, e)} className="p-0.5 rounded-full shrink-0 opacity-60 hover:opacity-100 transition-opacity"><X size={12} /></button>
                </div>
              ))}
              <button onClick={() => { const t: Tab = { id: Date.now().toString(), filePath: null, fileName: 'Untitled.md', content: '', isUnsaved: false, isReadOnly: false }; setTabs([...tabs, t]); setActiveTabId(t.id); }}
                className="p-2.5 shrink-0 h-full" style={{ color: dk ? '#52525b' : '#71717a' }}><Plus size={15} /></button>
            </div>
          </div>

          {/* File info bar */}
          <div className="shrink-0 overflow-hidden" style={{
            maxHeight: showFileInfo ? 60 : 0, opacity: showFileInfo ? 1 : 0, transition: tr,
            backgroundColor: dk ? '#161616' : '#f5f5f5', borderBottom: showFileInfo ? `1px solid ${dk ? '#2a2a2a' : '#e0e0e0'}` : 'none'
          }}>
            <div className="flex items-center justify-between px-6 py-2 shrink-0 h-[45px]">
              <div className="flex items-center gap-3 overflow-hidden">
                {isEditingName ? (
                  <input ref={nameInputRef} value={editNameValue} onChange={e => setEditNameValue(e.target.value)}
                    onBlur={commitNameEdit} onKeyDown={e => { if (e.key === 'Enter') commitNameEdit(); if (e.key === 'Escape') setIsEditingName(false); }}
                    className="text-xs font-mono bg-transparent border-b outline-none px-1 py-0.5"
                    style={{ borderColor: themeColors.accent, color: dk ? '#ccc' : '#27272a', width: Math.max(80, editNameValue.length * 7) }} autoFocus />
                ) : (
                  <div className="flex items-center gap-1 cursor-pointer group" onClick={startEditingName} title="Click to rename file">
                    <span className="truncate font-mono text-xs" style={{ color: dk ? '#52525b' : '#71717a' }}>{activeTab.filePath || activeTab.fileName}</span>
                    <Pencil size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: dk ? '#888' : '#52525b' }} />
                  </div>
                )}
                {activeTab.isUnsaved && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full" style={{ backgroundColor: themeColors.accentBg, color: themeColors.accent }}>UNSAVED</span>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Search Bar */}
                {isReading && !isSearchExpanded ? (
                  <button onClick={() => { setIsSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 50); }} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <Search size={14} style={{ color: dk ? '#52525b' : '#71717a' }} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors" 
                    style={{ backgroundColor: dk ? '#222' : '#ffffff', border: `1px solid ${dk ? '#27272a' : '#ddd'}`, width: (isReading ? '200px' : '260px'), boxShadow: dk ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                    <Search size={14} style={{ color: dk ? '#52525b' : '#71717a' }} />
                    <input ref={searchInputRef} type="text" placeholder="Search..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSearchMatchIndex(0); }}
                      onBlur={() => { if (isReading && !searchQuery) setIsSearchExpanded(false); }}
                      className="bg-transparent outline-none text-xs flex-1 w-full" style={{ color: dk ? '#ccc' : '#27272a' }} />
                    {searchQuery && (
                      <div className="flex items-center gap-1 ml-1 shrink-0">
                        <span className="text-[10px] font-mono whitespace-nowrap" style={{ color: dk ? '#52525b' : '#71717a' }}>{totalMatches > 0 ? searchMatchIndex + 1 : 0} of {totalMatches}</span>
                        <button onClick={() => setSearchMatchIndex(p => p > 0 ? p - 1 : (totalMatches > 0 ? totalMatches - 1 : 0))} className="p-0.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10"><ArrowUp size={12} style={{ color: dk ? '#71717a' : '#555' }} /></button>
                        <button onClick={() => setSearchMatchIndex(p => p < totalMatches - 1 ? p + 1 : 0)} className="p-0.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10"><ArrowDown size={12} style={{ color: dk ? '#71717a' : '#555' }} /></button>
                        <button onClick={() => { setSearchQuery(''); if (isReading) setIsSearchExpanded(false); }} className="p-0.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 ml-0.5"><X size={12} style={{ color: dk ? '#71717a' : '#555' }} /></button>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {!isReading && (
                    <>
                      <button onClick={() => handleSave(activeTabId)} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all"
                        style={{ backgroundColor: themeColors.accentBg, color: themeColors.accent }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = themeColors.accent; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = themeColors.accentBg; e.currentTarget.style.color = themeColors.accent; }}>
                        <Save size={12} /> Save
                      </button>
                      <div className="w-px h-4 mx-0.5" style={{ backgroundColor: dk ? '#27272a' : '#ccc' }} />
                    </>
                  )}
                  <SideBtn onClick={() => setIsStructureOpen(p => !p)} icon={isStructureOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />} dk={dk} title="Toggle Outline" />
                </div>
              </div>
            </div>
          </div>

          {/* Editor area */}
          <div className="flex-1 overflow-y-auto relative py-6 px-6">
            <div className="mx-auto w-full min-h-full transition-all duration-300 relative group" 
                 style={{ 
                   maxWidth: settings.editorMaxWidth, 
                   backgroundColor: dk ? '#151515' : '#ffffff',
                   border: `1px solid ${dk ? '#222' : '#e5e7eb'}`,
                   boxShadow: dk ? 'none' : '0 1px 3px rgba(0,0,0,0.02)'
                 }}>
              <div className="absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize opacity-0 group-hover:opacity-30 hover:!opacity-100 flex items-center justify-center z-10 transition-opacity" onMouseDown={e => startEditorResize(e, 'left')}>
                <div className="h-12 w-1 rounded-full bg-gray-400 dark:bg-gray-500 hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors" />
              </div>
              <div className="absolute top-0 bottom-0 -right-2 w-4 cursor-ew-resize opacity-0 group-hover:opacity-30 hover:!opacity-100 flex items-center justify-center z-10 transition-opacity" onMouseDown={e => startEditorResize(e, 'right')}>
                <div className="h-12 w-1 rounded-full bg-gray-400 dark:bg-gray-500 hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors" />
              </div>
              {tabs.map(tab => (
                <EditorComponent key={tab.id} tab={tab} isActive={activeTabId === tab.id}
                  setUnsaved={(id: string, s: boolean) => setTabs(p => p.map(t => t.id === id ? { ...t, isUnsaved: s } : t))}
                  onEditorActive={setActiveEditor} 
                  onEditorReady={(id: string, ed: any) => { editorsRef.current[id] = ed; }}
                  onSelectionUpdate={() => setSelectionTick(p => p + 1)} settings={settings} />
              ))}
            </div>
          </div>

          {/* Bottom-left bar toggle */}
          {!isMinimalistMode && !isReading && (
            <button onClick={() => setIsBottomBarOpen(p => !p)}
              className="absolute left-4 flex items-center justify-center p-1 rounded-t-md z-10 opacity-40 hover:opacity-100 transition-opacity"
              style={{
                bottom: showBottomBar ? 44 : 0, transition: tr,
                backgroundColor: dk ? '#1a1a1a' : '#e4e4e7',
                color: dk ? '#888' : '#52525b',
                border: `1px solid ${dk ? '#2a2a2a' : '#d4d4d8'}`,
                borderBottom: 'none',
              }} title="Toggle Formatting (Ctrl+/)">
              {isBottomBarOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}

          {/* Bottom formatting bar */}
          <div className="shrink-0 overflow-hidden relative z-20" style={{
            maxHeight: showBottomBar ? 44 : 0, opacity: showBottomBar ? 1 : 0, transition: tr,
            backgroundColor: dk ? '#1a1a1a' : '#e4e4e7', borderTop: showBottomBar ? `1px solid ${dk ? '#2a2a2a' : '#d4d4d8'}` : 'none',
          }}>
            {activeEditor && (
              <div key={selectionTick} className="h-[43px] flex items-center justify-between px-4 select-none">
                <div className="flex items-center gap-1 overflow-x-auto flex-1 py-1" onWheel={e => { e.currentTarget.scrollLeft += e.deltaY; }}>
                  <TB e={activeEditor} a="toggleBold" on={activeEditor.isActive('bold')} icon={<Bold size={13} />} t="Bold" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleItalic" on={activeEditor.isActive('italic')} icon={<Italic size={13} />} t="Italic" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleStrike" on={activeEditor.isActive('strike')} icon={<Strikethrough size={13} />} t="Strike" ac={themeColors.accent} dk={dk} />
                  <Sep dk={dk} />
                  <TB e={activeEditor} a="toggleHeading" args={{level:1}} on={activeEditor.isActive('heading',{level:1})} icon={<span className="text-[10px] font-bold">H1</span>} t="H1" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleHeading" args={{level:2}} on={activeEditor.isActive('heading',{level:2})} icon={<span className="text-[10px] font-bold">H2</span>} t="H2" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleHeading" args={{level:3}} on={activeEditor.isActive('heading',{level:3})} icon={<span className="text-[10px] font-bold">H3</span>} t="H3" ac={themeColors.accent} dk={dk} />
                  <Sep dk={dk} />
                  <TB e={activeEditor} a="toggleBulletList" on={activeEditor.isActive('bulletList')} icon={<List size={13} />} t="Bullets" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleOrderedList" on={activeEditor.isActive('orderedList')} icon={<ListOrdered size={13} />} t="Numbers" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleBlockquote" on={activeEditor.isActive('blockquote')} icon={<Quote size={13} />} t="Quote" ac={themeColors.accent} dk={dk} />
                  <Sep dk={dk} />
                  <TB e={activeEditor} a="toggleCode" on={activeEditor.isActive('code')} icon={<Code size={13} />} t="Code" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleCodeBlock" on={activeEditor.isActive('codeBlock')} icon={<Terminal size={13} />} t="Block" ac={themeColors.accent} dk={dk} />
                  <Sep dk={dk} />
                  <TB e={activeEditor} a="setTextAlign" args="left" on={activeEditor.isActive({textAlign:'left'})} icon={<AlignLeft size={13} />} t="Align Left" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="setTextAlign" args="center" on={activeEditor.isActive({textAlign:'center'})} icon={<AlignCenter size={13} />} t="Align Center" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="setTextAlign" args="right" on={activeEditor.isActive({textAlign:'right'})} icon={<AlignRight size={13} />} t="Align Right" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="setTextAlign" args="justify" on={activeEditor.isActive({textAlign:'justify'})} icon={<AlignJustify size={13} />} t="Justify" ac={themeColors.accent} dk={dk} />
                  <Sep dk={dk} />
                  
                  {/* Table Size Picker */}
                  <div className="relative flex items-center justify-center h-full">
                    <button 
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTablePickerLeft(rect.left + rect.width / 2);
                        setShowTablePicker(p => !p);
                      }} 
                      className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex flex-col items-center justify-center relative group"
                      style={{ color: activeEditor.isActive('table') ? themeColors.accent : (dk ? '#ccc' : '#444') }}
                      title="Insert Table"
                    >
                      <TableIcon size={13} />
                    </button>
                    
                    {showTablePicker && (
                      <div className="fixed bottom-14 p-3 border shadow-2xl rounded-xl z-50 transition-all animate-in fade-in slide-in-from-bottom-2"
                        style={{ left: tablePickerLeft, transform: 'translateX(-50%)', backgroundColor: dk ? '#1e1e1e' : '#ffffff', borderColor: dk ? '#333' : '#e5e7eb' }}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: dk ? '#aaa' : '#666' }}>
                            {hoverCol > 0 && hoverRow > 0 ? `${hoverCol} x ${hoverRow} Table` : 'Select Size'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1" onMouseLeave={() => { setHoverCol(0); setHoverRow(0); }}>
                          {Array.from({ length: 8 }).map((_, r) => (
                            <div key={r} className="flex gap-1">
                              {Array.from({ length: 8 }).map((_, c) => {
                                const isHovered = r < hoverRow && c < hoverCol;
                                return (
                                  <div key={c}
                                    onMouseEnter={() => { setHoverRow(r + 1); setHoverCol(c + 1); }}
                                    onClick={() => {
                                      activeEditor.chain().focus().insertTable({ rows: hoverRow, cols: hoverCol, withHeaderRow: true }).run();
                                      setShowTablePicker(false);
                                      setHoverCol(0);
                                      setHoverRow(0);
                                    }}
                                    className="w-4 h-4 rounded-[3px] border cursor-pointer transition-all duration-75"
                                    style={{
                                      backgroundColor: isHovered ? themeColors.accentBg : (dk ? '#2a2a2a' : '#f4f4f5'),
                                      borderColor: isHovered ? themeColors.accent : (dk ? '#3f3f46' : '#e4e4e7'),
                                    }}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Sep dk={dk} />
                  <TB e={activeEditor} a="undo" on={false} icon={<Undo size={13} />} t="Undo" ac={themeColors.accent} dk={dk} dis={!activeEditor.can().undo()} />
                  <TB e={activeEditor} a="redo" on={false} icon={<Redo size={13} />} t="Redo" ac={themeColors.accent} dk={dk} dis={!activeEditor.can().redo()} />
                </div>
                {settings.showStatusBar && (
                  <div className="flex items-center gap-3 ml-4 shrink-0 text-[11px]" style={{ color: dk ? '#555' : '#71717a' }}>
                    <span>{wordCount} words</span><span>{charCount} chars</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar (Structure) */}
        <div className="flex shrink-0 overflow-hidden" style={{ width: showStructure ? structureWidth : 0, opacity: showStructure ? 1 : 0, transition: tr }}>
          <div className="flex flex-col overflow-hidden w-full h-full relative" style={{ backgroundColor: dk ? '#151515' : '#f4f4f5', borderLeft: `1px solid ${dk ? '#2a2a2a' : '#e4e4e7'}` }}>
            <div className="absolute top-0 bottom-0 -left-1.5 w-4 cursor-col-resize z-50 flex justify-center opacity-0 hover:opacity-100 transition-opacity" onMouseDown={startStructureResize}>
              <div className="w-[2px] h-full bg-blue-500" />
            </div>
            <div className="flex justify-between items-center shrink-0 px-4 py-3" style={{ borderBottom: `1px solid ${dk ? '#2a2a2a' : '#e4e4e7'}` }}>
              <span className="font-semibold text-sm truncate">Outline</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {headings.length === 0 ? (
                <div className="text-xs text-center mt-10" style={{ color: dk ? '#555' : '#71717a' }}>No headings found.</div>
              ) : (
                headings.map((h, i) => (
                  <div key={i} className="text-[11px] py-1.5 pr-2 rounded-md cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 truncate"
                    style={{ 
                      paddingLeft: `${(h.level - 1) * 12 + 8}px`, 
                      color: dk ? '#ffffff' : '#000000',
                      opacity: Math.max(1 - (h.level - 1) * 0.25, 0.3)
                    }}
                    onClick={() => {
                       activeEditor?.chain().focus().setTextSelection(h.pos).scrollIntoView().run();
                    }}>
                    {h.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Buttons ── */}
      <div className="fixed flex flex-col gap-2.5 z-50" style={{ right: showStructure ? structureWidth + 20 : 20, bottom: showBottomBar ? 56 : 16, transition: tr }}>
        {isReading ? (
          <FAB onClick={toggleReadOnly} icon={<Pencil size={17} />} title="Switch to Edit Mode" on accent={themeColors.accent} bg={themeColors.accentBg} dk={dk} anim={settings.animationsEnabled} />
        ) : (
          <>
            <FAB onClick={toggleReadOnly} icon={<BookOpen size={17} />} title="Reading Mode" on={false} accent={themeColors.accent} bg={themeColors.accentBg} dk={dk} anim={settings.animationsEnabled} />
            <FAB onClick={() => setIsMinimalistMode(p => !p)} icon={isMinimalistMode ? <Eye size={17} /> : <EyeOff size={17} />} title="Minimalist" on={isMinimalistMode} accent={themeColors.accent} bg={themeColors.accentBg} dk={dk} anim={settings.animationsEnabled} />
          </>
        )}
        <FAB onClick={() => setIsSettingsOpen(true)} icon={<Settings size={17} />} title="Settings (Ctrl+,)" on={false} accent={themeColors.accent} bg={themeColors.accentBg} dk={dk} anim={settings.animationsEnabled} />
      </div>

      {isSettingsOpen && <SettingsModal settings={settings} onUpdate={updateSettings} onClose={() => setIsSettingsOpen(false)} themeColors={themeColors} />}

      {/* Unsaved Changes Custom Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-xl flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl"
            style={{ animation: settings.animationsEnabled ? 'settingsAppear 0.2s cubic-bezier(0.16,1,0.3,1)' : 'none' }}>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161616]">
              <div className="p-1.5 rounded-full" style={{ backgroundColor: themeColors.accentBg, color: themeColors.accent }}><Save size={16} /></div>
              <h2 className="text-sm font-semibold">Unsaved Changes</h2>
            </div>
            <div className="px-5 py-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                You have unsaved changes in one or more files. Do you want to save them before closing?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161616]">
              <button onClick={handleCloseCancel} className="px-4 py-1.5 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleCloseDontSave} className="px-4 py-1.5 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Don't Save</button>
              <button onClick={handleCloseSaveAll} className="px-4 py-1.5 text-sm font-medium rounded-lg text-white shadow-sm transition-all"
                style={{ backgroundColor: themeColors.accent }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>
                Save All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared Components ── */
const Sep = ({ dk }: { dk: boolean }) => <div className="w-px h-5 mx-1" style={{ backgroundColor: dk ? '#27272a' : '#ccc' }} />;

const WinBtn = ({ onClick, icon, dk, isClose }: any) => (
  <button onClick={onClick} className="flex items-center justify-center w-12 h-full transition-colors" style={{ color: dk ? '#888' : '#52525b' }}
    onMouseEnter={e => { e.currentTarget.style.backgroundColor = isClose ? '#e81123' : (dk ? '#2a2a2a' : '#e4e4e7'); if (isClose) e.currentTarget.style.color = '#fff'; }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = dk ? '#888' : '#52525b'; }}>{icon}</button>
);

const SideBtn = ({ onClick, icon, dk, title, className, style }: any) => (
  <button onClick={onClick} className={`p-1.5 rounded-md transition-colors ${className || ''}`} style={{ color: dk ? '#71717a' : '#555', ...style }}
    onMouseEnter={e => { e.currentTarget.style.backgroundColor = dk ? '#2a2a2a' : '#ddd'; }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }} title={title}>{icon}</button>
);

const DirItem = ({ name, icon, onClick, dk, disabled }: any) => (
  <div className={`flex items-center gap-2 text-sm p-1.5 rounded-md cursor-pointer transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    onClick={disabled ? undefined : onClick}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = dk ? '#2a2a2a' : '#e0e0e0'; }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
    <span className="shrink-0">{icon}</span><span className="truncate">{name}</span>
  </div>
);

const TB = ({ e, a, args, on, icon, t, ac, dk, dis }: any) => (
  <button onClick={() => { if (dis) return; const c = e.chain().focus(); args ? c[a](args).run() : c[a]().run(); }} disabled={dis}
    className="p-1.5 rounded-md transition-colors flex items-center justify-center min-w-[28px]"
    style={{ backgroundColor: on ? (dk ? '#2a2a2a' : '#fff') : 'transparent', color: on ? ac : (dk ? '#888' : '#52525b'), opacity: dis ? 0.3 : 1, boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}
    onMouseEnter={e => { if (!on && !dis) (e.currentTarget as HTMLElement).style.backgroundColor = dk ? '#2a2a2a' : '#d8d8d8'; }}
    onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }} title={t}>{icon}</button>
);

const FAB = ({ onClick, icon, title, on, accent, bg, dk, anim }: any) => (
  <button onClick={onClick} className="p-2.5 rounded-full backdrop-blur-md shadow-lg flex items-center justify-center"
    style={{ backgroundColor: on ? bg : (dk ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)'), color: on ? accent : (dk ? '#888' : '#52525b'), border: `1px solid ${on ? accent + '40' : (dk ? '#27272a' : '#ddd')}`, transition: anim ? 'all 0.2s ease' : 'none' }}
    onMouseEnter={e => { if (anim) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.color = accent; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.color = on ? accent : (dk ? '#888' : '#52525b'); }} title={title}>{icon}</button>
);

export default App;
