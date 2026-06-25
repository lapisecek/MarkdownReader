# E2E Test Infrastructure Design (TEST_INFRA.md)

This document describes the E2E test infrastructure designed for the **Markdown Reader** application. The testing approach is **opaque-box, requirement-driven, and interface-compatible**.

---

## 1. Testing Philosophy & Core Principles

### Opaque-Box Testing
Tests run against the fully compiled/bundled application (or the entry points mimicking the final bundle) without inspecting internal React component state directly, unless exposed. Testing is conducted by:
- Driving interactions via the DOM (e.g., clicking elements, firing keyboard events, typing text).
- Intercepting and mocking system-level dialogs (such as File Save, Message Box prompts) at the Electron main process level.
- Verifying the application's response visually and behaviorally through the DOM and IPC channels.

### Requirement-Driven
Each test suite validates a milestone/feature requirement as defined in `PROJECT.md`. The suite is split into 4 tiers aligning with the 4 core milestones.

### Interface-Compatible
All IPC interaction tests must strictly adhere to the contracts exposed via `window.api` (preload script):
- `onFileLoaded(callback)`
- `saveFile(content)`
- `saveAsFile(content)`
- `onAppCloseRequest(callback)`
- `closeWindowConfirmed()`
- `showUnsavedDialog()`
- `readDirectory(dirPath)`
- `selectDirectory()`

---

## 2. 4-Tier Test Architecture

The test suite is structured into four distinct tiers matching the project features:
- **Tier 1**: React Rendering & Basic Editor Operations
- **Tier 2**: Tabbed Editing & Document Management
- **Tier 3**: Folder Explorer Sidebar & Directory Tree Navigation
- **Tier 4**: Native OS Integration & Lifecycle Handling

---

## 3. Test Cases List

### Tier 1: React Rendering & Basic Editor Operations (20 cases)
1. **App Mounting**: Verify the application window launches and mounts the main `#app` root element.
2. **Title Display**: Verify the initial page title matches the default "markdownreader".
3. **Empty Editor Mount**: Verify a default blank editor is mounted on application startup.
4. **Tiptap Integration**: Verify the editor is instantiated as a Tiptap instance containing markdown-compatible nodes.
5. **Basic Text Input**: Verify that entering text via keystrokes successfully updates the editor content state.
6. **Untitled Document Title**: Verify that a new unsaved document displays the default title "Untitled" (or similar) in the UI.
7. **Toolbar Render**: Verify the editor toolbar is rendered with action buttons (Bold, Italic, Code, Heading).
8. **Bold Formatting Trigger**: Verify that clicking the "Bold" toolbar button applies/inserts bold markdown tags (`**`).
9. **Italic Formatting Trigger**: Verify that clicking the "Italic" toolbar button applies/inserts italic markdown tags (`*` or `_`).
10. **Heading Parsing**: Verify that typing markdown headers (e.g., `# Header`) renders appropriate `<h1>` elements in the DOM.
11. **List Rendering**: Verify bulleted (`- item`) and numbered (`1. item`) list syntax renders correct `<ul>` and `<ol>` HTML lists.
12. **File Load Rendering**: Verify that triggering the `file-loaded` IPC event successfully displays the file content in the editor.
13. **File Path Propagation**: Verify that the loaded file's path is displayed in the window header or title bar.
14. **Save File IPC Invocation**: Verify that saving a previously saved file invokes the `window.api.saveFile` API.
15. **Unsaved Save Redirect**: Verify that saving a new document (with no file path) triggers the "Save As" flow.
16. **Save As Dialog Trigger**: Verify that selecting "Save As" invokes `window.api.saveAsFile` and shows a dialog.
17. **Dirty State Indication**: Verify that editing content in a clean document marks it as "dirty" (e.g. appends `*` to title).
18. **Dirty Reset on Save**: Verify that successfully saving a dirty file resets the dirty indicator back to clean.
19. **Clean Window Exit**: Verify that closing the app when all files are saved terminates without showing warning dialogs.
20. **Dirty Close Prevention**: Verify that trying to close the app with unsaved changes blocks the immediate exit.

### Tier 2: Tabbed Editing & Document Management (20 cases)
1. **Single Tab Default**: Verify that only one default tab is open on initial application startup.
2. **New Tab Creation**: Verify clicking the "+" (New Tab) button adds a new tab to the tab bar.
3. **Active Tab Selection**: Verify that a newly created tab is automatically selected as the active tab.
4. **Tab Switch Content Isolation**: Verify switching between tabs swaps the editor's text content correctly.
5. **Tab Close Button Presence**: Verify that every open tab displays an individual close button.
6. **Tab Close Action**: Verify clicking a tab's close button removes it from the tab list.
7. **Clean Tab Close Behavior**: Verify closing an unmodified tab does not prompt for saving.
8. **Adjacent Tab Activation**: Verify that closing the active tab focuses the next or previous adjacent tab.
9. **Dirty Tab Close Warning**: Verify that closing an unsaved tab triggers `window.api.showUnsavedDialog`.
10. **Tab Title Verification**: Verify that each tab header displays the correct file name (e.g., `Untitled 2` or `notes.md`).
11. **Dirty Icon indicator**: Verify a visual indicator (like a dot or asterisk) appears on tabs with unsaved edits.
12. **Tab Renaming on Save**: Verify that saving a tab as a file updates the tab header text to the saved file name.
13. **Tab Navigation Shortcuts**: Verify navigating tabs using keyboard shortcuts (e.g., Ctrl+Tab / Ctrl+Shift+Tab) works.
14. **Tab Reordering (Drag and Drop)**: Verify tabs can be reordered manually (if supported) or order is preserved.
15. **File Drop/Open Target Tab**: Verify opening a file via double-click/IPC opens it in a new tab if current is occupied.
16. **Duplicate File Tab Prevention**: Verify that opening an already-opened file switches focus to its tab instead of duplicating it.
17. **No-Tab Blank State**: Verify closing the last remaining tab either displays a blank screen state or creates a fresh empty tab.
18. **Close All Tabs Shortcut**: Verify a global close all command prompts for save on all dirty tabs sequentially.
19. **Tab Session Isolation**: Verify that multiple tabs do not share local editor variables or undo/redo history stacks.
20. **Tab Overflow Handling**: Verify that opening a large number of tabs renders a scrollable or wraps tab list.

### Tier 3: Folder Explorer Sidebar (4 cases)
1. **Sidebar Toggle**: Verify that the sidebar panel can be collapsed and expanded via a toggle button.
2. **Directory Selection Dialog**: Verify that clicking "Open Folder" triggers `window.api.selectDirectory` and receives folder paths.
3. **File Tree Rendering**: Verify the sidebar renders a folder and file tree hierarchy using `window.api.readDirectory`.
4. **File Selection from Tree**: Verify that double-clicking a `.md` file in the sidebar opens that file in a new editor tab.

### Tier 4: Native OS Integration (5 cases)
1. **Single-Instance Lock**: Verify that launching a second instance of the application focuses the first instance instead of starting a new process.
2. **File Association (Launch)**: Verify that launching Electron with a file path argument (e.g., `electron . my-doc.md`) loads it automatically.
3. **File Association (Runtime)**: Verify that attempting to launch a second instance with a file path opens the file in the running first instance.
4. **Dirty Window Close - Save Option**: Verify closing application on dirty document, choosing "Save" from dialog, saves the document and exits.
5. **Dirty Window Close - Discard Option**: Verify closing application on dirty document, choosing "Don't Save", exits without saving.
