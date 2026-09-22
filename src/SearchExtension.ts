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
          apply(tr, oldSet) {
            const meta = tr.getMeta(SearchPluginKey);
            const term = meta !== undefined ? meta.searchTerm : extensionThis.options.searchTerm;
            const activeIndex = meta !== undefined ? meta.activeMatchIndex : extensionThis.options.activeMatchIndex;

            if (!term || !term.trim()) return DecorationSet.empty;

            // If neither search metadata changed nor document content changed, reuse existing decorations
            if (meta === undefined && !tr.docChanged) {
              return oldSet;
            }

            // If document changed but search term did not, and we have existing decorations, map them if possible
            // but if meta explicitly changed, recalculate
            const doc = tr.doc;
            const decorations: Decoration[] = [];
            let index = 0;
            const maxMatches = 500; // Guard against freezing on massive documents with short queries

            try {
              const regex = new RegExp(
                term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'),
                'gi'
              );

              doc.descendants((node, pos) => {
                if (index >= maxMatches) return false;
                if (node.isText && node.text) {
                  let match;
                  regex.lastIndex = 0;
                  while ((match = regex.exec(node.text)) !== null) {
                    if (index >= maxMatches) break;
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
            } catch (e) {
              return DecorationSet.empty;
            }

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
