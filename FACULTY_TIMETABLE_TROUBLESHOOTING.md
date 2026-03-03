# Faculty Timetable Not Showing - Troubleshooting Guide

## Problem
You can see the class assigned in Super Admin timetable view, but faculty can't see it in their "My Timetable" page.

## Most Likely Cause
**Teacher name mismatch!**

In your screenshot, the teacher is listed as "**faculty**" (lowercase), but the actual staff member's name in the database might be different (e.g., "Faculty", "Faculty Name", "Dr. Faculty", etc.).

## Quick Fix Steps

### Step 1: Check Staff Names
1. Go to **Staff** page as admin
2. Look at the exact name of your faculty member
3. Note the EXACT spelling and capitalization

### Step 2: Check Timetable Teacher Names
1. The timetable shows teacher as "**faculty**"
2. Does this EXACTLY match the staff member's name?
3. If not, that's the problem!

### Step 3: Fix the Mismatch

**Option A: Update Timetable (Recommended)**
1. Go to **Timetable** page
2. Select "D.Pharm 1 - A"
3. Click "Assign Period" for Monday Period 1
4. Select the correct teacher from the dropdown (this ensures exact match)
5. Click "Save"

**Option B: Update Staff Name**
1. Go to **Staff** page
2. Find the faculty member
3. Edit their name to exactly match "faculty" (if that's what you want)
4. Save

### Step 4: Run Migration
After fixing the name mismatch:
1. Visit: `http://localhost:5000/api/migrate-timetable`
2. Check the response for any errors
3. Login as faculty and check "My Timetable"

## Detailed Diagnosis

### Check 1: What's the Staff Member's Name?
```
Go to: Staff page
Look for: The faculty member you assigned
Check: Their exact name (case-sensitive!)
```

### Check 2: What's in the Timetable?
```
From your screenshot:
- Class: D.Pharm 1 - A
- Day: Monday
- Period: 1
- Subject: dbms
- Teacher: "faculty" (lowercase)
```

### Check 3: Do They Match?
```
Staff name: _________________ (fill this in)
Timetable teacher: "faculty"

Do they match EXACTLY? YES / NO

If NO → That's the problem!
```

## Common Mismatches

| Timetable Shows | Staff Name Might Be | Match? |
|-----------------|---------------------|--------|
| faculty | Faculty | ❌ NO |
| faculty | FACULTY | ❌ NO |
| faculty | faculty | ✅ YES |
| faculty | Dr. Faculty | ❌ NO |
| faculty | Faculty Name | ❌ NO |

## Solution for Each Case

### Case 1: Names Don't Match
**Fix**: Re-assign the period using the dropdown
1. Timetable → Select class
2. Assign Period → Select teacher from DROPDOWN
3. This ensures exact name match
4. Run migration

### Case 2: Names Match But Still Not Working
**Fix**: Run migration to link them
1. Visit: `http://localhost:5000/api/migrate-timetable`
2. Check response for errors
3. If successful, faculty should see it

### Case 3: Migration Shows Errors
**Fix**: Check the error message
- "Teacher not found" → Name mismatch (see Case 1)
- Other error → Check backend logs

## Step-by-Step Fix (Most Common Case)

### Problem: Teacher name is "faculty" but staff name is "Faculty Name"

**Step 1**: Go to Timetable page
**Step 2**: Select "D.Pharm 1 - A"
**Step 3**: Click "Assign Period"
**Step 4**: Fill in:
- Day: Monday
- Period: 1
- Subject: dbms
- Teacher: **Select from dropdown** (don't type!)
**Step 5**: Click "Save"
**Step 6**: Visit: `http://localhost:5000/api/migrate-timetable`
**Step 7**: Login as faculty → Check "My Timetable"

## Why Use the Dropdown?

When you select a teacher from the dropdown:
✅ Exact name match guaranteed
✅ Auto-links to staff member
✅ Saves facultyId automatically
✅ Updates assignedClasses automatically

When you type manually (old entries):
❌ Might have typos
❌ Case sensitivity issues
❌ No auto-linking
❌ Needs migration to fix

## Verification Steps

### After Re-assigning:

1. **Check Timetable Entry**:
   - Visit: `http://localhost:5000/api/timetable?className=D.Pharm%201%20-%20A`
   - Look for: `facultyId` field
   - Should have: A valid ID (not null)

2. **Check Staff Record**:
   - Visit: `http://localhost:5000/api/staff`
   - Find your faculty member
   - Check: `assignedClasses` array
   - Should include: "D.Pharm 1 - A"

3. **Login as Faculty**:
   - Go to: My Timetable
   - Should see: Monday Period 1 - dbms

## Quick Checklist

- [ ] Checked staff member's exact name
- [ ] Checked timetable teacher name
- [ ] Confirmed they match EXACTLY
- [ ] If not, re-assigned using dropdown
- [ ] Ran migration: `http://localhost:5000/api/migrate-timetable`
- [ ] Logged in as faculty
- [ ] Checked "My Timetable" page
- [ ] Can see assigned classes ✅

## Still Not Working?

### Debug Information Needed:

1. **Staff Member Name**: ________________
2. **Timetable Teacher Name**: ________________
3. **Do they match?**: YES / NO
4. **Migration response**: ________________
5. **Any errors?**: ________________

### Get Debug Info:

Visit these URLs and share the output:

1. **All Staff**: `http://localhost:5000/api/staff`
   - Look for your faculty member
   - Note their `_id` and `name`

2. **All Timetable**: `http://localhost:5000/api/timetable`
   - Look for D.Pharm 1 - A entries
   - Check `teacher` and `facultyId` fields

3. **Migration**: `http://localhost:5000/api/migrate-timetable`
   - Check for errors
   - Note how many were updated

## Most Common Solution

**90% of the time, this fixes it**:

1. Go to Timetable
2. Re-assign the period
3. **Select teacher from dropdown** (don't type!)
4. Save
5. Done! Faculty can now see it

The dropdown ensures the exact name match and auto-links everything correctly.
