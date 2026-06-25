# Scope: Fix Vite/React Rendering Issue (Milestone 1)

## Architecture
The frontend of the Markdown Reader is built using Vite, React, and TypeScript.
- **Entry Point**: `index.html` references renderer entry script.
- **Render Script**: `src/main.ts` or `src/main.tsx` mounts the React application (`src/App.tsx`).
- **Main App**: `src/App.tsx` contains the React root component.

Currently, there is a rendering mismatch: either the HTML file references the wrong script, the main script is not rendering the React component correctly, or TS compiler settings prevent rendering.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1.1 | Explore & Diagnose | Spawn Explorer to locate rendering issue and propose fix strategy. | None | PLANNED |
| 1.2 | Implement Fix | Spawn Worker to apply clean fix and ensure compile success. | 1.1 | PLANNED |
| 1.3 | Review & Verify | Spawn Reviewer to verify compilation and rendering logic. | 1.2 | PLANNED |
| 1.4 | Integrity Audit | Spawn Forensic Auditor to verify genuine implementation. | 1.3 | PLANNED |

## Interface Contracts
- None needed (internal React/Vite build setup).
