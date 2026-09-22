<div align="center">

  <img src="public/icon.png" width="128" height="128" alt="MarkdownReader Logo" />

  # MarkdownReader

  **The Next-Generation Desktop Markdown Workspace for Windows**

  *Engineered for distraction-free technical writing, mathematical typesetting, interactive diagrams, and deep Windows ecosystem integration.*

  <p align="center">
    <a href="https://github.com/lapisecek/MarkdownReader/releases">
      <img src="https://img.shields.io/github/v/release/lapisecek/MarkdownReader?color=7c3aed&label=Release&logo=github&style=for-the-badge" alt="Release" />
    </a>
    <a href="https://github.com/lapisecek/MarkdownReader/releases">
      <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows&style=for-the-badge" alt="Windows Platform" />
    </a>
    <a href="https://electronjs.org">
      <img src="https://img.shields.io/badge/Electron-35-47848F?logo=electron&logoColor=white&style=for-the-badge" alt="Electron" />
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=for-the-badge" alt="TypeScript" />
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge" alt="License: MIT" />
    </a>
  </p>

  <p align="center">
    <a href="#-key-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-windows-desktop-integration">Windows Integration</a> •
    <a href="#-keyboard-shortcuts">Shortcuts</a> •
    <a href="#-building-from-source">Build</a> •
    <a href="#-security">Security</a>
  </p>

</div>

---

## 📖 Overview

**MarkdownReader** is a modern, high-performance desktop Markdown workspace meticulously crafted for Windows 10 and 11. Powered by Electron, React 19, TypeScript, and the Tiptap rich-text engine, it combines the immediacy of a distraction-free document viewer with a powerful, extensible technical editing suite.

Whether drafting research papers with KaTeX formulas, architecting systems with interactive Mermaid diagrams, or publishing clean PDFs with zero UI clutter, MarkdownReader delivers a fluid, native experience tailored to your workflow.

---

## ✨ Key Features

### ⚡ Blazing-Fast & Responsive Performance
- **Zero White-Flash Startup**: Pre-rendered inline theme script ensures seamless, flash-free launches in dark or light mode.
- **Non-blocking Asynchronous I/O**: High-throughput file loading and streaming with Node's `fs.promises`.
- **Large Document Optimization**: Optimized ProseMirror transaction indexing and search rendering capped to ensure lag-free scrolling even in massive files.
- **Subtle Task Indicators**: Non-intrusive top-edge progress bars and status indicators keep you informed during intensive operations without breaking focus.

### 📐 Offline KaTeX Math Typesetting
- Support for inline equations (`$E=mc^2$`) and multiline display equation blocks (`$$\sum_{i=0}^n i$$`).
- Offline bundled vector fonts (WOFF2/TTF) for crisp math rendering anywhere without an internet connection.
- Real-time WYSIWYG equation rendering with seamless source synchronization.

