import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window as any;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser as any;
global.Node = dom.window.Node as any;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });

import { Editor, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import markdownItFootnote from 'markdown-it-footnote';

const FootnoteSep = Node.create({
  name: 'footnoteSep',
  group: 'block',
  atom: true,
  parseHTML() {
    return [{ tag: 'hr.footnotes-sep', priority: 300 }];
  },
  renderHTML() {
    return ['div', { style: 'display:none', class: 'footnote-sep' }];
  },
  addStorage() {
    return { markdown: { serialize() {} } };
  },
});

const FootnoteReference = Node.create({
  name: 'footnoteReference',
  inline: true,
  group: 'inline',
  atom: true,
  addAttributes() {
    return {
      id: {
        default: '1',
        parseHTML: element => {
          const href = element.querySelector('a')?.getAttribute('href') || element.getAttribute('href');
          if (href && href.startsWith('#fn')) {
            return href.substring(3);
          }
          const refId = element.getAttribute('data-footnote-ref-id');
          if (refId) return refId;
          return element.textContent?.replace(/[\[\]^]/g, '') || '1';
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'sup.footnote-ref',
        priority: 200,
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['sup', mergeAttributes(HTMLAttributes, { class: 'footnote-ref', 'data-footnote-ref-id': HTMLAttributes.id }), `[${HTMLAttributes.id}]` ];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state, node) { state.write(`[^${node.attrs.id}]`); },
        parse: {
          setup(markdownit) {
            if (!markdownit.__hasFootnotePlugin) {
              markdownit.use(markdownItFootnote);
              markdownit.__hasFootnotePlugin = true;
            }
          }
        },
      },
    };
  },
});

const Footnote = Node.create({
  name: 'footnote',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,
  addAttributes() {
    return {
      id: {
        default: '1',
        parseHTML: element => {
          const id = element.getAttribute('id');
          const fnId = element.getAttribute('data-footnote-id');
          if (id && id.startsWith('fn')) {
            return id.substring(2);
          }
          if (fnId) return fnId;
          return '1';
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'li.footnote-item',
        priority: 200,
        contentElement: (node) => {
          const clone = (node as HTMLElement).cloneNode(true) as HTMLElement;
          clone.querySelectorAll('.footnote-backref').forEach(a => a.remove());
          return clone;
        },
      },
      {
        tag: 'div.footnote-item',
        priority: 200,
        contentElement: 'div.footnote-content',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'footnote-item', 'data-footnote-id': HTMLAttributes.id }),
      ['span', { class: 'footnote-label' }, `${HTMLAttributes.id}.`],
      ['div', { class: 'footnote-content' }, 0],
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write(`[^${node.attrs.id}]: `);
          const textParts: string[] = [];
          node.descendants((child: any) => {
            if (child.isText) {
              const cleaned = child.text?.replace(/↩︎/g, '');
              if (cleaned) textParts.push(cleaned);
            }
            return true;
          });
          const text = textParts.join('').trim();
          if (text) state.write(text);
          state.write('\n');
        },
      },
    };
  },
});

const FootnoteContainer = Node.create({
  name: 'footnoteContainer',
  group: 'block',
  content: 'footnote+',
  defining: true,
  parseHTML() {
    return [
      { tag: 'ol.footnotes-list', priority: 250 },
      { tag: 'div.footnotes-section', priority: 250 },
    ];
  },
  renderHTML() { return ['div', { class: 'footnotes-section' }, 0]; },
  addStorage() {
    return { markdown: { serialize(state, node) { state.renderContent(node); } } };
  },
});

const editor = new Editor({
  extensions: [
    StarterKit,
    Markdown,
    FootnoteSep,
    FootnoteContainer,
    FootnoteReference,
    Footnote,
  ],
  content: `Here's a sentence with a footnote. [^1]

[^1]: This is the footnote.`,
});

console.log('=== INITIAL MARKDOWN ===');
const firstMarkdown = editor.storage.markdown.getMarkdown();
console.log(firstMarkdown);

// Let's run a second cycle of setting content and getting markdown
editor.commands.setContent(firstMarkdown);

console.log('=== SECOND JSON ===');
console.log(JSON.stringify(editor.getJSON(), null, 2));

console.log('=== SECOND MARKDOWN ===');
const secondMarkdown = editor.storage.markdown.getMarkdown();
console.log(secondMarkdown);

editor.destroy();
process.exit(0);
