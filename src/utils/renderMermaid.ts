import mermaid from 'mermaid';

let lastTheme: boolean | null = null;

export function initMermaid(isDark: boolean) {
  if (lastTheme === isDark) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
    themeVariables: isDark ? {
      darkMode: true,
      background: '#1a1a1a',
      primaryColor: '#3b82f6',
      primaryTextColor: '#f3f4f6',
      primaryBorderColor: '#2563eb',
      lineColor: '#9ca3af',
      secondaryColor: '#1e293b',
      tertiaryColor: '#111827',
    } : {
      primaryColor: '#3b82f6',
      primaryTextColor: '#1f2937',
      primaryBorderColor: '#93c5fd',
      lineColor: '#6b7280',
    }
  });
  lastTheme = isDark;
}

export async function renderMermaidDiagrams(container: HTMLElement, isDark: boolean) {
  initMermaid(isDark);

  const mermaidBlocks = container.querySelectorAll('pre code.language-mermaid');
  mermaidBlocks.forEach(async (codeElement, idx) => {
    const pre = codeElement.parentElement;
    if (!pre) return;

    // Check if already processed
    if (pre.getAttribute('data-mermaid-processed') === 'true') return;
    pre.setAttribute('data-mermaid-processed', 'true');

    const sourceCode = codeElement.textContent || '';
    if (!sourceCode.trim()) return;

    const diagramWrapper = document.createElement('div');
    diagramWrapper.className = 'mermaid-container my-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] overflow-hidden transition-all shadow-sm';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-white/[0.04] text-xs select-none';

    const title = document.createElement('span');
    title.className = 'font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5';
    title.innerHTML = '<span class="w-2 h-2 rounded-full bg-blue-500"></span>Mermaid Diagram';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'px-2 py-1 rounded text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors';
    toggleBtn.textContent = 'View Source';

    header.appendChild(title);
    header.appendChild(toggleBtn);

    const diagramContent = document.createElement('div');
    diagramContent.className = 'p-6 flex justify-center overflow-x-auto';

    const id = `mermaid-svg-${Date.now()}-${idx}`;

    try {
      const { svg } = await mermaid.render(id, sourceCode.trim());
      diagramContent.innerHTML = svg;
    } catch (err: any) {
      console.warn('Mermaid rendering failed:', err);
      diagramContent.innerHTML = `<div class="text-xs text-red-400 p-2 font-mono">Failed to render Mermaid diagram: ${err?.message || 'Syntax Error'}</div>`;
    }

    diagramWrapper.appendChild(header);
    diagramWrapper.appendChild(diagramContent);

    // Hide original pre by default
    pre.style.display = 'none';
    pre.parentNode?.insertBefore(diagramWrapper, pre.nextSibling);

    let showSource = false;
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showSource = !showSource;
      if (showSource) {
        pre.style.display = 'block';
        diagramContent.style.display = 'none';
        toggleBtn.textContent = 'View Diagram';
      } else {
        pre.style.display = 'none';
        diagramContent.style.display = 'flex';
        toggleBtn.textContent = 'View Source';
      }
    });
  });
}