### 📊 Interactive Mermaid.js Diagrams
- Render Flowcharts, Sequence Diagrams, State Machines, Gantt Charts, Mindmaps, C4 Architecture, and ER Diagrams directly in fenced ```mermaid blocks.
- **Dual-Mode Widget**: Instant one-click toggle between **Interactive Diagram View** and **Raw Source View**.
- Automatically adapts to current dark/light palette and custom accent colors.

### 🖨️ Isolated PDF & Print Studio
- **Pure Document Export**: PDF and print rendering executes in an isolated background renderer, ensuring zero UI chrome, toolbars, popups, or sidebars ever leak into your document.
- **Live Scaled Preview**: Interactive paper simulation with zoom controls and format presets (A4, US Letter, A3, Legal, Tabloid).
- **Standalone HTML Export**: Export fully self-contained HTML documents bundled with local styles and offline typography.

### 🎨 Personalization & Typography Studio
- **Windows System Font Discovery**: Real-time enumeration of fonts installed on your Windows machine with instant live search and hover preview.
- **Apply Font to Entire App UI**: Toggle to extend your chosen typography beyond the editor across all tabs, sidebars, toolbars, and dialogs.
- **Interactive Pangram Preview**: Real-time preview card updating live with selected font, size, and line-height.
- **Animation Speed Multiplier**: Adjust interface transition speeds from relaxed (`0.5x`) to ultra-fast (`3.0x`), or turn them off completely.
- **Curated Themes & Custom Accents**: Choose from 6 designer palettes or pick any custom HEX accent color.

### 🪟 Deep Windows Ecosystem Integration
- **Windows Setup Assistant**: Automatic bottom-right notification on launch detects missing associations or shortcuts with 1-click automatic repair.
- **1-Click File Association**: Instantly associate `.md` and `.markdown` files with registry icon stamping.
- **Explorer Context Menu**: Right-click any file to *"Edit with MarkdownReader"* or any folder to *"Open Folder in MarkdownReader"*.
- **Desktop & Start Menu Integration**: Automatically deploys high-resolution shortcuts into the Windows Start Menu and Desktop.
- **Windows AppUserModelID**: Registered as `com.adamk.markdownreader` for proper taskbar grouping, pinning, and window management.
- **Custom Frameless Titlebar**: Native double-click maximize/restore, window snapping, and custom window control buttons.

### 🖼️ Smart Asset Pipeline & Lightbox
- **Direct Screenshot Paste**: Press `Ctrl+V` to paste images directly from the clipboard; files are automatically saved to `./assets/` with relative Markdown references.
- **Drag-and-Drop Ingestion**: Drop images directly into the editor for instant local storage and linking.
- **Fullscreen Image Lightbox**: High-performance image viewer with smooth mouse-wheel zoom towards cursor and middle-click drag-to-pan.

### 🧠 Smart Opening Modes
- **Intelligent Mode Detection**: External Markdown files opened for the first time default to **Reading Mode**, while documents created or edited in the app default to **Editing Mode**.
- **Configurable Preferences**: Set default behavior to *Smart*, *Always Reading*, or *Always Editing* in Settings.

---

## 🚀 Quick Start

### Installation

1. Head over to the latest [**GitHub Releases**](https://github.com/lapisecek/MarkdownReader/releases).
2. Download `MarkdownReader-v2.0.2-win32-x64.zip`.
3. Extract the folder and launch `MarkdownReader.exe`.

### 1-Click Windows Setup
When launched for the first time, MarkdownReader will show a setup prompt in the bottom-right corner:
- Click **"Fix All & Apply"** to instantly register `.md` file associations, create Start Menu shortcuts, and enable Explorer context menus.
- You can also manage or modify these settings at any time in **Settings (`Ctrl+,`) > Windows**.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | **New Document** | Creates a new blank document tab |
| <kbd>Ctrl</kbd> + <kbd>O</kbd> | **Open File** | Open a Markdown file from your computer |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | **Save File** | Save changes to the active document |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | **Save As** | Save document with a new name or path |
| <kbd>Ctrl</kbd> + <kbd>W</kbd> | **Close Tab** | Close the currently active tab |
| <kbd>Ctrl</kbd> + <kbd>E</kbd> | **Toggle Mode** | Switch between Reading and Editing mode |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> | **Export Studio** | Open the isolated PDF / Print export dialog |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | **Settings** | Open the settings configuration modal |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> | **Find & Replace** | Open the search and replace drawer |
| <kbd>Ctrl</kbd> + <kbd>\</kbd> | **Toggle Sidebar** | Expand or collapse the file explorer sidebar |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> | **Toggle Outline** | Expand or collapse document structure outline |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | **Bold** | Format selected text in bold |
| <kbd>Ctrl</kbd> + <kbd>I</kbd> | **Italic** | Format selected text in italic |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | **Insert Link** | Insert a hyperlink at cursor position |

---

## 🛠️ Building from Source

### Prerequisites
- **Windows 10 / 11** (64-bit)
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone & Install
```bash
git clone https://github.com/lapisecek/MarkdownReader.git
cd MarkdownReader
npm install
```

### 2. Run in Development Mode
```bash
# Starts Vite dev server and launches Electron concurrently
npm run electron:dev
```

### 3. Production Build
```bash
# Compiles frontend assets, packs app.asar, builds executable, creates release zip,
# and automatically updates the Windows Start Menu shortcut
npm run electron:build
```

Compiled outputs are generated at:
- `dist-electron/MarkdownReader-win32-x64/`
- `dist-electron/win-unpacked/`
- `dist-electron/MarkdownReader-v2.0.2-win32-x64.zip`

---

## 🔐 Security Architecture

MarkdownReader is designed following strict Electron security guidelines:
- **Renderer Isolation**: `contextIsolation: true` is strictly enforced across all browser windows.
- **Node Integration Disabled**: `nodeIntegration: false` in all renderer processes.
- **Secure Preload Bridge**: Safe, typed inter-process communication (IPC) exclusively via `contextBridge.exposeInMainWorld('electronAPI', ...)`.
- **Isolated Print Renderer**: Print and PDF rendering happens in a sandboxed, ephemeral background window with zero access to main window state.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

<div align="center">
  <sub>Crafted with care by <a href="https://github.com/lapisecek">lapisecek</a></sub>
</div>
