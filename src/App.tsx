import { useEffect, useState, useRef, useCallback, Fragment } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import {
  X, Folder, File, FolderOpen, Plus, FileText, Save,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Search, ArrowUp, ArrowDown,
  Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Terminal, Undo, Redo,
  Minus, Square, Settings, Copy as CopyAllIcon,
  Eye, EyeOff,
  Pencil, ChevronUp, ChevronDown, BookOpen, AlignLeft, AlignCenter, AlignRight, AlignJustify, Table as TableIcon,
  Link2, Image as ImageIcon, CheckSquare, Highlighter, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, Asterisk, ListMinus, Download
} from 'lucide-react';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import { SearchExtension } from './SearchExtension';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { CustomImage } from './extensions/CustomImage';
import { CustomTaskList, CustomTaskItem } from './extensions/TaskLists';
import { CustomHighlight, CustomSubscript, CustomSuperscript } from './extensions/Marks';
import { CustomHeading } from './extensions/Heading';
import { FootnoteReference, Footnote, FootnoteContainer, FootnoteSep } from './extensions/Footnotes';
import { DefList, DefTerm, DefDescription } from './extensions/DefList';
import { Emoji } from './extensions/Emoji';
import { MathInline, MathBlock } from './extensions/MathExtension';
import { FullscreenImageViewer } from './components/FullscreenImageViewer';
import { SettingsModal, type AppSettings, DEFAULT_SETTINGS, THEME_COLORS } from './components/settings/SettingsModal';
import { ExportModal } from './components/editor/ExportModal';
import { WindowsIntegrationToast } from './components/WindowsIntegrationToast';
import { renderMermaidDiagrams } from './utils/renderMermaid';
import appIconImg from '../icon.ico';

const lowlight = createLowlight(common);

/**
 * ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 */
