# Pipeline Testing Guide - Step by Step

## Prerequisites
1. Backend server is running
2. Frontend server is running
3. Database has some test properties

## Test 1: Check API Endpoint Works

**Goal**: Verify the workflow API endpoint is accessible

**Steps**:
1. Open browser/Postman and go to: `http://localhost:8000/docs`
2. Find the `/workflows/{domain}/{entity_id}/transitions` endpoint
3. Try GET request: `/api/v1/workflows/property/{property_id}/transitions`
   - Replace `{property_id}` with an actual property ID from your database
   - Should return available transitions for that property

**Expected Result**: 
- Should return JSON with `current_status`, `available_transitions`, and `side_effects`

**If it fails**: Check that:
- Workflows router is registered in `backend/app/api/v1/__init__.py`
- Property exists in database
- Backend server restarted after changes

---

## Test 2: Frontend Pipeline Page Loads

**Goal**: Verify the Pipeline page component renders

**Steps**:
1. Start frontend: `cd frontend && npm run dev`
2. Navigate to: `http://localhost:5173/pipeline` (or your frontend URL)
3. Check browser console for errors

**Expected Result**:
- Pipeline page loads
- Shows tabs: "Pipeline Overview", "Property Pipeline", "Tenancy Pipeline"
- No console errors

**If it fails**: Check that:
- `Pipeline.tsx` is imported in `App.tsx`
- Route is defined in `App.tsx`
- All components are imported correctly

---

## Test 3: Property Details Shows Pipeline Component

**Goal**: Verify PropertyPipeline component appears on property details page

**Steps**:
1. Go to Properties page
2. Click on any property to view details
3. Scroll down to see "Property Pipeline" section

**Expected Result**:
- "Property Pipeline" card appears
- Shows pipeline stages (Available → Under Offer → Let Agreed → etc.)
- Shows current stage highlighted

**If it fails**: Check that:
- `PropertyPipeline` is imported in `PropertyDetails.tsx`
- Property has a valid status
- Component receives `propertyId` prop

---

## Test 4: Simple Status Transition

**Goal**: Test transitioning a property from one status to another

**Steps**:
1. Go to a property details page
2. Find the "Actions" section with workflow buttons
3. Click a transition button (e.g., "Move to Under Offer")
4. Fill in notes (optional)
5. Click "Confirm"

**Expected Result**:
- Status changes successfully
- Toast notification shows success
- Property status updates in database
- Tasks are created (check Tasks page)

**If it fails**: Check:
- Backend logs for errors
- Database connection
- Workflow validation logic

---

## Test 5: Check Tasks Are Created

**Goal**: Verify that workflow transitions create tasks

**Steps**:
1. After completing Test 4 (status transition)
2. Go to Tasks page (if you have one) or check database
3. Look for new tasks related to the property

**Expected Result**:
- Tasks created with appropriate titles
- Tasks linked to the property
- Tasks have due dates

**If it fails**: Check:
- Task creation in `workflows.py` side effects
- Database has `tasks` table
- Task model is correct

---

## Test 6: Pipeline Overview Page

**Goal**: Verify the pipeline overview shows properties in each stage

**Steps**:
1. Go to `/pipeline` page
2. Click on "Pipeline Overview" tab
3. Check each column (Available, Under Offer, Let Agreed, etc.)

**Expected Result**:
- Properties grouped by status
- Shows count in header
- Properties are clickable

---

## Next Steps After Basic Tests Pass

1. Test more complex transitions (e.g., `under_offer` → `let_agreed` → `tenanted`)
2. Test invalid transitions (should fail with error message)
3. Test pipeline history endpoint
4. Test with real tenancy creation
5. Test task creation for all side effects

---

## Common Issues

### "Workflow endpoint not found"
- Make sure `workflows.router` is included in `backend/app/api/v1/__init__.py`
- Restart backend server

### "PropertyPipeline component not showing"
- Check browser console for errors
- Verify `propertyId` is passed correctly
- Check API call is successful (Network tab)

### "Transition fails"
- Check backend logs
- Verify property status allows the transition
- Check workflow validation logic in `workflows.py`

### "Tasks not created"
- Check backend logs for side effect errors
- Verify Task model exists
- Check database has tasks table

