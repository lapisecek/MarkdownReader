# Orchestration Plan - Markdown Reader

This plan outlines the dual-track execution strategy: Implementation Track and E2E Testing Track.

## Team Topology
1. **E2E Testing Track Orchestrator**: Responsible for designing, implementing, and executing E2E tests.
2. **Implementation Track Orchestrator / Workers**: Responsible for resolving Vite/React rendering, implementing tabs, building the folder explorer sidebar, and integrating with Windows.
3. **Forensic Auditor**: Responsible for auditing the implementation and ensuring no integrity violations.

## Implementation Milestones
- **Milestone 1**: Vite/React Rendering Issue (R1)
- **Milestone 2**: Tabbed Editing (R2)
- **Milestone 3**: Folder Explorer Sidebar (R3)
- **Milestone 4**: Windows OS Integration (R4)

## E2E Testing Tiers
- **Tier 1**: Feature Coverage (App render, tab management, folder explorer display, launch args).
- **Tier 2**: Boundary & Edge Cases (Invalid paths, empty folders, multiple unsaved tabs close flow).
- **Tier 3**: Cross-Feature Combinations.
- **Tier 4**: Real-World Application Scenarios.
- **Tier 5**: Adversarial Coverage Hardening (White-box, white-hat security/stability).
