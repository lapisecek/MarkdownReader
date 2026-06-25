import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface SearchOptions {
  searchTerm: string;
  activeMatchIndex: number;
}

const SearchPluginKey = new PluginKey('search');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    search: {
      setSearchTerm: (searchTerm: string) => ReturnType;
      setActiveMatchIndex: (index: number) => ReturnType;
    };
  }
}

export const SearchExtension = Extension.create<SearchOptions>({
  name: 'search',

  addOptions() {
    return {
      searchTerm: '',
      activeMatchIndex: 0,
    };
  },

  addCommands() {
    return {
      setSearchTerm: (searchTerm: string) => ({ tr, dispatch }) => {
        this.options.searchTerm = searchTerm;
        if (dispatch) {
          tr.setMeta(SearchPluginKey, { searchTerm, activeMatchIndex: this.options.activeMatchIndex });
        }
        return true;
      },
      setActiveMatchIndex: (index: number) => ({ tr, dispatch }) => {
        this.options.activeMatchIndex = index;
        if (dispatch) {
          tr.setMeta(SearchPluginKey, { searchTerm: this.options.searchTerm, activeMatchIndex: index });
        }
        return true;
      }
    };
  },

  addProseMirrorPlugins() {
    const extensionThis = this;

    return [
      new Plugin({
        key: SearchPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            // Check if we have a search term change
            const meta = tr.getMeta(SearchPluginKey);
            const term = meta !== undefined ? meta.searchTerm : extensionThis.options.searchTerm;
            const activeIndex = meta !== undefined ? meta.activeMatchIndex : extensionThis.options.activeMatchIndex;

            if (!term) return DecorationSet.empty;

            const doc = tr.doc;
            const decorations: Decoration[] = [];
            let index = 0;

            const regex = new RegExp(
              term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'),
              'gi'
            );

            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                let match;
                regex.lastIndex = 0; // Reset just in case
                while ((match = regex.exec(node.text)) !== null) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: index === activeIndex ? 'search-result search-result-active' : 'search-result',
                    })
                  );
                  index++;
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
