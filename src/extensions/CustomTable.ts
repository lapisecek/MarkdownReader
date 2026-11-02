import { Table } from '@tiptap/extension-table';

export const CustomTable = Table.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.inTable = true;
          node.forEach((row: any, _p: any, i: number) => {
            state.write('| ');
            row.forEach((col: any, _p2: any, j: number) => {
              if (j) {
                state.write(' | ');
              }
              const cellContent = col.firstChild;
              if (cellContent && (cellContent.content.size > 0 || cellContent.textContent.trim())) {
                state.renderInline(cellContent);
              }
            });
            state.write(' |');
            state.ensureNewLine();
            if (!i) {
              const delimiterRow = Array.from({ length: row.childCount }).map(() => '---').join(' | ');
              state.write(`| ${delimiterRow} |`);
              state.ensureNewLine();
            }
          });
          state.closeBlock(node);
          state.inTable = false;
        },
      },
    };
  },
});

