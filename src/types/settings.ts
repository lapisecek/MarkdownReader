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
  animationSpeed: number;
  showStatusBar: boolean;
  sidebarWidth: number;
  spellCheck: boolean;
  copyAsMarkdown: boolean;
  fontFamily: EditorFontFamily;
  customFontFamily: string;
  customAccentColor: string;
  defaultMode: DefaultEditorMode;
  applyFontToUI: boolean;
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
  animationSpeed: 1.0,
  showStatusBar: true,
  sidebarWidth: 260,
  spellCheck: false,
  copyAsMarkdown: true,
  fontFamily: 'sans',
  customFontFamily: '',
  customAccentColor: '#8b5cf6',
  defaultMode: 'smart',
  applyFontToUI: false,
};

export const resolveFontFamily = (settings: AppSettings): string => {
  const custom = (settings.customFontFamily || '').trim().replace(/["']/g, '');
  if (settings.fontFamily === 'custom') {
    if (custom) {
      return `"${custom}", "Segoe UI", -apple-system, system-ui, sans-serif`;
    }
    return '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif';
  }
  if (settings.fontFamily === 'mono') {
    return '"Cascadia Code", "Cascadia Mono", Consolas, "Courier New", monospace';
  }
  if (settings.fontFamily === 'serif') {
    return 'Georgia, Cambria, "Times New Roman", Times, serif';
  }
  if (settings.fontFamily === 'sans') {
    return '"Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif';
  }
  if (custom) {
    return `"${custom}", "Segoe UI", -apple-system, system-ui, sans-serif`;
  }
  return '"Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif';
};

export const POPULAR_FONTS = [
  'Cascadia Code',
  'Consolas',
  'Fira Code',
  'JetBrains Mono',
  'Segoe UI',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Calibri',
  'Trebuchet MS',
  'Verdana',
  'Courier New',
];

export const THEME_COLORS: Record<Exclude<AppTheme, 'custom'>, { accent: string, accentBg: string, label: string }> = {
  default: { accent: '#3b82f6', accentBg: 'rgba(59,130,246,0.12)', label: 'Default Blue' },
  ocean: { accent: '#06b6d4', accentBg: 'rgba(6,182,212,0.12)', label: 'Ocean Cyan' },
  forest: { accent: '#22c55e', accentBg: 'rgba(34,197,94,0.12)', label: 'Forest Green' },
  sunset: { accent: '#f97316', accentBg: 'rgba(249,115,22,0.12)', label: 'Sunset Orange' },
  midnight: { accent: '#a78bfa', accentBg: 'rgba(167,139,250,0.12)', label: 'Midnight Violet' },
};