declare global {
  interface Window {
    api: {
      onFileLoaded: (callback: (data: { filePath: string, content: string }) => void) => void;
      saveFile: (data: { filePath: string | null, content: string }) => Promise<{ success: boolean, filePath?: string, error?: string }>;
      saveAsFile: (data: { content: string, defaultName?: string }) => Promise<{ success: boolean, filePath?: string, error?: string, canceled?: boolean }>;
      onAppCloseRequest: (callback: () => void) => void;
      closeWindowConfirmed: () => void;
      showUnsavedDialog: () => Promise<number>;
      selectDirectory: () => Promise<string | null>;
      readDirectory: (dirPath: string) => Promise<Array<{ name: string, isDirectory: boolean, path: string }>>;
      readFile: (filePath: string) => Promise<{ success: boolean, content?: string, error?: string }>;
      rendererReady: () => void;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      setAsDefault: () => Promise<{ success: boolean; error?: string }>;
      exportToPDF: (options: { defaultName?: string, pageSize?: string }) => Promise<{ success: boolean, filePath?: string, error?: string, canceled?: boolean }>;
      saveAssetImage: (data: { base64Data: string, activeFilePath: string | null, fileName?: string }) => Promise<{ success: boolean, relativePath?: string, fullPath?: string, error?: string }>;
      onWindowStateChange: (callback: (state: { isMaximized: boolean }) => void) => void;
      checkWindowsIntegration: () => Promise<{
        isSupported: boolean;
        isDefaultApp: boolean;
        hasDesktopShortcut: boolean;
        hasStartMenuShortcut: boolean;
        hasContextMenu: boolean;
        allConfigured: boolean;
        error?: string;
      }>;
      setupWindowsIntegration: (options?: {
        defaultApp?: boolean;
        desktopShortcut?: boolean;
        startMenuShortcut?: boolean;
        contextMenu?: boolean;
      }) => Promise<{ success: boolean; results: any; error?: string }>;
      onDirectoryLoaded: (callback: (dirPath: string) => void) => void;
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



const loadSettings = (): AppSettings => {
  try { const s = localStorage.getItem('mdreader-settings'); if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) }; } catch {}
  return { ...DEFAULT_SETTINGS };
};
const saveSettingsToLS = (s: AppSettings) => { try { localStorage.setItem('mdreader-settings', JSON.stringify(s)); } catch {} };

const scrollTargets = new WeakMap<HTMLElement, { target: number, current: number, raf: number }>();
const smoothScroll = (el: HTMLElement, delta: number) => {
  let state = scrollTargets.get(el);
  if (!state) {
    state = { target: el.scrollLeft, current: el.scrollLeft, raf: 0 };
    scrollTargets.set(el, state);
  }
  state.target += delta * 1.5;
  state.target = Math.max(0, Math.min(state.target, el.scrollWidth - el.clientWidth));
  
  if (!state.raf) {
    const step = () => {
      state.current += (state.target - state.current) * 0.15;
      el.scrollLeft = state.current;
      if (Math.abs(state.target - state.current) < 0.5) {
        state.current = state.target;
        el.scrollLeft = state.target;
        state.raf = 0;
      } else {
        state.raf = requestAnimationFrame(step);
      }
    };
    state.raf = requestAnimationFrame(step);
  }
};

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
      StarterKit.configure({ codeBlock: false, heading: false }),
      CustomHeading,
      Markdown,
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: null }),
      SearchExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      CustomImage,
      CustomTaskList,
      CustomTaskItem.configure({ nested: true }),
      CustomHighlight,
      CustomSubscript,
      CustomSuperscript,
      FootnoteSep,
      FootnoteContainer,
      FootnoteReference,
      Footnote,
      DefList,
      DefTerm,
      DefDescription,
      Emoji,
      MathInline,
      MathBlock,
    ],
    content: tab.content,
    editable: !tab.isReadOnly,
    onUpdate: () => {
      setUnsaved(tab.id, true);
      onSelectionUpdate();
    },
    onSelectionUpdate: () => {
      onSelectionUpdate();
    },
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-150px)] px-12 pt-6 pb-32 ${tab.isReadOnly ? 'cursor-default' : ''}`,
        style: `font-size: ${settings.fontSize}px; line-height: ${settings.lineHeight}; font-family: ${settings.fontFamily === 'mono' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : settings.fontFamily === 'serif' ? 'Georgia, Cambria, "Times New Roman", Times, serif' : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}`,
        spellcheck: settings.spellCheck ? 'true' : 'false',
      },
      handleDOMEvents: {
        click: (view, event) => {
          const target = event.target as HTMLElement;
          // Fullscreen image on click
          if (target.tagName === 'IMG' && target.hasAttribute('src')) {
            window.dispatchEvent(new CustomEvent('open-fullscreen-image', { detail: (target as HTMLImageElement).src }));
            return true;
          }
          // Footnote reference -> scroll to footnote definition
          const fnRef = target.closest('.footnote-ref');
          if (fnRef) {
            const id = fnRef.getAttribute('data-footnote-ref-id');
            if (id) {
              const fn = document.querySelector(`.footnote-item[data-footnote-id="${id}"]`);
              if (fn) {
                fn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                fn.classList.add('search-result-active');
                setTimeout(() => fn.classList.remove('search-result-active'), 1500);
              }
            }
            event.preventDefault();
            event.stopPropagation();
            return true;
          }
          // Footnote item -> scroll back to reference
          const fnItem = target.closest('.footnote-item');
          if (fnItem) {
            const id = fnItem.getAttribute('data-footnote-id');
            if (id) {
              const ref = document.querySelector(`.footnote-ref[data-footnote-ref-id="${id}"]`);
              if (ref) {
                ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
                ref.classList.add('search-result-active');
                setTimeout(() => ref.classList.remove('search-result-active'), 1500);
              }
            }
            event.preventDefault();
            event.stopPropagation();
            return true;
          }
          // Checkbox toggle in reading mode
          if (tab.isReadOnly) {
            const checkbox = target.closest('input[type="checkbox"]') || (target.closest('label') ? target.closest('label')?.querySelector('input[type="checkbox"]') : null);
            if (checkbox || target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
              const listItem = target.closest('li[data-type="taskItem"]');
              if (listItem) {
                try {
                  const pos = view.posAtDOM(listItem, 0);
                  const node = view.state.doc.nodeAt(pos);
                  if (node && node.type.name === 'taskItem') {
                    const wasEditable = view.editable;
                    if (!wasEditable) {
                      (view as any).setProps({ editable: () => true });
                    }
                    view.dispatch(view.state.tr.setNodeMarkup(pos, null, { ...node.attrs, checked: !node.attrs.checked }));
                    if (!wasEditable) {
                      (view as any).setProps({ editable: () => false });
                    }
                    event.preventDefault();
                    return true;
                  }
                } catch (err) {
                  console.error('Checkbox toggle error:', err);
                }
              }
            }
          }
          return false;
        },
        paste: (view, event) => {
          const items = event.clipboardData?.items;
          if (items) {
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                  event.preventDefault();
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const base64Data = reader.result as string;
                    const res = await window.api.saveAssetImage({
                      base64Data,
                      activeFilePath: tab.filePath,
                      fileName: `image-${Date.now()}.png`
                    });
                    if (res.success && res.relativePath) {
                      const editorInstance = (view as any)._props?.editor;
                      if (editorInstance) {
                        editorInstance.chain().focus().setImage({ src: res.relativePath, alt: 'Pasted Image' }).run();
                      }
                      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Pasted image saved into assets!' }));
                    }
                  };
                  reader.readAsDataURL(file);
                  return true;
                }
              }
            }
          }
          return false;
        },
        drop: (view, event) => {
          const files = event.dataTransfer?.files;
          if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
              event.preventDefault();
              const reader = new FileReader();
              reader.onload = async () => {
                const base64Data = reader.result as string;
                const res = await window.api.saveAssetImage({
                  base64Data,
                  activeFilePath: tab.filePath,
                  fileName: file.name || `image-${Date.now()}.png`
                });
                if (res.success && res.relativePath) {
                  const editorInstance = (view as any)._props?.editor;
                  if (editorInstance) {
                    editorInstance.chain().focus().setImage({ src: res.relativePath, alt: file.name }).run();
                  }
                  window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Dropped image saved into assets!' }));
                }
              };
              reader.readAsDataURL(file);
              return true;
            }
          }
          return false;
        },
        copy: (view, event) => {
          if (settings.copyAsMarkdown && !view.state.selection.empty && event.clipboardData) {
            try {
              const tempEditor = new Editor({
                extensions: (view as any)._props.editor.extensionManager.extensions,
                content: { type: 'doc', content: view.state.selection.content().toJSON() }
              });
              const md = (tempEditor.storage as any).markdown.getMarkdown();
              tempEditor.destroy();
              event.clipboardData.setData('text/plain', md);
              window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Copied Markdown to clipboard!' }));
              event.preventDefault();
              return true;
            } catch (err) {
              console.error(err);
            }
          }
          return false;
        }
      }
    },
  });

  useEffect(() => { if (editor) editor.setEditable(!tab.isReadOnly); }, [tab.isReadOnly, editor]);

  useEffect(() => {
    if (!editor) return;
    // @ts-ignore
    const cur = editor.storage.markdown.getMarkdown();
    if (cur !== tab.content) editor.commands.setContent(tab.content, { emitUpdate: false });
  }, [tab.content, editor]);

  useEffect(() => { 
    if (isActive && editor) onEditorActive(editor);
    if (editor && onEditorReady) onEditorReady(tab.id, editor);
  }, [isActive, editor, onEditorActive, onEditorReady, tab.id]);

  useEffect(() => {
    if (editor?.view?.dom) {
      (window as any).__currentDocumentDir = tab.filePath ? getParentDirectory(tab.filePath) : null;
      renderMermaidDiagrams(editor.view.dom, settings.isDark);
    }
  }, [editor, tab.content, tab.isReadOnly, settings.isDark, tab.filePath]);

  useEffect(() => {
    if (!editor?.view?.dom) return;
    const dom = editor.view.dom;
    dom.style.fontSize = `${settings.fontSize}px`;
    dom.style.lineHeight = `${settings.lineHeight}`;
    dom.style.fontFamily = settings.fontFamily === 'mono' 
      ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' 
      : settings.fontFamily === 'serif' 
        ? 'Georgia, Cambria, "Times New Roman", Times, serif' 
        : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    if (!settings.wordWrap) {
      dom.style.whiteSpace = 'pre';
      dom.style.overflowX = 'auto';
    } else {
      dom.style.whiteSpace = 'normal';
      dom.style.overflowX = 'visible';
    }
  }, [editor, settings.fontSize, settings.lineHeight, settings.fontFamily, settings.wordWrap]);

  return (
    <div style={{ display: isActive ? 'block' : 'none' }} className="h-full w-full relative">
      <EditorContent editor={editor} className="h-full" />
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
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMinimalistMode, setIsMinimalistMode] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  
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
  const [hoveredHeadingIndex, setHoveredHeadingIndex] = useState<number | null>(null);

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

  const [activePrompt, setActivePrompt] = useState<{
    type: 'link' | 'image' | 'footnote';
    title: string;
    label1: string;
    placeholder1: string;
    value1: string;
    label2?: string;
    placeholder2?: string;
    value2?: string;
    submitLabel: string;
    onSubmit: (val1: string, val2: string) => void;
  } | null>(null);

  const [tabs, setTabs] = useState<Tab[]>(() => [
    { id: '1', filePath: null, fileName: 'Untitled.md', content: '', isUnsaved: false, isReadOnly: loadSettings().defaultMode === 'read' }
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

  const [isInitializing, setIsInitializing] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsInitializing(false), 500);
    return () => clearTimeout(t);
  }, []);

  /**
   * --------------------------------------------------------------------------
   * THEME & EFFECTS
   * --------------------------------------------------------------------------
   */
  const themeColors = THEME_COLORS[settings.theme];
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const isReading = activeTab.isReadOnly;
  const tr = (settings.animationsEnabled && !isInitializing) ? 'all 0.25s cubic-bezier(0.4,0,0.2,1)' : 'none';
  const dk = settings.isDark;

  // Apply dark mode and theme colors to the document body
  useEffect(() => { dk ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark'); }, [dk]);
  useEffect(() => { 
    document.documentElement.style.setProperty('--accent-color', themeColors.accent);
    document.documentElement.style.setProperty('--accent-bg', themeColors.accentBg);
  }, [themeColors.accent, themeColors.accentBg]);

  useEffect(() => {
    const handleImage = (e: any) => setFullscreenImage(e.detail);
    const handleToast = (e: any) => {
      setToastMessage(e.detail);
      setTimeout(() => setToastMessage(null), 2000);
    };
    window.addEventListener('open-fullscreen-image', handleImage);
    window.addEventListener('show-toast', handleToast);
    return () => {
      window.removeEventListener('open-fullscreen-image', handleImage);
      window.removeEventListener('show-toast', handleToast);
    };
  }, []);

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
    let latestWidth = sidebarWidth;
    const move = (ev: MouseEvent) => { 
      if (isResizing.current) {
        latestWidth = Math.min(Math.max(ev.clientX, 180), 500);
        setSidebarWidth(latestWidth); 
      }
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
      updateSettings({ sidebarWidth: latestWidth });
    };
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
    activeEditor.state.doc.descendants((node: any) => {
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
      const newTab: Tab = { id: Date.now().toString(), filePath, fileName, content: res.content, isUnsaved: false, isReadOnly: settings.defaultMode === 'read' };
      setTabs(prev => (prev.length === 1 && !prev[0].filePath && !prev[0].content && !prev[0].isUnsaved) ? [newTab] : [...prev, newTab]);
      setActiveTabId(newTab.id);
    }
  };

  useEffect(() => {
    if (!window.api) return;
    window.api.onWindowStateChange((state) => {
      setIsWindowMaximized(state.isMaximized);
    });
    window.api.onFileLoaded((data) => {
      console.log("Renderer received file-loaded:", data);
      setTabs(prev => {
        console.log("Current tabs in state:", prev);
        const existing = prev.find(t => t.filePath === data.filePath);
        if (existing) {
          console.log("File already open in tab:", existing.id);
          setTimeout(() => setActiveTabId(existing.id), 0);
          return prev;
        }
        const fileName = data.filePath.split(/[/\\]/).pop() || 'Untitled.md';
        const newTab: Tab = { id: Date.now().toString(), filePath: data.filePath, fileName, content: data.content, isUnsaved: false, isReadOnly: settings.defaultMode === 'read' };
        console.log("Adding new tab:", newTab);
        setTimeout(() => setActiveTabId(newTab.id), 0);
        if (prev.length === 1 && !prev[0].filePath && !prev[0].content && !prev[0].isUnsaved) {
          console.log("Replacing Untitled tab");
          return [newTab];
        }
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
    window.api.onDirectoryLoaded((dirPath) => {
      console.log("Renderer received directory-loaded:", dirPath);
      setRootDir(dirPath);
      loadDir(dirPath);
      setIsSidebarOpen(true);
    });
    window.api.rendererReady();
  }, [settings.defaultMode]);


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
      if (mod && e.key.toLowerCase() === 'e') { e.preventDefault(); setIsExportOpen(true); }
      if (mod && e.key.toLowerCase() === 'p') { e.preventDefault(); window.print(); }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'r') { e.preventDefault(); toggleReadOnly(); }
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
      <div className="h-10 flex items-center justify-between shrink-0 select-none cursor-default"
        onDoubleClick={() => window.api.maximizeWindow()}
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
          <WinBtn onClick={() => window.api.maximizeWindow()} icon={isWindowMaximized ? <CopyAllIcon size={12} className="rotate-180" /> : <Square size={12} />} dk={dk} />
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
            <div className="flex items-center h-[37px] overflow-x-auto" onWheel={e => { e.preventDefault(); smoothScroll(e.currentTarget, e.deltaY); }}>
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
              <button onClick={() => { const t: Tab = { id: Date.now().toString(), filePath: null, fileName: 'Untitled.md', content: '', isUnsaved: false, isReadOnly: settings.defaultMode === 'read' }; setTabs([...tabs, t]); setActiveTabId(t.id); }}
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
                  <button onClick={() => setIsExportOpen(true)} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all border"
                    style={{ borderColor: dk ? '#333' : '#ddd', color: dk ? '#aaa' : '#555', backgroundColor: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = dk ? '#333' : '#eee'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    title="Export Document (PDF, HTML, Print)">
                    <Download size={12} /> Export
                  </button>
                  <button onClick={() => { 
                    navigator.clipboard.writeText(activeTab.content); 
                    setToastMessage('Copied all text to clipboard!');
                    setTimeout(() => setToastMessage(null), 2000);
                  }} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all border"
                    style={{ borderColor: dk ? '#333' : '#ddd', color: dk ? '#aaa' : '#555', backgroundColor: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = dk ? '#333' : '#eee'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    title="Copy Raw Markdown">
                    <CopyAllIcon size={12} /> Copy All
                  </button>
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
                <Fragment key={tab.id}>
                  <textarea
                    value={tab.content}
                    onChange={e => {
                      setTabs(ts => ts.map(t => t.id === tab.id ? { ...t, content: e.target.value, isUnsaved: true } : t));
                    }}
                    wrap={settings.wordWrap ? 'soft' : 'off'}
                    className="w-full h-full min-h-[calc(100vh-150px)] px-12 pt-6 pb-32 bg-transparent resize-none focus:outline-none"
                    style={{ 
                      display: activeTabId === tab.id && isSourceMode ? 'block' : 'none', 
                      fontSize: settings.fontSize, 
                      lineHeight: settings.lineHeight, 
                      fontFamily: 'monospace',
                      whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
                      overflowX: settings.wordWrap ? 'hidden' : 'auto',
                      color: dk ? '#e4e4e7' : '#18181b'
                    }}
                    spellCheck={settings.spellCheck}
                    readOnly={tab.isReadOnly}
                  />
                  <div style={{ display: activeTabId === tab.id && !isSourceMode ? 'block' : 'none' }}>
                    <EditorComponent tab={tab} isActive={activeTabId === tab.id && !isSourceMode}
                      setUnsaved={(id: string, s: boolean) => setTabs(p => p.map(t => t.id === id ? { ...t, isUnsaved: s } : t))}
                      onEditorActive={setActiveEditor} 
                      onEditorReady={(id: string, ed: any) => {
                        editorsRef.current[id] = ed;
                        // Reset unsaved state on startup load
                        setTabs(p => p.map(t => t.id === id ? { ...t, isUnsaved: false } : t));
                        // Auto-save the normalized content back to the file
                        const currentTab = tabsRef.current.find(t => t.id === id);
                        if (currentTab && currentTab.filePath) {
                          const content = ed.storage.markdown.getMarkdown();
                          window.api.saveFile({ filePath: currentTab.filePath, content });
                        }
                      }}
                      onSelectionUpdate={() => setSelectionTick(p => p + 1)} settings={settings} />
                  </div>
                </Fragment>
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
                <div className="flex items-center gap-1 overflow-x-auto flex-1 py-1" onWheel={e => { e.preventDefault(); smoothScroll(e.currentTarget, e.deltaY); }}>
                  <TB e={activeEditor} a="toggleBold" on={activeEditor.isActive('bold')} icon={<Bold size={13} />} t="Bold" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleItalic" on={activeEditor.isActive('italic')} icon={<Italic size={13} />} t="Italic" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleStrike" on={activeEditor.isActive('strike')} icon={<Strikethrough size={13} />} t="Strike" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleHighlight" on={activeEditor.isActive('highlight')} icon={<Highlighter size={13} />} t="Highlight" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleSubscript" on={activeEditor.isActive('subscript')} icon={<SubscriptIcon size={13} />} t="Subscript" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleSuperscript" on={activeEditor.isActive('superscript')} icon={<SuperscriptIcon size={13} />} t="Superscript" ac={themeColors.accent} dk={dk} />
                  <Sep dk={dk} />
                  <TB e={activeEditor} a="toggleHeading" args={{level:1}} on={activeEditor.isActive('heading',{level:1})} icon={<span className="text-[10px] font-bold">H1</span>} t="H1" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleHeading" args={{level:2}} on={activeEditor.isActive('heading',{level:2})} icon={<span className="text-[10px] font-bold">H2</span>} t="H2" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleHeading" args={{level:3}} on={activeEditor.isActive('heading',{level:3})} icon={<span className="text-[10px] font-bold">H3</span>} t="H3" ac={themeColors.accent} dk={dk} />
                  <Sep dk={dk} />
                  <TB e={activeEditor} a="toggleBulletList" on={activeEditor.isActive('bulletList')} icon={<List size={13} />} t="Bullets" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleOrderedList" on={activeEditor.isActive('orderedList')} icon={<ListOrdered size={13} />} t="Numbers" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleTaskList" on={activeEditor.isActive('taskList')} icon={<CheckSquare size={13} />} t="Tasks" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleBlockquote" on={activeEditor.isActive('blockquote')} icon={<Quote size={13} />} t="Quote" ac={themeColors.accent} dk={dk} />
                  <Sep dk={dk} />
                  <TB e={activeEditor} a="toggleCode" on={activeEditor.isActive('code')} icon={<Code size={13} />} t="Code" ac={themeColors.accent} dk={dk} />
                  <TB e={activeEditor} a="toggleCodeBlock" on={activeEditor.isActive('codeBlock')} icon={<Terminal size={13} />} t="Block" ac={themeColors.accent} dk={dk} />
                   <TB e={activeEditor} on={activeEditor.isActive('link')} icon={<Link2 size={13} />} t="Link" ac={themeColors.accent} dk={dk} onClick={() => {
                    if (activeEditor.isActive('link')) { activeEditor.chain().focus().unsetLink().run(); return; }
                    setActivePrompt({
                      type: 'link',
                      title: 'Insert Link',
                      label1: 'URL',
                      placeholder1: 'https://example.com',
                      value1: '',
                      label2: 'Link Text (Optional)',
                      placeholder2: 'e.g. My Website',
                      value2: activeEditor.state.selection.empty ? '' : activeEditor.state.doc.textBetween(activeEditor.state.selection.from, activeEditor.state.selection.to),
                      submitLabel: 'Insert',
                      onSubmit: (url, text) => {
                        if (!url) return;
                        if (text && activeEditor.state.selection.empty) {
                          activeEditor.chain().focus().insertContent({
                            type: 'text',
                            text: text,
                            marks: [{ type: 'link', attrs: { href: url } }]
                          }).run();
                        } else {
                          activeEditor.chain().focus().setLink({ href: url }).run();
                        }
                      }
                    });
                  }} />
                  <TB e={activeEditor} icon={<ImageIcon size={13} />} t="Image" ac={themeColors.accent} dk={dk} onClick={() => {
                    setActivePrompt({
                      type: 'image',
                      title: 'Insert Image',
                      label1: 'Image URL',
                      placeholder1: 'https://example.com/image.png',
                      value1: '',
                      label2: 'Alt Text (Optional)',
                      placeholder2: 'e.g. Image Description',
                      value2: '',
                      submitLabel: 'Insert',
                      onSubmit: (url, alt) => {
                        if (url) {
                          activeEditor.chain().focus().setImage({ src: url, alt }).run();
                        }
                      }
                    });
                  }} />
                  <Sep dk={dk} />
                  <TB e={activeEditor} icon={<Asterisk size={13} />} t="Footnote" ac={themeColors.accent} dk={dk} onClick={() => {
                    setActivePrompt({
                      type: 'footnote',
                      title: 'Insert Footnote',
                      label1: 'Footnote ID',
                      placeholder1: 'e.g. 1 or mynote',
                      value1: String(headings.length + 1),
                      label2: 'Footnote Description',
                      placeholder2: 'This is the footnote content.',
                      value2: '',
                      submitLabel: 'Insert',
                      onSubmit: (id, desc) => {
                        if (!id) return;
                        activeEditor.chain().focus().insertContent([
                          { type: 'footnoteReference', attrs: { id } },
                          { type: 'paragraph' },
                          { type: 'footnote', attrs: { id }, content: desc ? [{ type: 'paragraph', content: [{ type: 'text', text: desc }] }] : [{ type: 'paragraph' }] }
                        ]).run();
                      }
                    });
                  }} />
                  <TB e={activeEditor} icon={<ListMinus size={13} />} t="Definition List" ac={themeColors.accent} dk={dk} onClick={() => {
                    activeEditor.chain().focus().insertContent({
                      type: 'defList',
                      content: [
                        { type: 'defTerm', content: [{ type: 'text', text: 'Term' }] },
                        { type: 'defDescription', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Definition' }] }] }
                      ]
                    }).run();
                  }} />
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
                    onMouseEnter={() => setHoveredHeadingIndex(i)}
                    onMouseLeave={() => setHoveredHeadingIndex(null)}
                    style={{ 
                      paddingLeft: `${(h.level - 1) * 12 + 8}px`, 
                      color: hoveredHeadingIndex === i ? themeColors.accent : (dk ? '#ffffff' : '#000000'),
                      opacity: hoveredHeadingIndex === i ? 1 : Math.max(1 - (h.level - 1) * 0.25, 0.3)
                    }}
                    onClick={() => {
                      if (activeEditor) {
                        const domNode = activeEditor.view.nodeDOM(h.pos);
                        if (domNode instanceof HTMLElement) {
                          domNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          activeEditor.chain().setTextSelection(h.pos).run();
                        } else {
                          activeEditor.chain().focus().setTextSelection(h.pos).scrollIntoView().run();
                        }
                      }
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
            <FAB onClick={() => setIsSourceMode(p => !p)} icon={isSourceMode ? <Code size={17} /> : <FileText size={17} />} title="Source Mode" on={isSourceMode} accent={themeColors.accent} bg={themeColors.accentBg} dk={dk} anim={settings.animationsEnabled} />
            <FAB onClick={toggleReadOnly} icon={<BookOpen size={17} />} title="Reading Mode" on={false} accent={themeColors.accent} bg={themeColors.accentBg} dk={dk} anim={settings.animationsEnabled} />
            <FAB onClick={() => setIsMinimalistMode(p => !p)} icon={isMinimalistMode ? <Eye size={17} /> : <EyeOff size={17} />} title="Minimalist" on={isMinimalistMode} accent={themeColors.accent} bg={themeColors.accentBg} dk={dk} anim={settings.animationsEnabled} />
          </>
        )}
        <FAB onClick={() => setIsSettingsOpen(true)} icon={<Settings size={17} />} title="Settings (Ctrl+,)" on={false} accent={themeColors.accent} bg={themeColors.accentBg} dk={dk} anim={settings.animationsEnabled} />
      </div>

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setIsSettingsOpen(false)}
          themeColors={themeColors}
          onOpenExport={() => setIsExportOpen(true)}
        />
      )}

      {isExportOpen && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          fileName={activeTab.fileName}
          getEditorHTML={() => (activeEditor ? activeEditor.getHTML() : activeTab.content)}
          themeAccent={themeColors.accent}
          isDark={dk}
          onToast={(msg) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 2500);
          }}
        />
      )}


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
      {activePrompt && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-xl flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl animate-fade-in"
            style={{ animation: settings.animationsEnabled ? 'settingsAppear 0.2s cubic-bezier(0.16,1,0.3,1)' : 'none' }}>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161616]">
              <div className="p-1.5 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColors.accentBg, color: themeColors.accent }}>
                {activePrompt.type === 'link' ? <Link2 size={16} /> : activePrompt.type === 'image' ? <ImageIcon size={16} /> : <Asterisk size={16} />}
              </div>
              <h2 className="text-sm font-semibold">{activePrompt.title}</h2>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const val1 = formData.get('field1') as string || '';
              const val2 = formData.get('field2') as string || '';
              activePrompt.onSubmit(val1, val2);
              setActivePrompt(null);
            }}>
              <div className="px-5 py-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{activePrompt.label1}</label>
                  <input
                    name="field1"
                    type="text"
                    defaultValue={activePrompt.value1}
                    placeholder={activePrompt.placeholder1}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#1e1e1e]"
                    style={{ '--tw-ring-color': themeColors.accent } as any}
                    required
                    autoFocus
                  />
                </div>
                
                {activePrompt.label2 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{activePrompt.label2}</label>
                    <input
                      name="field2"
                      type="text"
                      defaultValue={activePrompt.value2}
                      placeholder={activePrompt.placeholder2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#1e1e1e]"
                      style={{ '--tw-ring-color': themeColors.accent } as any}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161616]">
                <button type="button" onClick={() => setActivePrompt(null)} className="px-4 py-1.5 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 text-sm font-medium rounded-lg text-white shadow-sm transition-all"
                  style={{ backgroundColor: themeColors.accent }}>
                  {activePrompt.submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {fullscreenImage && (
        <FullscreenImageViewer src={fullscreenImage} onClose={() => setFullscreenImage(null)} />
      )}
      <WindowsIntegrationToast
        themeAccent={themeColors.accent}
        isDark={dk}
        onToast={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-full shadow-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-black text-sm font-medium animate-fade-in pointer-events-none">
          {toastMessage}
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

const TB = ({ e, a, args, on, icon, t, ac, dk, dis, onClick }: any) => (
  <button onClick={onClick || (() => { if (dis) return; const c = e.chain().focus(); args ? c[a](args).run() : c[a]().run(); })} disabled={dis}
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
