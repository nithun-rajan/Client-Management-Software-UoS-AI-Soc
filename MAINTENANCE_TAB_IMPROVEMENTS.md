# Maintenance Tab Improvements

## Summary
This document outlines the improvements needed to make the maintenance tab production-ready based on the CRM Blueprint requirements.

## Current Status ✅
- ✅ Basic CRUD operations (Create, Read, Update, Delete)
- ✅ Maintenance list with tabs (All, Emergencies, Overdue)
- ✅ Status and priority filtering
- ✅ Search functionality
- ✅ Maintenance details page
- ✅ Links to properties and landlords
- ✅ Emergency filtering (includes urgent priority)
- ✅ Timeline visualization
- ✅ Financial tracking display

## Missing Features (Prioritized)

### 🔴 HIGH PRIORITY

#### 1. Status Workflow Actions
**What's Missing:**
- No quick action buttons for status transitions
- Users must manually edit status in a dropdown
- Dates not automatically updated when status changes

**What to Add:**
- Quick action buttons in MaintenanceDetails page:
  - "Acknowledge Issue" (reported → acknowledged) - Sets `acknowledged_date`
  - "Schedule Inspection" (acknowledged → inspected) - Sets `inspection_date`
  - "Request Quote" (inspected → quoted) - Sets status to quoted
  - "Request Approval" (quoted → approved) - Requires landlord approval
  - "Start Work" (approved → in_progress) - Sets `started_date`
  - "Mark Complete" (in_progress → completed) - Sets `completed_date`
  - "Close Issue" (completed → closed) - Sets `closed_date`
  - "Cancel" (any → cancelled) - Sets status to cancelled

**Implementation:**
- Add action buttons above the edit dialog
- Auto-update dates when status changes
- Show confirmation dialogs for critical actions
- Disable actions that aren't valid for current status

#### 2. Contractor/Vendor Integration
**What's Missing:**
- Contractor is just a text field (`contractor_name`, `contractor_contact`)
- No integration with Vendor database
- No contractor history or rating system

**What to Add:**
- Dropdown to select contractor from Vendors database
- Filter vendors by trade/specialization (plumbing, electrical, etc.)
- Display contractor contact information
- Link maintenance issues to vendor records
- Show contractor assignment history

**Implementation:**
- Add vendor_id field to MaintenanceIssue model (optional ForeignKey)
- Update MaintenanceCreate/Update schemas
- Add vendor selection dropdown in create/edit forms
- Display vendor information in details page
- Add vendor filter in maintenance list

#### 3. Landlord Approval Workflow
**What's Missing:**
- `landlord_approved` field exists but no UI workflow
- No way to request approval from landlord
- No approval status tracking

**What to Add:**
- "Request Approval" button when quote_amount > threshold (e.g., £150)
- Approval status display (Pending, Approved, Rejected)
- Approval request date tracking
- Approval history timeline
- Email/SMS notification to landlord (backend)

**Implementation:**
- Add approval request endpoint
- Add approval status display in details page
- Add approval workflow buttons
- Send notification when approval requested
- Update `landlord_approved` and `landlord_approval_date` when approved

### 🟡 MEDIUM PRIORITY

#### 4. Bulk Actions
**What's Missing:**
- No way to update multiple issues at once
- Must edit each issue individually

**What to Add:**
- Checkboxes for selecting multiple issues
- Bulk actions menu:
  - Assign contractor
  - Change status
  - Change priority
  - Add internal notes
  - Export selected

**Implementation:**
- Add selection state to maintenance list
- Add bulk actions toolbar
- Add bulk update endpoint
- Show confirmation dialog for bulk actions

#### 5. Advanced Filtering
**What's Missing:**
- Only basic status and priority filters
- No filters for property, landlord, contractor, dates, costs

**What to Add:**
- Property filter (dropdown)
- Landlord filter (dropdown)
- Contractor filter (dropdown)
- Date range filter (reported_date, completed_date)
- Cost range filter (estimated_cost, actual_cost, quote_amount)
- Save filter presets

**Implementation:**
- Add filter UI components
- Update maintenance list query to support all filters
- Add filter state management
- Add filter presets storage (localStorage)

#### 6. File/Photo Upload
**What's Missing:**
- `photos_urls` and `documents_urls` fields exist but no upload functionality
- No way to attach photos or documents to maintenance issues

**What to Add:**
- File upload component
- Photo gallery view
- Document list view
- Upload progress indicator
- File type validation
- File size limits

**Implementation:**
- Add file upload endpoint (or use existing documents API)
- Add file upload UI component
- Display uploaded files in details page
- Add file deletion functionality

#### 7. Comments/Timeline System
**What's Missing:**
- `internal_notes` and `public_notes` exist but no comment thread
- No way to track updates and communications

**What to Add:**
- Comment thread for each maintenance issue
- Timeline of status changes, assignments, approvals
- User attribution for comments and changes
- Timestamp for all activities

**Implementation:**
- Add comments table/model (or use internal_notes with JSON structure)
- Add comment UI component
- Add timeline visualization
- Track all status changes and updates

### 🟢 LOW PRIORITY

#### 8. Scheduled/Recurring Maintenance
**What's Missing:**
- `is_recurring` and `scheduled_date` fields exist but no UI
- No way to schedule recurring maintenance tasks

**What to Add:**
- Schedule recurring maintenance (e.g., annual boiler service)
- Recurrence settings (frequency, end date)
- Automatic creation of maintenance issues
- Recurrence history

**Implementation:**
- Add scheduling UI component
- Add recurring maintenance model/table
- Add background job to create recurring issues
- Display recurrence information in details page

#### 9. Cost Analytics Dashboard
**What's Missing:**
- No analytics or reporting for maintenance costs
- No way to view maintenance spend trends

**What to Add:**
- Charts showing maintenance costs per property
- Charts showing maintenance costs per contractor
- Charts showing maintenance costs over time
- Budget vs actual cost analysis
- Maintenance spend trends

**Implementation:**
- Add analytics endpoint
- Add charts component (recharts)
- Add analytics dashboard page
- Add date range selector
- Add property/contractor filters

#### 10. Export/Print Functionality
**What's Missing:**
- No way to export maintenance reports
- No way to print work orders

**What to Add:**
- Export maintenance list to CSV
- Export maintenance report to PDF
- Print work order for contractor
- Email reports

**Implementation:**
- Add export endpoint
- Add PDF generation (reportlab or similar)
- Add print stylesheet
- Add export/print buttons

## Recommended Implementation Order

1. **Status Workflow Actions** (Highest impact, improves UX significantly)
2. **Contractor/Vendor Integration** (Core functionality, improves data quality)
3. **Landlord Approval Workflow** (Critical for property management)
4. **Bulk Actions** (Improves efficiency for property managers)
5. **Advanced Filtering** (Improves usability)
6. **File/Photo Upload** (Important for documentation)
7. **Comments/Timeline System** (Improves communication tracking)
8. **Scheduled/Recurring Maintenance** (Nice to have)
9. **Cost Analytics Dashboard** (Nice to have)
10. **Export/Print Functionality** (Nice to have)

## Next Steps

1. Implement Status Workflow Actions (Quick wins, high impact)
2. Integrate Contractor/Vendor selection (Core functionality)
3. Add Landlord Approval Workflow (Critical feature)
4. Add Bulk Actions (Efficiency improvement)
5. Add Advanced Filtering (Usability improvement)

## Notes

- All features should follow the existing design patterns
- Use existing UI components where possible
- Ensure responsive design for all new features
- Add proper error handling and validation
- Add loading states for all async operations
- Add toast notifications for user feedback

