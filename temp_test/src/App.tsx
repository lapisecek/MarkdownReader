import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Moon, Sun, HelpCircle, X } from 'lucide-react';

declare global {
  interface Window {
    api: {
      onFileLoaded: (callback: (data: { filePath: string, content: string }) => void) => void;
      saveFile: (content: string) => Promise<{ success: boolean, filePath?: string }>;
      saveAsFile: (content: string) => Promise<{ success: boolean, filePath?: string }>;
      onAppCloseRequest: (callback: () => void) => void;
      closeWindowConfirmed: () => void;
      showUnsavedDialog: () => Promise<number>;
    }
  }
}

function App() {
  const [isDark, setIsDark] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('Untitled.md');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
    ],
    content: '',
    onUpdate: () => {
      setIsUnsaved(true);
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-lg max-w-none focus:outline-none min-h-screen px-12 pt-6 pb-32',
      },
    },
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (!window.api) return;

    window.api.onFileLoaded((data) => {
      setCurrentFileName(data.filePath.split(/[/\\]/).pop() || 'Untitled.md');
      if (editor) {
        editor.commands.setContent(data.content);
        setIsUnsaved(false);
      }
    });

    window.api.onAppCloseRequest(async () => {
      if (isUnsaved) {
        const res = await window.api.showUnsavedDialog();
        if (res === 0) {
          await handleSave(false);
          window.api.closeWindowConfirmed();
        } else if (res === 1) {
          window.api.closeWindowConfirmed();
        }
      } else {
        window.api.closeWindowConfirmed();
      }
    });
  }, [editor, isUnsaved]);

  const handleSave = async (saveAs = false) => {
    if (!editor) return;
    // @ts-ignore
    const markdown = editor.storage.markdown.getMarkdown();
    const result = saveAs ? await window.api.saveAsFile(markdown) : await window.api.saveFile(markdown);
    if (result.success && result.filePath) {
      setCurrentFileName(result.filePath.split(/[/\\]/).pop() || 'Untitled.md');
      setIsUnsaved(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(e.shiftKey);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, isUnsaved]);

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''} bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans flex flex-col`}>
      {/* Titlebar */}
      <div className="h-10 flex items-center justify-between px-4" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div 
          className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          onClick={() => handleSave(true)}
          title="Click to Rename / Save As"
        >
          {currentFileName} {isUnsaved && <span className="text-orange-500 font-bold">*</span>}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex gap-3 z-50">
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-3 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-lg hover:-translate-y-1 transition-all duration-200"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button 
          onClick={() => setIsHelpOpen(true)}
          className="p-3 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-lg hover:-translate-y-1 transition-all duration-200"
          title="Help"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Shortcuts</h2>
              <button onClick={() => setIsHelpOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                <X size={20} />
              </button>
            </div>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                <span>Bold</span> <span className="font-mono bg-black/5 dark:bg-white/10 px-2 rounded">Ctrl + B</span>
              </li>
              <li className="flex justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                <span>Italic</span> <span className="font-mono bg-black/5 dark:bg-white/10 px-2 rounded">Ctrl + I</span>
              </li>
              <li className="flex justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                <span>Headings 1/2/3</span> <span className="font-mono bg-black/5 dark:bg-white/10 px-2 rounded">Ctrl + Alt + 1/2/3</span>
              </li>
              <li className="flex justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                <span>Blockquote</span> <span className="font-mono bg-black/5 dark:bg-white/10 px-2 rounded">Ctrl + Shift + B</span>
              </li>
              <li className="flex justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                <span>Save</span> <span className="font-mono bg-black/5 dark:bg-white/10 px-2 rounded">Ctrl + S</span>
              </li>
              <li className="flex justify-between pb-2">
                <span>Save As</span> <span className="font-mono bg-black/5 dark:bg-white/10 px-2 rounded">Ctrl + Shift + S</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
