## 2026-06-25T16:05:51Z
You are the E2E Test Case Developer for the Markdown Reader project.
Your working directory is c:\Users\adamk\Desktop\MarkdownReader\.agents\worker_tests_m2.
Your workspace directory is c:\Users\adamk\Desktop\MarkdownReader.

Objective:
Implement the test cases for Tier 1, Tier 2, Tier 3, and Tier 4 as defined in `TEST_INFRA.md`.
You need to create the following spec files under `c:\Users\adamk\Desktop\MarkdownReader\tests\specs\`:
1. `tier1_rendering.spec.cjs` (20 test cases)
2. `tier2_tabs.spec.cjs` (20 test cases)
3. `tier3_sidebar.spec.cjs` (4 test cases)
4. `tier4_os.spec.cjs` (5 test cases)

Guidelines:
- Each test file must use the `describe('...', () => { it('...', async (page) => { ... }) })` structure.
- Use the standard `assert` module for assertions.
- Use the `page` driver helper APIs:
  - `await page.evaluate(fn, ...args)`
  - `await page.click(selector)`
  - `await page.type(selector, text)`
  - `await page.waitForSelector(selector, timeout)`
- Use `global.mockDialogs` inside test cases to mock Electron native dialogs:
  - `global.mockDialogs.showSaveDialog = (options) => { return { filePath: 'C:\\path\\to\\file.md', canceled: false }; }`
  - `global.mockDialogs.showMessageBox = (options) => { return { response: 0 }; }` (0 for Save, 1 for Don't Save, 2 for Cancel)
- Since the application code for Milestone 2 (Tabs), Milestone 3 (Sidebar), and Milestone 4 (OS Integration) is not yet fully implemented, design the E2E selectors logically based on expected standard CSS classes and HTML structure (e.g. `.tab-item`, `.tab-close-btn`, `.sidebar-toggle-btn`, `.file-tree-node`, `.editor-toolbar`, etc.).
- Ensure all 49 planned test cases from `TEST_INFRA.md` are mapped 1-to-1 to an `it(...)` block across the four spec files.
- The tests must execute using the custom runner. Do not add external network dependencies.
- Verify the test files syntax is clean and they can be parsed by `tests/runner/run.cjs`.
- Create a handoff report at `c:\Users\adamk\Desktop\MarkdownReader\.agents\worker_tests_m2\handoff.md` detailing the implemented spec files and verifying they are registered by the runner.

Scope Boundaries:
- Do NOT write any application implementation code.
- Do NOT download or install any external packages.

Input Paths:
- `c:\Users\adamk\Desktop\MarkdownReader\TEST_INFRA.md`
- `c:\Users\adamk\Desktop\MarkdownReader\tests\runner\run.cjs`
- `c:\Users\adamk\Desktop\MarkdownReader\tests\runner\test-main.cjs`

Completion Criteria:
- All 4 spec files are created in `tests/specs/` with the exact test cases listed in `TEST_INFRA.md`.
- Handoff report is written to `.agents/worker_tests_m2/handoff.md`.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
