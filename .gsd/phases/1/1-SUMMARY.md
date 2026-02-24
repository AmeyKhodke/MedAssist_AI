## Task Execution Summary: Plan 1.1

- **Objective**: Added `prescription_approvals` table and related API endpoints.
- **Changes**:
  - `backend/database.py`: Added table creation, insert, select, and status update logic.
  - `backend/app.py`: Added `GET /admin/approvals` and `POST /admin/approvals/{id}` routes, including notification updates.
- **Verification**: Ran `init_db()` successfully. Endpoints are integrated into FastAPI structure.
- **Status**: Complete.
