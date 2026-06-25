# Project: Markdown Reader

## Architecture
The application is built using Electron, Vite, React, and TypeScript.
- **Main Process (`main.cjs`)**: Handles native OS integration, window lifecycle, file association (`process.argv`), file I/O operations, and dialog boxes.
- **Preload Script (`preload.cjs`)**: Exposes secure IPC bridges (`window.api`) to the renderer process.
- **Renderer Process (`src/main.ts` / `src/App.tsx`)**: Renders the editor UI using React and Tiptap Markdown editor.
- **Data Flow**:
  - Main to Renderer: File path/contents on launch/open. Close request events.
  - Renderer to Main: Save file, Save As file, show unsaved warning dialog, confirm close.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Fix Vite/React Rendering Issue | Fix entry point to render App.tsx instead of Vite/TS boilerplate. | None | PLANNED |
| 2 | Tabbed Editing | Manage multiple open documents in a tabbed UI. | M1 | PLANNED |
| 3 | Folder Explorer Sidebar | Add filesystem browsing sidebar in React and IPC for directory listing. | M1 | PLANNED |
| 4 | Windows OS Integration | Single-instance lock, file association handling on launch & runtime, native close/dirty warnings. | M2, M3 | PLANNED |
| 5 | E2E Testing Suite | Design and implement comprehensive E2E opaque-box tests covering all 4 tiers. | None | PLANNED |
| 6 | Final Integration & Hardening | Run E2E tests, pass 100% (Phase 1) and run adversarial coverage hardening (Phase 2). | M1, M2, M3, M4, M5 | PLANNED |

## Code Layout
- `main.cjs` - Main process entry point.
- `preload.cjs` - Preload script exposing electron IPC API.
- `index.html` - Renderer window HTML template.
- `src/main.tsx` - Renderer React entry point.
- `src/App.tsx` - Main React application component.
- `src/components/` - Subcomponents (Sidebar, Tabs, Editor).
- `tests/` - E2E test cases and test runner.

## Interface Contracts
### Renderer ↔ Main Process IPC (`window.api`)
- `onFileLoaded(callback: (data: { filePath: string, content: string }) => void)`: Listen for files loaded by main process.
- `saveFile(content: string)`: Save active tab markdown content. Returns `{ success: boolean, filePath?: string }`.
- `saveAsFile(content: string)`: Prompt save dialog and write content. Returns `{ success: boolean, filePath?: string }`.
- `onAppCloseRequest(callback: () => void)`: Listen for window close request.
- `closeWindowConfirmed()`: Tell main process it's safe to close the window.
- `showUnsavedDialog()`: Prompt user to save, discard, or cancel. Returns button index.
- `readDirectory(dirPath: string)`: IPC call to read contents of a local folder (added for folder explorer).
- `selectDirectory()`: IPC call to prompt folder selection dialog (added for folder explorer).
