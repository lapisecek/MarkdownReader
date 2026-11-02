# MarkdownReader Release Notes

## 🚀 MarkdownReader v2.1.0 Release Notes

**MarkdownReader v2.1.0** is a major feature, performance, and rendering release delivering comprehensive HTML tag support, interactive disclosure widgets, native keyboard key styling, image layout persistence, KaTeX list math rendering, critical table serialization fixes, and an 88% reduction in initial bundle size for instant startup.

### 🌟 What's New and Enhanced in v2.1.0

- **⚡ Blazing Fast Startup & Dynamic Code-Splitting**:
  - Reduced initial JavaScript entry bundle from **2.17 MB to 270 kB** (an 88% reduction) via aggressive on-demand chunking.
  - Lazy-loaded the 5.1 MB Mermaid diagram library so it is only fetched when a document actually contains Mermaid code blocks.
  - Defer-loaded heavy modal interfaces (Settings Studio, Export Studio, Fullscreen Lightbox) via React Suspense.
  - Configured Electron launch flags with zero-copy texture transfers, GPU rasterization, and deferred Windows Registry access.

- **🌐 Complete HTML Elements & Inline Styling**:
  - **Underline (`<u>`, `<ins>`)**: Native support for underline tags and CSS `text-decoration: underline`, serialized back to clean `<u>...</u>` in Markdown, complete with an Underline button on the bottom toolbar.
  - **Keyboard Badges (`<kbd>`)**: Native styled keyboard key badges (e.g. `<kbd>Ctrl</kbd> + <kbd>C</kbd>`, `<kbd>R</kbd>`) with elevated desktop badge styling.
  - **Collapsible Disclosure Widgets (`<details>` / `<summary>`)**: Interactive collapsible accordions supported natively in reading and editing modes.
  - **Block Alignment (`<div align="...">` & `<center>`)**: Preserves block text alignments (`center`, `right`, `left`, `justify`) and `<center>` tags without breaking surrounding layout.
  - **Inline Colors & Fonts (`<span style="...">`, `<font color="...">`)**: Preserves custom styling, classes, and colors while cleanly isolating math elements from style contamination.
  - **Raw HTML Embeds**: Full support and safe containment for `<iframe>`, `<video>`, `<audio>`, `<figure>`, `<canvas>`, and `<svg>` embeds.

- **🖼️ Image Dimensions & Alignment Persistence**:
  - `CustomImage` now parses and preserves `width`, `height`, inline styles, and horizontal alignment (`align="center"`, `align="left"`, `align="right"`).

- **📐 KaTeX Mathematical Typesetting Enhancements**:
  - **Indented Display Math in Lists**: Enhanced block math grammar rule to interrupt list items and blockquotes (`{ alt: ['paragraph', 'reference', 'blockquote', 'list'] }`), rendering display formulas like `$T_{\\text{vlastní}} = |S_{\\text{out}}|$` inside lists cleanly.
  - **Inline Display Mode**: Supported inline `$...$` math expressions inside paragraphs and table cells.
  - **Accented Characters Support**: Enabled `strict: false` across KaTeX rendering to gracefully render international and accented characters (e.g., Czech `í`, `á`, `ů`, `é`) without throwing parse exceptions.
  - **DOM NodeView Rendering**: Migrated KaTeX from raw string rendering to ProseMirror NodeViews, eliminating escaped HTML tags (`&lt;span class="katex"&gt;`) in the editor.

- **📊 Critical Table Cell Atom Serialization Fix**:
  - Fixed an upstream `tiptap-markdown` table serializer bug where table cells containing atom nodes (math formulas, images, badges) were erroneously dropped if their plain text content was empty. All table cells now preserve their formulas and formatting intact.

- **🖨️ Export & Print Studio Enhancements**:
  - Integrated KaTeX stylesheet and HTML element typography (`<kbd>`, `<u>`, `<details>`, `<summary>`, `<center>`) into HTML and PDF exports.

- **🧪 Modern Test Infrastructure**:
  - Added dedicated E2E test specs for HTML, KaTeX, and Table round-trip fidelity.
  - Sanitized process environment inheritance in the test runner to ensure fast and reliable Electron E2E test execution.

---

## MarkdownReader v2.0.3 Release Notes

**MarkdownReader v2.0.3** is a focused bug fix and stability release resolving typography inheritance in newly created documents and the writing window, restoring instant font reactivity across all editor views, and optimizing default document tab handling.

### What's New and Fixed in v2.0.3
- **Reliable Font Application across Editor & Writing Area**:
  - Fixed an issue where changing the font family (preset or custom Windows system font) did not apply to newly created document tabs or raw source textareas.
  - Bound `--editor-font-family` CSS variable and inline styling to the root container, document body, paper container, raw markdown textarea, and ProseMirror editor.
  - Updated ProseMirror `editorProps` attribute synchronization so that typing and editor transactions do not reset DOM font styling.
