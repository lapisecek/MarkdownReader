# Scope: E2E Testing Track

## Architecture
The application is an Electron, React, Vite, and TypeScript app.
The E2E test suite must be opaque-box, requirement-driven, and interface-compatible.
It must run locally without external network dependencies using a custom Node.js/Electron runner.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Infra & Runner | Design `TEST_INFRA.md`, implement custom Node.js + Electron E2E test runner, and verify execution framework. | None | PLANNED |
| 2 | Tier 1: Feature Coverage | Implement at least 20 test cases covering React Rendering, Tabs, Sidebar, and OS Integration features. | M1 | PLANNED |
| 3 | Tier 2: Boundary & Corner Cases | Implement at least 20 test cases covering boundary values, empty inputs, large files, error handling, etc. | M2 | PLANNED |
| 4 | Tier 3 & 4: Combination & Real-World | Implement at least 4 Tier 3 (cross-feature) and 5 Tier 4 (real-world workload) test cases. | M3 | PLANNED |
| 5 | Verification & Publish | Verify all test cases run, verify infrastructure is fully independent, and publish `TEST_READY.md`. | M4 | PLANNED |

## Interface Contracts
- The test runner must execute using a command that can be run from the workspace root (e.g. `node tests/run.js` or `npm test`).
- Test scripts must communicate with the Electron instance via safe IPC hooks or by injecting assertions.
- Output must be structured (JUnit XML, JSON, or console logging) to indicate total tests, passes, and failures.
