# ROADMAP.md

> **Current Phase**: 2
> **Milestone**: v1.1

## Must-Haves (from SPEC)
- [x] Block unverified prescription orders.
- [x] Create pending prescription approvals.
- [x] Process approvals via an Admin UI.
- [x] Allow approved users to order.

## Phases

### Phase 1: Admin Approval Flow
**Status**: ✅ Complete
**Objective**: Implement the backend database changes, agent logic, and frontend UI to support prescription approvals.
**Requirements**: App-wide integration of the prescription verification flow.

### Phase 2: Siddharth UI Merge
**Status**: 🏃 In Progress
**Objective**: Safely merge the siddharth branch UI updates into main without losing recent complex backend additions.
**Requirements**: Protect current uncommitted backend state, meticulously resolve backend and ChatInterface conflicts.

### Phase 3: ClientDashboard App UI implementation
**Status**: ✅ Complete
**Objective**: Build out the 3-column app application UI including dark mode themings, navigation, chat sessions logic, and interactive messages.
**Requirements**: Integrates seamlessly with `/chat` and `/agent/upload_prescription` models.
