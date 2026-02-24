## Task Execution Summary: Plan 1.3

- **Objective**: Integrated the pending prescription approvals into the Admin Dashboard.
- **Changes**:
  - `frontend/src/Admin.jsx`: 
    - Added `approvals` to `fetchData` polling `GET /admin/approvals`.
    - Created `handleApproval` to trigger `POST /admin/approvals/{id}` with `status`.
    - Rendered a new "Pending Prescription Approvals" UI table displaying requests with Approve/Reject actions.
- **Verification**: UI component correctly fetches and sends corresponding requests to the FastAPI backend.
- **Status**: Complete.
