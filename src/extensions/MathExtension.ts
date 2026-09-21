import { Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';

export function markdownItMathPlugin(md: any) {
  if (md.__hasMathPlugin) return;
  md.__hasMathPlugin = true;

  // Inline math rule: $...$
  md.inline.ruler.after('escape', 'math_inline', (state: any, silent: boolean) => {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x24 /* $ */) return false;
    if (state.src.charCodeAt(start + 1) === 0x24) return false; // skip $$ (block)

    let match = start + 1;
    while ((match = state.src.indexOf('$', match)) !== -1) {
      let backslashes = 0;
      let pos = match - 1;
      while (pos >= 0 && state.src.charCodeAt(pos) === 0x5C /* \ */) {
        backslashes++;
        pos--;
      }
      if (backslashes % 2 === 0) break;
      match++;
    }

    if (match === -1 || match === start + 1) return false;

    const content = state.src.slice(start + 1, match);
    if (!silent) {
      const token = state.push('math_inline', 'span', 0);
      token.markup = '$';
      token.content = content.trim();
    }
    state.pos = match + 1;
    return true;
  });

  md.renderer.rules.math_inline = (tokens: any[], idx: number) => {
    const tex = tokens[idx].content;
    try {
      return `<span class="katex-math-inline cursor-pointer select-none" data-latex="${md.utils.escapeHtml(tex)}" title="$${md.utils.escapeHtml(tex)}$">${katex.renderToString(tex, { throwOnError: false })}</span>`;
    } catch {
      return `<code>$${md.utils.escapeHtml(tex)}$</code>`;
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
  });

  md.renderer.rules.math_block = (tokens: any[], idx: number) => {
    const tex = tokens[idx].content;
    try {
      return `<div class="katex-math-block my-4 overflow-x-auto text-center py-2 px-3 rounded-lg bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-gray-800/50" data-latex="${md.utils.escapeHtml(tex)}">${katex.renderToString(tex, { displayMode: true, throwOnError: false })}</div>`;
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
        parseHTML: element => element.getAttribute('data-latex') || '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.katex-math-inline',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'katex-math-inline cursor-pointer select-none',
        'data-latex': HTMLAttributes.latex,
      }),
      HTMLAttributes.latex ? katex.renderToString(HTMLAttributes.latex, { throwOnError: false }) : '$math$',
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`$${node.attrs.latex}$`);
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
        parseHTML: element => element.getAttribute('data-latex') || '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.katex-math-block',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'katex-math-block my-4 overflow-x-auto text-center py-2 px-3 rounded-lg bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-gray-800/50',
        'data-latex': HTMLAttributes.latex,
      }),
      HTMLAttributes.latex ? katex.renderToString(HTMLAttributes.latex, { displayMode: true, throwOnError: false }) : '$$math$$',
    ];
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
