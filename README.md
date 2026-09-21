# MarkdownReader

![MarkdownReader Logo](public/icon.png)

A modern, fast, and feature-complete Windows desktop Markdown workspace built with Electron, React, TypeScript, and Tiptap. Engineered for speed, distraction-free writing, rich technical documentation, and deep Windows desktop integration.

---

## ✨ Features

- **⚡ Blazing Fast Architecture**: Non-blocking asynchronous I/O (`fs.promises`), lightweight syntax engine, and virtualized editing.
- **📐 KaTeX Math Formulas**: Full support for inline LaTeX (`$E=mc^2$`) and display equation blocks (`$$\sum_{i=0}^n i$$`) with crisp bundled vector fonts.
- **📊 Interactive Mermaid.js Diagrams**: Render Flowcharts, Sequence diagrams, Gantt charts, Mindmaps, and ER diagrams directly in Markdown code blocks with instant source/diagram toggling.
- **📄 Export Studio**: One-click paginated PDF export (A4 / US Letter via Chromium's native `printToPDF`), standalone self-contained HTML export, and native print dialog.
- **🖼️ Smart Asset Pipeline**: Paste screenshots from clipboard (`Ctrl+V`) or drag-and-drop local image files; images are automatically organized into `./assets/` relative directories.
- **🔍 Fullscreen Image Lightbox**: Smooth mouse-wheel zooming towards cursor and middle-click panning for inspecting large diagrams and screenshots.
- **🗂️ Tabbed Multi-Document Workspace & Explorer**: Work across multiple open tabs and explore project directories seamlessly.
- **🎨 Windows Ecosystem Integration**:
  - Multi-resolution Windows ICO (16x16 to 256x256) for crisp Taskbar, Alt+Tab, and File Explorer presentation.
  - Windows `AppUserModelId` (`com.adamk.markdownreader`) for native taskbar pinning and window grouping.
  - Native file associations for `.md` and `.markdown` files.
  - Modern frameless titlebar with double-click maximize/restore and custom window controls.
- **⚙️ Customization & Themes**:
  - Choose between Sans, Monospace, and Serif typography.
  - Set default file opening mode (Reading vs. Editing).
  - 6 accent theme palettes with full Dark and Light mode support.
  - Configurable line height, font size, reading width, and auto-save timers.
- **🛡️ Resilient Error Handling**: Global Error Boundary with instant diagnostic copying and tab state preservation.

---

## 🚀 Getting Started

### Installation

1. Download the latest release from the [Releases](https://github.com/lapisecek/MarkdownReader/releases) page.
2. Extract the `MarkdownReader-win32-x64.zip` archive or run the installer.
3. Launch `MarkdownReader.exe`.

### Setting as Default Markdown Viewer on Windows

- Open MarkdownReader and navigate to **Settings** (`Ctrl+,`) > **Set as Default (.md)**.
- Or right-click any `.md` file in Windows Explorer -> **Open with** -> **Choose another app** -> Select **MarkdownReader** and check **Always use this app to open .md files**.

---

## 🛠️ Development & Building

### Prerequisites
- Windows 10/11
- Node.js (v18+ recommended) & npm

### Setup
```bash
# Clone the repository
git clone https://github.com/lapisecek/MarkdownReader.git
cd MarkdownReader

# Install dependencies
npm install
```

### Running in Development Mode
```bash
# Concurrently launch Vite dev server and Electron
npm run electron:dev
```

### Production Compilation
```bash
# 1. Typecheck and build the Vite frontend
npm run build

# 2. Package the Windows standalone executable
npm run electron:build
```

The compiled binaries will be output to:
- `dist-electron/MarkdownReader-win32-x64/`
- `dist-electron/win-unpacked/`

---

## 🔐 Security

MarkdownReader adheres to Electron security best practices:
- `contextIsolation` enabled for all renderers.
- `nodeIntegration` disabled in client contexts.
- Secure IPC channel with typed APIs exposed through `preload.cjs`.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
