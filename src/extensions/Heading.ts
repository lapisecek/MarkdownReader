import Heading from '@tiptap/extension-heading';
import markdownItAttrs from 'markdown-it-attrs';

export const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return { id: attributes.id };
        },
      },
    };
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(state.repeat('#', node.attrs.level) + ' ');
          state.renderInline(node);
          if (node.attrs.id) {
            state.write(` {#${node.attrs.id}}`);
          }
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit: any) {
            markdownit.use(markdownItAttrs, {
              leftDelimiter: '{',
              rightDelimiter: '}',
              allowedAttributes: ['id', 'class'],
            });
          },
        },
      },
    };
  },
});
