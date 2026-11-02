import { Node, Mark, mergeAttributes } from '@tiptap/core';
import Underline from '@tiptap/extension-underline';

/**
 * CustomUnderline Mark
 * Supports <u>, <ins>, and style="text-decoration: underline"
 */
export const CustomUnderline = Underline.extend({
  parseHTML() {
    return [
      { tag: 'u' },
      { tag: 'ins' },
      {
        style: 'text-decoration',
        getAttrs: value => (typeof value === 'string' && value.includes('underline') ? {} : false),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['u', mergeAttributes(HTMLAttributes), 0];
  },
  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '<u>',
          close: '</u>',
        },
      },
    };
  },
});

/**
 * CustomKbd Mark
 * Supports <kbd> keyboard keys with native desktop styling
 */
export const CustomKbd = Mark.create({
  name: 'kbd',
  parseHTML() {
    return [{ tag: 'kbd' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'kbd',
      mergeAttributes(HTMLAttributes, {
        class: 'px-1.5 py-0.5 text-xs font-mono font-medium rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 shadow-xs inline-block align-baseline',
      }),
      0,
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '<kbd>',
          close: '</kbd>',
        },
      },
    };
  },
});

/**
 * CustomHtmlSpan Mark
 * Preserves custom inline styles, text colors, and font styling from HTML
 */
export const CustomHtmlSpan = Mark.create({
  name: 'htmlSpan',
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
      },
      class: {
        default: null,
        parseHTML: element => element.getAttribute('class'),
      },
      color: {
        default: null,
        parseHTML: element => element.getAttribute('color') || element.style.color || null,
      },
    };
  },
  parseHTML() {
    const isMathOrSpecial = (element: HTMLElement | string) => {
      if (typeof element === 'string') return true;
      const cls = element.getAttribute('class') || '';
      if (
        cls.includes('katex') ||
        cls.includes('math') ||
        element.hasAttribute('data-latex') ||
        element.closest?.('.katex') ||
        element.closest?.('.katex-math-inline') ||
        element.closest?.('.katex-math-block')
      ) {
        return true;
      }
      return false;
    };

    return [
      {
        tag: 'span[style]',
        getAttrs: (element: HTMLElement | string) => {
          if (isMathOrSpecial(element)) return false;
          return null;
        },
      },
      {
        tag: 'span[class]',
        getAttrs: (element: HTMLElement | string) => {
          if (isMathOrSpecial(element)) return false;
          return null;
        },
      },
      { tag: 'font[color]' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const attrs: Record<string, string> = {};
    const styleParts: string[] = [];
    if (HTMLAttributes.style) styleParts.push(HTMLAttributes.style);
    if (HTMLAttributes.color && !HTMLAttributes.style) styleParts.push(`color: ${HTMLAttributes.color};`);
    if (styleParts.length) attrs.style = styleParts.join(' ');
    if (HTMLAttributes.class) attrs.class = HTMLAttributes.class;
    return ['span', mergeAttributes(attrs), 0];
  },
  addStorage() {
    return {
      markdown: {
        serialize: {
          open(_state: any, mark: any) {
            const s = mark.attrs.style ? ` style="${mark.attrs.style}"` : (mark.attrs.color ? ` style="color: ${mark.attrs.color};"` : '');
            const c = mark.attrs.class ? ` class="${mark.attrs.class}"` : '';
            return `<span${s}${c}>`;
          },
          close: '</span>',
        },
      },
    };
  },
});

/**
 * Details Block Node
 * Supports HTML <details> collapsible widget
 */
export const Details = Node.create({
  name: 'details',
  group: 'block',
  content: 'summary block+',
  defining: true,
  isolating: true,
  addAttributes() {
    return {
      open: {
        default: false,
        parseHTML: element => element.hasAttribute('open'),
        renderHTML: attributes => (attributes.open ? { open: 'true' } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'details' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        class: 'my-4 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] transition-colors',
      }),
      0,
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`<details${node.attrs.open ? ' open' : ''}>\n`);
          state.renderContent(node);
          state.write('</details>\n\n');
        },
      },
    };
  },
});

/**
 * Summary Block Node
 * Represents the summary title inside a <details> block
 */
export const Summary = Node.create({
  name: 'summary',
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'summary' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'summary',
      mergeAttributes(HTMLAttributes, {
        class: 'font-semibold cursor-pointer select-none py-1 text-gray-800 dark:text-zinc-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors',
      }),
      0,
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write('<summary>');
          state.renderInline(node);
          state.write('</summary>\n\n');
        },
      },
    };
  },
});

/**
 * CustomDiv Block Node
 * Supports HTML <div> and <center> wrappers with alignment, styles, and classes
 */
export const CustomDiv = Node.create({
  name: 'customDiv',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      align: {
        default: null,
        parseHTML: element => element.getAttribute('align') || (element.tagName === 'CENTER' ? 'center' : null),
      },
      class: {
        default: null,
        parseHTML: element => element.getAttribute('class'),
      },
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'div',
        getAttrs: (element: HTMLElement | string) => {
          if (typeof element === 'string') return false;
          const cls = element.getAttribute('class') || '';
          if (
            cls.includes('katex') ||
            cls.includes('raw-html-block') ||
            element.hasAttribute('data-latex') ||
            element.closest?.('.katex-math-block')
          ) {
            return false;
          }
          return null;
        },
      },
      { tag: 'center' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const styleParts: string[] = [];
    if (HTMLAttributes.style) styleParts.push(HTMLAttributes.style);
    if (HTMLAttributes.align) styleParts.push(`text-align: ${HTMLAttributes.align};`);
    const attrs: Record<string, string> = {};
    if (styleParts.length) attrs.style = styleParts.join(' ');
    if (HTMLAttributes.class) attrs.class = HTMLAttributes.class;
    if (HTMLAttributes.align) attrs.align = HTMLAttributes.align;
    return ['div', mergeAttributes(attrs), 0];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const parts: string[] = [];
          if (node.attrs.align) parts.push(`align="${node.attrs.align}"`);
          if (node.attrs.class) parts.push(`class="${node.attrs.class}"`);
          if (node.attrs.style) parts.push(`style="${node.attrs.style}"`);
          const attrStr = parts.length ? ' ' + parts.join(' ') : '';
          state.write(`<div${attrStr}>\n\n`);
          state.renderContent(node);
          state.write('</div>\n\n');
        },
      },
    };
  },
});

/**
 * CustomRawHtml Block Node
 * Preserves media, embeds, figures, canvases, and custom HTML blocks
 */
export const CustomRawHtml = Node.create({
  name: 'customRawHtml',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      html: {
        default: '',
        parseHTML: element => element.outerHTML,
      },
    };
  },
  parseHTML() {
    return [
      { tag: 'iframe' },
      { tag: 'video' },
      { tag: 'audio' },
      { tag: 'figure' },
      { tag: 'svg' },
      { tag: 'canvas' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.className = 'raw-html-block my-4 overflow-x-auto';
      container.innerHTML = HTMLAttributes.html || '';
      return container;
    }
    return ['div', { class: 'raw-html-block my-4 overflow-x-auto' }, HTMLAttributes.html || ''];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.className = 'raw-html-block my-4 overflow-x-auto';
      dom.innerHTML = node.attrs.html || '';
      return { dom };
    };
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`${node.attrs.html}\n\n`);
        },
      },
    };
  },
});
