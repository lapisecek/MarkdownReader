# Original User Request

## Initial Request — 2026-06-25T15:59:18Z

# Teamwork Project Prompt

Fix the rendering bugs in the current Electron+Vite+React Markdown Reader to ensure the custom UI displays properly, and extend the application with professional features including a folder explorer and tabbed editing.

Working directory: c:\Users\adamk\Desktop\MarkdownReader
Integrity mode: demo

## Requirements

### R1. Fix Vite/React Rendering Issue
Currently, launching the app shows the default Vite boilerplate UI instead of the custom Markdown Reader UI. Fix the entry points, routing, or build configuration so the actual application renders correctly in the Electron window.

### R2. Tabbed Editing
Implement a tab management system in the UI allowing the user to open, edit, and close multiple Markdown files simultaneously within a single window. 

### R3. Folder Explorer Sidebar
Add a sidebar component that allows the user to browse their local filesystem, view directories, and click on `.md` files to open them in a new tab.

### R4. Windows OS Integration & Native Feel
Ensure the app correctly registers and handles opening `.md` files directly from Windows File Explorer (via double-click), passing the file path to the app and opening it in a new tab. Retain the native "Unsaved Changes" warning dialog before closing.

## Acceptance Criteria

### Core App Resolution
- [ ] Launching the built Electron `.exe` or running `npm run dev` displays the custom editor UI, with absolutely no trace of the default Vite boilerplate.

### Feature Completeness
- [ ] The UI contains a visible sidebar that accurately lists files from a selected local directory.
- [ ] The UI contains a tab bar that displays the filenames of currently open documents and allows switching between them.
- [ ] The WYSIWYG Markdown editor (Tiptap) functions correctly within the active tab.

### OS Integration
- [ ] The `main.cjs` or equivalent main process correctly parses `process.argv` and loads the targeted file into a tab when the application is launched with a file path argument.
