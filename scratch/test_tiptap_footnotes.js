import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { FootnoteSep, FootnoteReference, Footnote, FootnoteContainer } from '../src/extensions/Footnotes.js';

const editor = new Editor({
  extensions: [
    StarterKit,
    Markdown,
    FootnoteSep,
    FootnoteContainer,
    FootnoteReference,
    Footnote,
  ],
  content: `Here's a sentence with a footnote. [[^1]]

[^1]: This is the footnote.`,
});

console.log('=== INITIAL MARKDOWN ===');
console.log(editor.storage.markdown.getMarkdown());

// Let's run a second cycle of setting content and getting markdown
const firstMarkdown = editor.storage.markdown.getMarkdown();
editor.commands.setContent(firstMarkdown);

console.log('=== SECOND MARKDOWN ===');
console.log(editor.storage.markdown.getMarkdown());

editor.destroy();