- **Enhanced Windows Fallback Stacks**:
  - Re-ordered monospace typography fallbacks to prioritize Windows native typefaces (`Cascadia Code`, `Cascadia Mono`, `Consolas`, `Courier New`) before generic fallbacks.
- **Improved Tab Creation**:
  - Corrected tab initialization logic so that newly created tabs via the `+` button or `Ctrl+N` respect default mode settings (`Reading` vs. `Editing`).
  - Added native `Ctrl+N` shortcut to quickly open a new document tab.
- **Instant Windows Start Menu Integration**:
  - Automatically updates the Windows Start Menu and Desktop shortcuts upon build.

---

## 🚀 MarkdownReader v2.0.2 Release Notes

**MarkdownReader v2.0.2** introduces fine-grained animation control with an animation speed multiplier, an application-wide typography toggle, live font previewing enhancements, and a complete professional documentation overhaul.

### 🌟 What's New in v2.0.2
- **⚡ Animation Speed Multiplier (0.25x – 3.0x)**:
  - Added a dedicated Animation Speed Multiplier under Settings > Appearance.
  - Quick-select pills for `0.5x`, `1.0x`, `1.5x`, `2.0x`, and `3.0x` alongside a smooth granular range slider (`0.25x` to `3.0x`).
  - Seamlessly scales CSS transitions, sidebar folding, tab animations, dialog appearances, floating action buttons, and notification toasts.
  - Setting the multiplier to ultra-fast (`2x`–`3x`) makes the interface feel snappy and instant.
- **🔤 Apply Selected Font to Entire App UI**:
  - Added a toggle under Settings > Appearance > Typography: *"Apply Font to Entire App UI"*.
  - When enabled, your chosen typeface (preset or installed Windows system font) extends beyond the markdown editor to all application chrome: sidebar file tree, tabs bar, top and bottom toolbars, dialogs, and menus.
  - When disabled, keeps clean native Windows system typography (`Segoe UI`) for chrome while isolating custom typography to the editor.
- **👁️ Live Pangram & Hover Font Previewing**:
  - Interactive pangram preview card updating in real time with font size, line spacing, and typeface.
  - Hovering any system font in the search results temporarily previews the font in real time before selection.
- **📖 Complete Professional Documentation Overhaul**:
  - Completely redesigned `README.md` with sleek badges, visual feature breakdowns, comprehensive keyboard shortcuts cheatsheet, architectural diagrams, and build instructions.
- **🛠️ Automated Windows Deployment**:
  - Builds pristine `v2.0.2` portable distribution archive and automatically updates the Windows Start Menu shortcut.

---

## 🚀 MarkdownReader v2.0.1 Release Notes

**MarkdownReader v2.0.1** brings major performance optimizations, isolated publication studio, white-flash elimination, smart reading/editing modes, and extensive customization options.

### 🌟 What's New in v2.0.1
- **⚡ White Flash Elimination**: Completely eliminated the white screen flash when opening or loading Markdown files. Dark mode styling and user preferences are pre-rendered inline before the first UI paint.
- **🚀 Ultra-Optimized Large Document Performance**:
  - Re-engineered ProseMirror search indexing and selection handlers.
  - Match decorations are capped at 500 to prevent freezes on massive Markdown files.
  - Eliminated repetitive document regex traversals during cursor movements and selections.
  - Throttled selections via `requestAnimationFrame` and debounced outline heading generation.
- **⏳ Subtle Task Processing Indicators**: Added non-intrusive visual indicators during intensive operations (file opening, large text replacements, large selections, and saves), including a top-edge progress bar, title-bar status badge, and status-bar spinner.
- **🧠 Smart Default Opening Mode**:
  - External Markdown files opened for the first time default to **Reading Mode**.
  - Files created or edited in MarkdownReader default to **Editing Mode**.
  - Fully configurable in Settings with options: *Smart*, *Always Reading*, or *Always Editing*.
- **📄 Isolated PDF & Print Export Studio**:
  - Fixed screenshot capture bug: PDF and print operations now render pure document content in an isolated background window without leaking any editor controls, popups, or sidebars.
  - Added live scaled paper preview with real-time zoom controls.
  - Page format options (A4, Letter, A3, Legal, Tabloid), orientation, margin presets, scale (60%–140%), themes, and headers/footers.
- **🎨 Custom Color Theme**: Interactive color picker in Settings with curated swatches, hex input, and native color selector.
- **🔤 Real-Time Font Application & System Font Discovery**: Preset fonts (Sans, Mono, Serif) and installed Windows system fonts now apply reactively to the entire document in real-time with an active live font preview. Fixed Windows system font registry enumeration in the main process.
- **🚪 Clean App Close Without False Dialog Flash**: Added mount stabilization and smart tab checking so closing clean documents exits instantaneously (<5ms) without flashing the unsaved changes dialog.
- **🛠️ Automated Build & Instant Start Menu Deployment**: Build script automatically cleans previous builds, terminates locks, compiles the fresh binary, and updates the Windows Start Menu and Desktop shortcuts for instant testing.

---

## MarkdownReader v2.0.0 / v1.3.0 Release Notes

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
