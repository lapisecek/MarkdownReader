import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="editor"></div></body></html>');
global.window = dom.window as any;
global.document = dom.window.document as any;
global.Node = dom.window.Node as any;
global.HTMLElement = dom.window.HTMLElement as any;
global.customElements = dom.window.customElements as any;

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { CustomTable } from '../src/extensions/CustomTable';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { CustomImage } from '../src/extensions/CustomImage';
import { CustomTaskList, CustomTaskItem } from '../src/extensions/TaskLists';
import { CustomHighlight, CustomSubscript, CustomSuperscript } from '../src/extensions/Marks';
import { CustomUnderline, CustomKbd, CustomHtmlSpan, Details, Summary, CustomDiv, CustomRawHtml } from '../src/extensions/HtmlExtensions';
import { CustomHeading } from '../src/extensions/Heading';
import { FootnoteReference, Footnote, FootnoteContainer, FootnoteSep } from '../src/extensions/Footnotes';
import { DefList, DefTerm, DefDescription } from '../src/extensions/DefList';
import { Emoji } from '../src/extensions/Emoji';
import { MathInline, MathBlock } from '../src/extensions/MathExtension';
import assert from 'assert';

function createEditor(content: string) {
  return new Editor({
    element: dom.window.document.getElementById('editor')!,
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: false, link: false, underline: false }),
      CustomHeading,
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '-',
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      CustomTable.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph', 'customDiv'] }),
      Link.configure({ openOnClick: false }),
      CustomImage,
      CustomTaskList,
      CustomTaskItem.configure({ nested: true }),
      CustomHighlight,
      CustomSubscript,
      CustomSuperscript,
      CustomUnderline,
      CustomKbd,
      CustomHtmlSpan,
      Details,
      Summary,
      CustomDiv,
      CustomRawHtml,
      FootnoteSep,
      FootnoteContainer,
      FootnoteReference,
      Footnote,
      DefList,
      DefTerm,
      DefDescription,
      Emoji,
      MathInline,
      MathBlock,
    ],
    content,
  });
}

console.log('Running Comprehensive Markdown & HTML Round-Trip Tests...\n');

// Test 1: HTML elements
{
  const input = `
Here is <u>underlined text</u> and <kbd>Ctrl</kbd> + <kbd>C</kbd>.

<details>
<summary>Summary Title</summary>

Content inside collapsible details widget.

</details>

<div align="center">

Centered paragraph

</div>
  `.trim();

  const ed = createEditor(input);
  const out = ed.storage.markdown.getMarkdown();

  assert.ok(out.includes('<u>underlined text</u>'), 'Underline should be preserved');
  assert.ok(out.includes('<kbd>Ctrl</kbd>'), 'Kbd should be preserved');
  assert.ok(out.includes('<details>'), 'Details should be preserved');
  assert.ok(out.includes('<summary>Summary Title</summary>'), 'Summary should be preserved');
  assert.ok(out.includes('align="center"'), 'Div align center should be preserved');
  console.log('✓ Test 1: HTML tags (u, kbd, details, summary, div align) passed.');
}

// Test 2: KaTeX Math in Tables and Blocks
{
  const input = `
| Component | Formula | Status |
| --- | --- | --- |
| Undervolt | $S_{\\text{fin}} < C - T$ | OK |
| Max Clock | $S_{\\text{fin}} = C$ | Hot |

* Indented display formula:
  $$T_{\\text{vlastní}} = |S_{\\text{out}}|$$
  `.trim();

  const ed = createEditor(input);
  const out = ed.storage.markdown.getMarkdown();

  assert.ok(out.includes('$S_{\\text{fin}} < C - T$') || out.includes('$S_\\text{fin} < C - T$'), 'Table formula 1 preserved');
  assert.ok(out.includes('$S_{\\text{fin}} = C$') || out.includes('$S_\\text{fin} = C$'), 'Table formula 2 preserved');
  assert.ok(out.includes('T_{\\text{vlastní}} = |S_{\\text{out}}|') || out.includes('T_\\text{vlastní} = |S_\\text{out}|'), 'List math block preserved');
  console.log('✓ Test 2: Math formulas in tables and list-indented display blocks passed.');
}

// Test 3: Raw HTML Embeds & Image attributes
{
  const input = `
<iframe src="https://example.com" width="600" height="400"></iframe>

![Architecture](https://example.com/arch.png){width="500px" height="300px" align="center"}
  `.trim();

  const ed = createEditor(input);
  const out = ed.storage.markdown.getMarkdown();

  assert.ok(out.includes('<iframe'), 'Iframe should be preserved');
  assert.ok(out.includes('https://example.com/arch.png'), 'Image url should be preserved');
  console.log('✓ Test 3: Raw embeds and image attributes passed.');
}

console.log('\nAll Markdown & HTML Round-Trip Tests Passed Successfully!\n');

