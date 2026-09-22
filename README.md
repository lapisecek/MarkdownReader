<div align="center">

  <img src="public/icon.png" width="128" height="128" alt="MarkdownReader Logo" />

  # MarkdownReader

  **Desktop Markdown Workspace for Windows**

  *Engineered for distraction-free technical writing, mathematical typesetting, interactive diagrams, and Windows desktop integration.*

  <p align="center">
    <a href="https://github.com/lapisecek/MarkdownReader/releases">
      <img src="https://img.shields.io/github/v/release/lapisecek/MarkdownReader?color=7c3aed&label=Release&style=flat-square" alt="Release" />
    </a>
    <a href="https://github.com/lapisecek/MarkdownReader/releases">
      <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=flat-square" alt="Windows Platform" />
    </a>
    <a href="https://electronjs.org">
      <img src="https://img.shields.io/badge/Electron-35-47848F?style=flat-square" alt="Electron" />
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square" alt="TypeScript" />
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-10b981.svg?style=flat-square" alt="License: MIT" />
    </a>
  </p>

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Performance and Startup](#performance-and-startup)
  - [KaTeX Math Formulas](#katex-math-formulas)
  - [Mermaid Diagrams](#mermaid-diagrams)
  - [PDF and Print Studio](#pdf-and-print-studio)
  - [Typography and Personalization](#typography-and-personalization)
  - [Windows Integration](#windows-integration)
  - [Asset Pipeline and Lightbox](#asset-pipeline-and-lightbox)
  - [Document Opening Modes](#document-opening-modes)
- [Quick Start](#quick-start)
  - [Installation](#installation)
  - [Windows Setup Assistant](#windows-setup-assistant)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Building from Source](#building-from-source)
  - [Prerequisites](#prerequisites)
  - [Development Setup](#development-setup)
  - [Production Build](#production-build)
- [Security Architecture](#security-architecture)
- [License](#license)

---

## Overview

MarkdownReader is a desktop Markdown application developed for Windows 10 and Windows 11. Built with Electron, React 19, TypeScript, and the Tiptap rich-text editing engine, it combines distraction-free document viewing with a technical editing suite.

The application supports mathematical typesetting via offline-bundled KaTeX, interactive diagrams via Mermaid.js, clean PDF export without user interface bleed, system font discovery, and deep Windows shell integration.

---

## Features

### Performance and Startup
- **Zero White-Flash Startup**: Inline scripts apply theme and background styles before first paint to prevent flashes in dark and light modes.
- **Asynchronous File Operations**: High-throughput document streaming powered by Node.js asynchronous filesystem APIs (`fs.promises`).
- **Large Document Optimization**: ProseMirror indexing and search highlights are capped and optimized to maintain smooth scrolling and editing on large files.
- **Background Task Indicators**: Progress indicators in the header and status bar inform the user during heavy file operations and large text processing.

### KaTeX Math Formulas
- Support for inline equations (`$E=mc^2$`) and display equation blocks (`$$\sum_{i=0}^n i$$`).
- Bundled offline vector fonts (WOFF2 and TTF) for mathematical rendering without network connectivity.
- WYSIWYG equation rendering with automatic Markdown serialization.

### Mermaid Diagrams
- Render flowcharts, sequence diagrams, state machines, Gantt charts, mindmaps, C4 architecture, and entity-relationship diagrams in fenced `mermaid` code blocks.
- **Dual-Mode Widget**: Switch between the rendered SVG diagram and raw source code at any time.
- Color schemes automatically match the active application palette and accent settings.

### PDF and Print Studio
- **Isolated Print Renderer**: Print and PDF rendering runs in a separate background renderer to guarantee that editor toolbars, dialogs, and sidebars never appear in exported documents.
- **Scaled Paper Preview**: Live preview with page format selection (A4, US Letter, A3, Legal, Tabloid), orientation, margin controls, and zoom settings.
- **Standalone HTML Export**: Export single-file HTML documents with embedded offline stylesheets and typography.

### Typography and Personalization
- **Windows System Font Discovery**: Real-time listing of installed Windows fonts with instantaneous search filtering and hover preview.
- **Apply Font to Entire App UI**: Optional setting to extend the chosen typeface across all tabs, sidebar tree, toolbars, buttons, and dialogs.
- **Pangram Preview**: Live interactive preview card displaying the active font, configured font size, and line height.
- **Animation Speed Multiplier**: Configurable interface transition speeds from 0.25x to 3.0x, or disable animations entirely.
- **Theme Palettes and Custom Accents**: Choose from preset palettes (Zinc, Cobalt, Emerald, Violet, Rose, Amber) or specify any custom HEX accent.

### Windows Integration
- **Windows Setup Assistant**: Automatic prompt on launch checks for missing associations or shortcuts with one-click configuration.
- **File Association**: Register `.md` and `.markdown` file extensions in the Windows Registry with dedicated application icons.
- **File Explorer Context Menu**: Right-click context actions to "Edit with MarkdownReader" on files and "Open Folder in MarkdownReader" on directories.
- **Start Menu and Desktop Shortcuts**: Automatic deployment of high-resolution shortcuts to the Windows Start Menu and Desktop.
- **Application User Model ID**: Registered as `com.adamk.markdownreader` for taskbar pinning, window grouping, and system notification handling.
- **Frameless Titlebar**: Custom header with double-click maximize/restore, window snapping support, and minimize/maximize/close controls.

### Asset Pipeline and Lightbox
- **Direct Screenshot Pasting**: Pressing `Ctrl+V` pastes clipboard images directly into the active document, saving the file to `./assets/` with relative Markdown paths.
- **Drag-and-Drop Files**: Dragging local images into the editor copies them into the document asset directory.
- **Fullscreen Lightbox**: Zoom towards the mouse cursor and pan using middle-click to inspect diagrams and images.

### Document Opening Modes
- **Smart Mode**: Automatically opens external Markdown files in Reading Mode and newly created or edited files in Editing Mode.
- **Configurable Default**: Option to enforce Always Reading, Always Editing, or Smart Mode via Settings.

---

## Quick Start

### Installation

1. Go to the [Releases](https://github.com/lapisecek/MarkdownReader/releases) page.
2. Download `MarkdownReader-v2.0.2-win32-x64.zip`.
3. Extract the archive and launch `MarkdownReader.exe`.

### Windows Setup Assistant

When launched for the first time, MarkdownReader displays an integration assistant in the bottom-right corner. Click **"Fix All & Apply"** to configure `.md` file associations, create Start Menu shortcuts, and enable Explorer context menu actions. These options can also be adjusted under **Settings (`Ctrl+,`) > Windows**.

---

## Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | New Document | Opens a new blank document tab |
| <kbd>Ctrl</kbd> + <kbd>O</kbd> | Open File | Select and open a local Markdown file |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Save File | Save the active document |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | Save As | Save document with a new file path |
| <kbd>Ctrl</kbd> + <kbd>W</kbd> | Close Tab | Close the active document tab |
| <kbd>Ctrl</kbd> + <kbd>E</kbd> | Toggle Mode | Switch between Reading and Editing modes |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> | Export Studio | Open the PDF and Print export dialog |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | Settings | Open application configuration |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> | Find and Replace | Open search drawer |
| <kbd>Ctrl</kbd> + <kbd>\</kbd> | Toggle Sidebar | Show or hide the file explorer sidebar |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> | Toggle Outline | Show or hide the document headings outline |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Bold | Toggle bold styling on selection |
| <kbd>Ctrl</kbd> + <kbd>I</kbd> | Italic | Toggle italic styling on selection |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Insert Link | Insert or edit a hyperlink |

---

## Building from Source

### Prerequisites
- Windows 10 or Windows 11 (64-bit)
- Node.js version 18.0.0 or higher
- npm version 9.0.0 or higher

### Development Setup
```bash
# Clone the repository
git clone https://github.com/lapisecek/MarkdownReader.git
cd MarkdownReader

# Install dependencies
npm install

# Start Vite development server and Electron concurrently
npm run electron:dev
```

### Production Build
```bash
# Compile frontend, package app.asar, build executable, create release zip,
# and register Windows Start Menu shortcut
npm run electron:build
```

Generated outputs:
- `dist-electron/MarkdownReader-win32-x64/`
- `dist-electron/win-unpacked/`
- `dist-electron/MarkdownReader-v2.0.2-win32-x64.zip`

---

## Security Architecture

MarkdownReader follows Electron security guidelines:
- **Renderer Isolation**: `contextIsolation: true` is enabled across all windows.
- **Node Integration Disabled**: `nodeIntegration: false` in all renderer processes.
- **Secure Preload Bridge**: Inter-process communication runs exclusively through typed channels defined in `preload.cjs`.
- **Isolated Background Print Worker**: Document printing is handled by an ephemeral background window without access to application state.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for the full text.
