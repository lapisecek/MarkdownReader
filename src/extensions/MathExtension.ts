import { Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';

function decodeEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function markdownItMathPlugin(md: any) {
  if (md.__hasMathPlugin) return;
  md.__hasMathPlugin = true;

  // Inline math rule: $...$ and inline $$...$$
  md.inline.ruler.after('escape', 'math_inline', (state: any, silent: boolean) => {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x24 /* $ */) return false;

    const isDouble = state.src.charCodeAt(start + 1) === 0x24;
    const marker = isDouble ? '$$' : '$';
    const markerLen = isDouble ? 2 : 1;

    let match = start + markerLen;
    while ((match = state.src.indexOf(marker, match)) !== -1) {
      let backslashes = 0;
      let pos = match - 1;
      while (pos >= 0 && state.src.charCodeAt(pos) === 0x5C /* \ */) {
        backslashes++;
        pos--;
      }
      if (backslashes % 2 === 0) break;
      match += markerLen;
    }

    if (match === -1 || match === start + markerLen) return false;
    if (!isDouble && state.src.charCodeAt(match + 1) === 0x24) return false;

    const content = state.src.slice(start + markerLen, match);
    if (!silent) {
      if (isDouble) {
        const token = state.push('math_inline_display', 'span', 0);
        token.markup = '$$';
        token.content = content.trim();
        token.meta = { display: true };
      } else {
        const token = state.push('math_inline', 'span', 0);
        token.markup = '$';
        token.content = content.trim();
      }
    }
    state.pos = match + markerLen;
    return true;
  });

  md.renderer.rules.math_inline = (tokens: any[], idx: number) => {
    const tex = tokens[idx].content;
    try {
      return `<span class="katex-math-inline cursor-pointer select-none" data-latex="${md.utils.escapeHtml(tex)}" title="$${md.utils.escapeHtml(tex)}$">${katex.renderToString(tex, { throwOnError: false, strict: false })}</span>`;
    } catch {
      return `<code>$${md.utils.escapeHtml(tex)}$</code>`;
    }
  };

  md.renderer.rules.math_inline_display = (tokens: any[], idx: number) => {
    const tex = tokens[idx].content;
    try {
      return `<span class="katex-math-inline katex-math-display cursor-pointer select-none" data-latex="${md.utils.escapeHtml(tex)}" data-display="true" title="$$${md.utils.escapeHtml(tex)}$$">${katex.renderToString(tex, { displayMode: true, throwOnError: false, strict: false })}</span>`;
    } catch {
      return `<code>$$${md.utils.escapeHtml(tex)}$$</code>`;
    }
  };

  // Block math rule: $$ ... $$
  md.block.ruler.after('blockquote', 'math_block', (state: any, startLine: number, endLine: number, silent: boolean) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];

    if (startPos + 2 > max) return false;
    if (state.src.slice(startPos, startPos + 2) !== '$$') return false;

    // Single line block $$...$$
    const rest = state.src.slice(startPos + 2, max);
    const closeIndex = rest.indexOf('$$');
    if (closeIndex !== -1) {
      if (silent) return true;
      const content = rest.slice(0, closeIndex).trim();
      const token = state.push('math_block', 'div', 0);
      token.block = true;
      token.content = content;
      token.map = [startLine, startLine + 1];
      state.line = startLine + 1;
      return true;
    }

    // Multi-line block
    let haveEndMarker = false;
    let nextLine = startLine;
    while (!haveEndMarker) {
      nextLine++;
      if (nextLine >= endLine) break;

      const pos = state.bMarks[nextLine] + state.tShift[nextLine];
      if (state.src.slice(pos, pos + 2) === '$$') {
        haveEndMarker = true;
      }
    }

    if (!haveEndMarker) return false;
    if (silent) return true;

    state.line = nextLine + 1;
    const content = state.getLines(startLine + 1, nextLine, state.tShift[startLine], false).trim();
    const token = state.push('math_block', 'div', 0);
    token.block = true;
    token.content = content;
    token.map = [startLine, nextLine + 1];
    return true;
  }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });

  md.renderer.rules.math_block = (tokens: any[], idx: number) => {
    const tex = tokens[idx].content;
    try {
      return `<div class="katex-math-block my-4 overflow-x-auto text-center py-2 px-3 rounded-lg bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-gray-800/50" data-latex="${md.utils.escapeHtml(tex)}">${katex.renderToString(tex, { displayMode: true, throwOnError: false, strict: false })}</div>`;
    } catch {
      return `<pre class="katex-error"><code>$$${md.utils.escapeHtml(tex)}$$</code></pre>`;
    }
  };
}

