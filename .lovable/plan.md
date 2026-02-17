

# Parent Data Deletion Portal

## What This Is
A self-service portal where parents can request deletion of their child's data, as required by COPPA. This closes the gap between what our privacy policy promises ("Parents can request immediate deletion at any time") and what we actually provide (currently nothing -- parents would have to email manually).

## How It Works

1. Parent logs into the Parent Dashboard
2. Clicks a new "Data & Privacy" button (alongside existing Notifications, Calendar, Safety buttons)
3. Sees a list of their linked children
4. Can select a child and submit a data deletion request with a reason
5. An admin reviews and processes the request (approve/deny)
6. Upon approval, a backend function deletes the student's data across all relevant tables
7. Parent receives confirmation via the notification system

## What Gets Built

### Database (1 new table)

**`data_deletion_requests`** table:
- `id` (uuid, PK)
- `parent_id` (uuid, FK to parent_accounts)
- `student_id` (uuid, FK to profiles)
- `reason` (text) -- why the parent is requesting deletion
- `status` (enum: pending, approved, denied, completed)
- `requested_at` (timestamptz)
- `reviewed_at` (timestamptz, nullable)
- `reviewed_by` (uuid, nullable -- admin who reviewed)
- `review_notes` (text, nullable)
- `completed_at` (timestamptz, nullable)
- RLS policies: parents can INSERT for their own children, SELECT their own requests; admins can SELECT/UPDATE all

### Backend Function (1 new edge function)

**`process-data-deletion`** -- Admin-only endpoint that:
1. Verifies the caller is an admin (same pattern as `delete-user-account`)
2. Accepts a `request_id`
3. Deletes student data from all relevant tables in order:
   - `aura_records`, `aura_access_log`, `aura_processing_failures`
   - `assignment_submissions`
   - `behavior_records`, `student_behavior_stats`
   - `attendance_records`, `drill_attendance`
   - `student_reading_progress`, `student_reading_stats`, `student_vocabulary`, `student_error_patterns`
   - `student_skill_vectors`, `student_q_tables`, `student_benchmark_results`
   - `student_standard_scores`, `student_risk_history`, `student_interventions`
   - `student_allergies`, `student_medications`, `student_pickups`
   - `teacher_student_notes`
   - `classroom_students` (removes from classrooms)
   - `student_profiles`, `public_profiles`
   - `parent_student_links`, `parent_consents`
4. Optionally deletes the auth user account (using admin API) if parent requests full account removal
5. Updates request status to `completed`
6. Logs everything in `security_audit_log`

### Frontend (2 new pages/components)

**Parent Side -- `src/pages/parent/DataPrivacy.tsx`**:
- Accessible from Parent Dashboard via new "Data & Privacy" button
- Shows list of linked children
- "Request Data Deletion" button per child
- Confirmation dialog explaining what will be deleted
- Reason text field (required)
- List of past/pending requests with status
- Follows existing parent page patterns (Card, glassy design, back button)

**Admin Side -- Addition to Admin Dashboard**:
- New "Deletion Requests" section/tab in admin dashboard
- Table showing pending requests with parent name, student name, reason, date
- Approve/Deny actions with optional notes field
- "Approve" triggers the `process-data-deletion` edge function
- Shows completed/denied request history

### Routing

- New route: `/parent/data-privacy` (added to App.tsx alongside other parent routes)

## Technical Details

### Data Deletion Order
Tables are deleted in dependency order to avoid FK constraint violations. The edge function uses a transaction so it's all-or-nothing.

### Security
- RLS on `data_deletion_requests`: parents can only create requests for their own verified children (using `is_parent_of_student()`)
- Edge function verifies admin role before processing (same pattern as `delete-user-account`)
- All deletions logged in `security_audit_log` for SOC 2 audit trail
- Request includes immutable timestamp trail (requested_at, reviewed_at, completed_at)

### Audit Trail
Every deletion action is logged with:
- Who requested it (parent_id)
- Who approved it (admin user_id)
- What was deleted (student_id + list of tables)
- When each step happened

This satisfies both COPPA's "verifiable deletion" requirement and SOC 2's audit logging requirement.

