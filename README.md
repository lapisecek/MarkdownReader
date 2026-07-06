# MarkdownReader

Current version: 1.2.0

MarkdownReader is a Windows desktop Markdown editor built with Electron, React, TypeScript, and Tiptap. It combines tabbed editing, a folder explorer, and a polished writing surface for working with multiple documents in one window.

## Highlights

- Tabbed editing for multiple open documents
- Folder explorer for browsing local directories and opening Markdown files
- Rich Markdown editing for tables, task lists, links, images, headings, code blocks, block quotes, highlights, subscript, superscript, definition lists, emoji, and footnotes
- Reading mode and editable mode for switching between review and writing
- Theme presets with dark mode support and adjustable editor settings
- Auto-save, save sounds, ambient audio, and keyboard shortcuts
- Fullscreen image viewing inside the editor
- Native Windows file handling and unsaved-changes prompts

## Requirements

- Windows
- Node.js and npm for local development

## Install

Download the latest Windows release from the [GitHub Releases page](https://github.com/lapisecek/MarkdownReader/releases).

1. Download the latest `MarkdownReader-win32-x64.zip` asset.
2. Extract the archive.
3. Launch `MarkdownReader.exe` from the extracted folder.

## Development

To run the app from source:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the Vite dev server:

   ```bash
   npm run dev
   ```

3. Launch Electron against the dev server:

   ```bash
   npm run electron:dev
   ```

## Build

To produce a Windows package:

```bash
npm run electron:build
```

The packaged app is written to `dist-electron/MarkdownReader-win32-x64`.

## Security

The app keeps Electron security boundaries in place:

- Context isolation is enabled.
- Node integration is disabled in the renderer.
- Renderer access to native features is routed through the preload bridge.

## License

MIT
