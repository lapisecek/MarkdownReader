# MarkdownReader

A premium, highly polished desktop application for reading and editing Markdown files. Built with Electron, React, and Tiptap, this editor prioritizes typography, aesthetic design, and a distraction-free user experience while offering powerful under-the-hood capabilities.

## Features

* **Rich Text Editing**: Powered by Tiptap, offering robust Markdown support, seamless code block highlighting, and intuitive text formatting.
* **Intelligent Tables**: Interactive table creation with a visual grid picker, and a contextual floating menu for seamless row/column management.
* **Workspace Explorer**: Integrated file and directory sidebar, allowing you to manage multiple documents in a split-tab view.
* **Advanced Theming**: Multiple curated color palettes (Ocean, Forest, Sunset, Midnight) with full Dark Mode support and tailored CSS highlights.
* **Distraction-Free Modes**: Toggle between a minimalist writing view, reading mode, or full editor UI with a single keystroke.
* **Custom Window Chrome**: Frameless application window with custom drawn title bars and controls for a native, seamless aesthetic.
* **Responsive Architecture**: Debounced state management and background processes ensure typing remains buttery smooth, even on massive documents.

## Technology Stack

* **Core**: Electron
* **Frontend**: React, TypeScript, Vite
* **Styling**: TailwindCSS
* **Editor**: Tiptap (ProseMirror), Lowlight

## Quick Install

The easiest way to get started is to download the pre-compiled Windows package from the GitHub Releases page:

1. Navigate to the **[Releases](https://github.com/lapisecek/MarkdownReader/releases)** page on GitHub.
2. Download the latest `MarkdownReader-win32-x64.zip` asset.
3. Extract the downloaded `.zip` file to a folder of your choice.
4. Double-click the `MarkdownReader.exe` file inside the extracted folder to run the application immediately.

## Development Build

If you wish to run from source or build the application yourself, ensure you have Node.js and npm installed on your system.

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build the executable for Windows:
   ```bash
   npm run electron:build
   ```
   The compiled `.exe` file will be located in the `dist-electron/MarkdownReader-win32-x64` directory.
## Security Overview

The application follows strict Electron security guidelines and best practices:

* **Context Isolation**: Enabled (`contextIsolation: true`). The renderer process runs in a sandboxed environment and has no direct access to the Node.js API or the underlying operating system.
* **Node Integration**: Disabled (`nodeIntegration: false`). Malicious scripts cannot require Node modules or execute system commands.
* **Secure IPC Bridge**: Inter-Process Communication (IPC) is strictly gated through a `contextBridge` in `preload.cjs`. The frontend can only invoke specific, predefined functions (such as opening native file dialogs) rather than sending arbitrary generic events.
* **XSS Mitigation**: The editor relies on Tiptap's secure rendering engine, which safely parses Markdown and sanitizes HTML outputs, preventing Cross-Site Scripting via malicious document payloads.

## License

This project is open-source and available under the MIT License.
