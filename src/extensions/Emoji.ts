import { Node, mergeAttributes } from '@tiptap/core';
import { full as markdownItEmoji } from 'markdown-it-emoji';

export const Emoji = Node.create({
  name: 'emoji',
  inline: true,
  group: 'inline',
  atom: true,

  addAttributes() {
    return {
      value: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-emoji]',
        getAttrs: (node) => {
          return { value: (node as HTMLElement).getAttribute('data-emoji') };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-emoji': HTMLAttributes.value }),
      HTMLAttributes.value,
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(node.attrs.value);
        },
        parse: {
          setup(markdownit: any) {
            if (!markdownit.__hasEmojiPlugin) {
              markdownit.use(markdownItEmoji);
              
              // Custom renderer to output proper DOM nodes that Tiptap will pick up
              markdownit.renderer.rules.emoji = (tokens: any[], idx: number) => {
                const token = tokens[idx];
                return `<span data-emoji="${token.content}">${token.content}</span>`;
              };
              markdownit.__hasEmojiPlugin = true;
            }
          },
        },
      },
    };
  },
});
