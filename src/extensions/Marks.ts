import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import markdownItMark from 'markdown-it-mark';
import markdownItSub from 'markdown-it-sub';
import markdownItSup from 'markdown-it-sup';

export const CustomHighlight = Highlight.extend({
  addStorage() {
    return {
      markdown: {
        serialize: { open: '==', close: '==' },
        parse: {
          setup(markdownit: any) {
            markdownit.use(markdownItMark);
          }
        }
      }
    };
  }
});

export const CustomSubscript = Subscript.extend({
  addStorage() {
    return {
      markdown: {
        serialize: { open: '~', close: '~' },
        parse: {
          setup(markdownit: any) {
            markdownit.use(markdownItSub);
          },
          updateDOM(element: HTMLElement) {
            // Tiptap expects <sub>, but markdown-it-sub renders <sub>
            // We just need to make sure the tags are preserved correctly.
          }
        }
      }
    };
  }
});

export const CustomSuperscript = Superscript.extend({
  addStorage() {
    return {
      markdown: {
        serialize: { open: '^', close: '^' },
        parse: {
          setup(markdownit: any) {
            markdownit.use(markdownItSup);
          }
        }
      }
    };
  }
});