export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: element => decodeEntities(element.getAttribute('data-latex') || ''),
      },
      display: {
        default: false,
        parseHTML: element => element.getAttribute('data-display') === 'true' || element.classList.contains('katex-math-display'),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.katex-math-inline',
      },
      {
        tag: 'span[data-latex]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    if (typeof document !== 'undefined') {
      const span = document.createElement('span');
      span.className = `katex-math-inline cursor-pointer select-none ${HTMLAttributes.display ? 'katex-math-display' : ''}`;
      span.setAttribute('data-latex', HTMLAttributes.latex || '');
      if (HTMLAttributes.display) span.setAttribute('data-display', 'true');
      span.setAttribute('title', HTMLAttributes.display ? `$$${HTMLAttributes.latex || ''}$$` : `$${HTMLAttributes.latex || ''}$`);
      try {
        span.innerHTML = katex.renderToString(HTMLAttributes.latex || '', {
          displayMode: !!HTMLAttributes.display,
          throwOnError: false,
          strict: false,
        });
      } catch {
        span.textContent = HTMLAttributes.display ? `$$${HTMLAttributes.latex || ''}$$` : `$${HTMLAttributes.latex || ''}$`;
      }
      return span;
    }
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: `katex-math-inline cursor-pointer select-none ${HTMLAttributes.display ? 'katex-math-display' : ''}`,
        'data-latex': HTMLAttributes.latex,
      }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const span = document.createElement('span');
      span.className = `katex-math-inline cursor-pointer select-none ${node.attrs.display ? 'katex-math-display' : ''}`;
      span.setAttribute('data-latex', node.attrs.latex || '');
      if (node.attrs.display) span.setAttribute('data-display', 'true');
      span.setAttribute('title', node.attrs.display ? `$$${node.attrs.latex || ''}$$` : `$${node.attrs.latex || ''}$`);
      try {
        span.innerHTML = katex.renderToString(node.attrs.latex || '', {
          displayMode: !!node.attrs.display,
          throwOnError: false,
          strict: false,
        });
      } catch {
        span.textContent = node.attrs.display ? `$$${node.attrs.latex || ''}$$` : `$${node.attrs.latex || ''}$`;
      }
      return { dom: span };
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          if (node.attrs.display) {
            state.write(`$$${node.attrs.latex}$$`);
          } else {
            state.write(`$${node.attrs.latex}$`);
          }
        },
      },
    };
  },
});

export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: element => decodeEntities(element.getAttribute('data-latex') || ''),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.katex-math-block',
      },
      {
        tag: 'div[data-latex]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    if (typeof document !== 'undefined') {
      const div = document.createElement('div');
      div.className = 'katex-math-block my-4 overflow-x-auto text-center py-2 px-3 rounded-lg bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-gray-800/50';
      div.setAttribute('data-latex', HTMLAttributes.latex || '');
      try {
        div.innerHTML = katex.renderToString(HTMLAttributes.latex || '', {
          displayMode: true,
          throwOnError: false,
          strict: false,
        });
      } catch {
        div.innerHTML = `<pre class="katex-error"><code>$$${HTMLAttributes.latex || ''}$$</code></pre>`;
      }
      return div;
    }
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'katex-math-block my-4 overflow-x-auto text-center py-2 px-3 rounded-lg bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-gray-800/50',
        'data-latex': HTMLAttributes.latex,
      }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const div = document.createElement('div');
      div.className = 'katex-math-block my-4 overflow-x-auto text-center py-2 px-3 rounded-lg bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-gray-800/50';
      div.setAttribute('data-latex', node.attrs.latex || '');
      try {
        div.innerHTML = katex.renderToString(node.attrs.latex || '', {
          displayMode: true,
          throwOnError: false,
          strict: false,
        });
      } catch {
        div.innerHTML = `<pre class="katex-error"><code>$$${node.attrs.latex || ''}$$</code></pre>`;
      }
      return { dom: div };
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`$$\n${node.attrs.latex}\n$$\n\n`);
        },
        parse: {
          setup(markdownit: any) {
            markdownItMathPlugin(markdownit);
          },
        },
      },
    };
  },
});
