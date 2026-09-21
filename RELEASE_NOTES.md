# MarkdownReader v1.3.0 Release Notes

**MarkdownReader v1.3.0** is a major milestone release transforming MarkdownReader into a production-grade, lightning-fast, and complete Windows desktop Markdown workspace.

---

## 🚀 Key Highlights & New Features

### 📐 KaTeX Math Formulas (`$...$` & `$$...$$`)
- Full support for inline LaTeX formulas with `$formula$` and display block equations with `$$formula$$`.
- Ultra-crisp KaTeX typography bundled locally with WOFF2/TTF fonts for completely offline rendering.
- Real-time WYSIWYG formula rendering with seamless Markdown serialization.

### 📊 Interactive Mermaid.js Diagrams
- Code blocks tagged `mermaid` automatically render into interactive, scalable SVG diagrams (Flowcharts, Sequence diagrams, State machines, Gantt charts, Mindmaps, C4, Architecture, ER diagrams, and more).
- Dual-mode diagram widget: easily toggle between **View Diagram** and **View Source** at any time.
- Fully synchronized with dark/light themes and accent colors.

### 📄 Export Studio (Native PDF & Standalone HTML)
- **Native Windows PDF Export**: Export pixel-perfect paginated PDF documents directly through Chromium's native `printToPDF` engine (supports A4 and US Letter).
- **Standalone HTML Export**: Export fully self-contained HTML files embedded with all typography, styles, and color schemes—ideal for sharing with anyone on the web or email.
- **Direct System Print**: One-click quick print with `Ctrl+P` integration.

### 🖼️ Smart Local Image Paste & Drop
- Paste screenshots directly from the clipboard (`Ctrl+V`) or drag-and-drop image files straight into your documents.
- Automatic local asset persistence: images are saved directly into the document's `./assets/` folder with clean relative Markdown paths (`![](./assets/image-123.png)`).
- Seamlessly resolves local relative paths in the editor and reader.
- Fullscreen pan/zoom image lightbox with mouse wheel zoom to cursor and middle-click pan.

### ⚙️ Overhauled & Functional Settings Studio
- Completely removed legacy sound clutter.
- **Editor Font Family**: Choose between Modern Sans (`Inter / Segoe UI`), Monospace (`Fira Code / JetBrains Mono`), and Editorial Serif (`Merriweather / Georgia`).
- **Default Document Mode**: Set whether files open in **Reading Mode** or **Editing Mode** by default.
- **Accent Color & Theme Selector**: Dynamic themes (Zinc, Cobalt, Emerald, Violet, Rose, Amber).
- **Editor Tuning**: Fine-tune font size, line height, max reading width, spell check, and auto-save interval.

### 🪟 Windows Setup Assistant & Integration Center
- **Bottom-Right Setup Assistant Popup**: Automatically detects on launch if MarkdownReader is missing system integrations, appearing gracefully in the lower-right corner.
- **1-Click Full Windows Setup**: Easily configure everything in one tap:
  - **Default File Associations**: Registers `.md` and `.markdown` in the Windows registry with icon stamping.
  - **Desktop Shortcut**: Creates a high-res desktop launcher.
  - **Start Menu Programs**: Adds MarkdownReader to the Windows Start Menu and Windows Search index.
  - **Explorer Right-Click Context Menu**: Adds "Edit with MarkdownReader" on `.md` files and "Open Folder in MarkdownReader" on directories.
- **Dedicated Windows Settings Tab**: Full status dashboard in the Settings modal with individual toggles and repair actions.

### 🎨 Windows Ecosystem Polish & Brand Identity
- **New Multi-Resolution Icon**: Crafted from the new high-resolution logo, embedding 7 distinct Windows mipmaps (16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256) for crisp rendering across Windows 11/10 Taskbar, Start Menu, Alt-Tab switcher, and File Explorer.
- **AppUserModelId**: Registered as `com.adamk.markdownreader` for Windows notification routing, taskbar pinning, and jumplists.
- **File Associations**: Full Windows registry associations for `.md` and `.markdown` files.
- **Window Controls & Frameless Titlebar**: Smooth double-click header maximize/restore, custom minimize/maximize/close icons with live maximize state reflection.

### ⚡ Performance & Reliability
- **Non-blocking Async File I/O**: Switched from synchronous `fs` methods in the main process to async `fs.promises`, preventing UI stutter when opening or saving large files.
- **Optimized Bundle Footprint**: Slenderized code-block syntax highlighter from `lowlight(all)` to `lowlight(common)`, cutting over 150 unused grammar engines and reducing client bundle weight.
- **Global Error Boundary**: High-reliability crash boundary with error diagnostic export to ensure users never lose work in unexpected edge cases.

---

## 📦 Installation & Setup

1. Download the latest `MarkdownReader-win32-x64.zip` or run the standalone installer.
2. Extract or run the executable `MarkdownReader.exe`.
3. To set MarkdownReader as your default Markdown viewer on Windows, click **Set as Default (.md)** in the Settings modal or right-click any `.md` file > *Open with* > *Choose another app* > *MarkdownReader*.

---

## 🛠️ Verification & Build Commands

```bash
# Install dependencies
npm install

# Run TypeScript check & Vite client build
npm run build

# Package standalone Windows production application
npm run electron:build
```
