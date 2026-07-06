import { Node, mergeAttributes } from '@tiptap/core';
import markdownItDeflist from 'markdown-it-deflist';

export const DefList = Node.create({
  name: 'defList',
  group: 'block',
  content: '(defTerm | defDescription)+',

  parseHTML() {
    return [{ tag: 'dl' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['dl', mergeAttributes(HTMLAttributes, { class: 'deflist' }), 0];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.renderList(node, '  ', () => '');
          state.write('\n');
        },
        parse: {
          setup(markdownit: any) {
            if (!markdownit.__hasDeflistPlugin) {
              markdownit.use(markdownItDeflist);
              markdownit.__hasDeflistPlugin = true;
            }
          },
        },
      },
    };
  },
});

export const DefTerm = Node.create({
  name: 'defTerm',
  group: 'block',
  content: 'inline*',

  parseHTML() {
    return [{ tag: 'dt' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['dt', mergeAttributes(HTMLAttributes, { style: 'font-weight: bold; margin-top: 1em;' }), 0];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.renderInline(node);
          state.write('\n');
        },
      },
    };
  },
});

export const DefDescription = Node.create({
  name: 'defDescription',
  group: 'block',
  content: 'block+',

  parseHTML() {
    return [{ tag: 'dd' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['dd', mergeAttributes(HTMLAttributes, { style: 'margin-left: 20px;' }), 0];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(': ');
          state.renderContent(node);
          state.write('\n');
        },
      },
    };
  },
});
