## 2026-06-25T18:01:17+02:00
You are the E2E Infrastructure Developer for the Markdown Reader project.
Your working directory is c:\Users\adamk\Desktop\MarkdownReader\.agents\worker_infra_m1.
Your workspace directory is c:\Users\adamk\Desktop\MarkdownReader.

Objective:
1. Read `PROJECT.md` at the workspace root to understand the application modules and dependencies.
2. Design the E2E test infrastructure (opaque-box, requirement-driven, interface-compatible) using a 4-tier approach as detailed in PROJECT.md. Write the design document to `c:\Users\adamk\Desktop\MarkdownReader\TEST_INFRA.md`. Refer to the 4 features: React Rendering, Tabs, Sidebar, OS Integration. List the planned test cases for Tier 1 (20 cases), Tier 2 (20 cases), Tier 3 (4 cases), Tier 4 (5 cases).
3. Implement a robust E2E test runner in Node.js and Electron that runs without external network dependencies.
   - You can create a test main script `tests/runner/test-main.cjs` which Electron runs. This script should launch the application, intercept/mock electron dialogs, mock filesystem calls where necessary, and run tests.
   - It should support executing code in the renderer window using `webContents.executeJavaScript` to perform DOM assertions, click buttons, input text, and monitor the React application state.
   - Create a test runner script `tests/runner/run.cjs` that spawns Electron with `test-main.cjs`, coordinates test execution, collects test results (passes, fails, execution times), logs details to console, and exits with code 0 if all tests pass, or 1 if any fail.
4. Implement a simple verification spec `tests/specs/smoke.spec.cjs` that checks if the window opens and basic HTML/elements exist, just to verify the runner executes correctly.
5. Create a handoff report at `c:\Users\adamk\Desktop\MarkdownReader\.agents\worker_infra_m1\handoff.md` detailing:
   - Observation: Created files, test architecture, and runner usage.
   - Logic Chain: Rationale for runner design and test structuring.
   - Verification Method: How to run the runner to verify it executes.

Scope Boundaries:
- Do NOT write any application implementation code.
- Do NOT download or install any external packages. Use standard Node.js APIs (path, fs, child_process) and the existing `electron` package.

Input Paths:
- `c:\Users\adamk\Desktop\MarkdownReader\PROJECT.md`
- `c:\Users\adamk\Desktop\MarkdownReader\package.json`
- `c:\Users\adamk\Desktop\MarkdownReader\main.cjs`
- `c:\Users\adamk\Desktop\MarkdownReader\preload.cjs`

Completion Criteria:
- `TEST_INFRA.md` is successfully created.
- The test runner can be invoked and executes `smoke.spec.cjs` successfully (even if React Rendering itself fails since the React app is not fully rendered yet, the runner must execute and report the result).
- Handoff report is written to `.agents/worker_infra_m1/handoff.md`.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
