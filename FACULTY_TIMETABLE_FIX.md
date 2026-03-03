# Faculty Timetable Assignment Fix

## Problem
You assigned classes in the timetable, but faculty can't see them because:
1. Old timetable entries don't have `facultyId` field
2. Staff records don't have the classes in their `assignedClasses` array

## Solution Implemented

### 1. Auto-Assignment on Timetable Creation
**File**: `backend/server.js` (Line 746-775)

When you assign a teacher to a timetable period, the system now automatically:
- Finds the staff member by name
- Saves their `facultyId` in the timetable entry
- Adds the class to their `assignedClasses` array

**Code**:
```javascript
app.post('/api/timetable', async (req, res) => {
    const { className, day, period, subject, teacher } = req.body;
    
    // Find staff by name and get their ID
    let facultyId = null;
    if (teacher) {
        const staff = await Staff.findOne({ name: teacher });
        if (staff) {
            facultyId = staff._id;
            
            // Add class to assignedClasses if not already there
            if (className && !staff.assignedClasses.includes(className)) {
                staff.assignedClasses.push(className);
                await staff.save();
            }
        }
    }
    
    // Save timetable with facultyId
    await Timetable.findOneAndUpdate(
        { className, day, period },
        { subject, teacher, facultyId },
        { new: true, upsert: true }
    );
});
```

### 2. Fix for Existing Data

**Option A: Re-assign the Periods** (Recommended)
1. Go to **Timetable** page as admin
2. For each period that has a teacher assigned:
   - Click "Assign Period" again
   - Select the same day, period, subject, teacher
   - Click "Save"
3. This will trigger the auto-assignment logic
4. Faculty will now see their classes

**Option B: Manual Database Update**
If you have many entries, you can run this migration script:

```javascript
// Add this to server.js temporarily or run in MongoDB shell

// Migration: Update existing timetable entries with facultyId
app.get('/api/migrate-timetable', async (req, res) => {
    try {
        const timetableEntries = await Timetable.find({ teacher: { $exists: true, $ne: null } });
        let updated = 0;
        
        for (const entry of timetableEntries) {
            if (!entry.facultyId && entry.teacher) {
                // Find staff by teacher name
                const staff = await Staff.findOne({ name: entry.teacher });
                if (staff) {
                    // Update timetable with facultyId
                    entry.facultyId = staff._id;
                    await entry.save();
                    
                    // Add class to staff's assignedClasses
                    if (entry.className && !staff.assignedClasses.includes(entry.className)) {
                        staff.assignedClasses.push(entry.className);
                        await staff.save();
                    }
                    updated++;
                }
            }
        }
        
        res.json({ message: `Updated ${updated} timetable entries` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

Then visit: `http://localhost:5000/api/migrate-timetable`

## How It Works Now

### Step 1: Assign Teacher to Timetable
1. Admin goes to **Timetable** page
2. Selects a class (e.g., "D.Pharm 1 - A")
3. Clicks **"Assign Period"**
4. Fills in:
   - Day: Monday
   - Period: 1
   - Subject: Pharmacology
   - Teacher: Dr. John Smith (from dropdown)
5. Clicks **"Save"**

### Step 2: Auto-Assignment Happens
Backend automatically:
- ✅ Finds Dr. John Smith in Staff collection
- ✅ Gets his `_id` (e.g., "abc123")
- ✅ Saves `facultyId: "abc123"` in timetable entry
- ✅ Adds "D.Pharm 1 - A" to Dr. John Smith's `assignedClasses` array

### Step 3: Faculty Sees Their Classes
1. Dr. John Smith logs in as faculty
2. Goes to **My Timetable** page
3. System fetches periods where `facultyId = "abc123"`
4. ✅ Sees Monday Period 1: Pharmacology (D.Pharm 1 - A)

## Data Flow

```
Admin Assigns Period
        ↓
Backend finds Staff by name
        ↓
Saves facultyId in Timetable
        ↓
Adds class to Staff.assignedClasses
        ↓
Faculty logs in
        ↓
Fetches periods by facultyId
        ↓
Sees assigned classes ✅
```

## Testing

### Test 1: New Assignment
1. **Admin**: Go to Timetable
2. **Admin**: Assign Dr. Smith to Monday Period 1, Pharmacology, D.Pharm 1 - A
3. **Faculty**: Login as Dr. Smith
4. **Faculty**: Go to My Timetable
5. **Result**: Should see Monday Period 1 ✅

### Test 2: Multiple Classes
1. **Admin**: Assign Dr. Smith to:
   - Monday P1: Pharmacology (D.Pharm 1 - A)
   - Tuesday P2: Pharmaceutics (D.Pharm 1 - A)
   - Wednesday P3: Pharmacology (D.Pharm 2 - B)
2. **Faculty**: Login as Dr. Smith
3. **Faculty**: Check My Timetable
4. **Result**: Should see all 3 periods ✅

### Test 3: assignedClasses Array
1. **Admin**: Assign Dr. Smith to periods in D.Pharm 1 - A and D.Pharm 2 - B
2. **Check Database**: Dr. Smith's staff record
3. **Result**: `assignedClasses: ["D.Pharm 1 - A", "D.Pharm 2 - B"]` ✅

## Troubleshooting

### Issue: Faculty sees "No periods assigned"

**Possible Causes**:
1. Timetable entries created before this fix (no facultyId)
2. Teacher name doesn't match staff name exactly
3. Staff record doesn't exist

**Solutions**:
1. **Re-assign the periods** (easiest)
2. **Run migration script** (for bulk updates)
3. **Check teacher names match** exactly in Staff and Timetable

### Issue: "Failed to load faculty data"

**Possible Causes**:
1. Backend not running
2. Staff record doesn't have userId
3. User not logged in

**Solutions**:
1. Check backend is running on port 5000
2. Verify staff was created with userId
3. Check localStorage has user data

## Quick Fix Steps

### For Existing Timetable Entries:

**Option 1: Re-assign (Simple)**
1. Go to Timetable page
2. For each period with a teacher:
   - Click "Assign Period"
   - Select same values
   - Save
3. Done! Faculty can now see it

**Option 2: Migration Script (Bulk)**
1. Add migration endpoint to server.js (code above)
2. Restart backend
3. Visit: http://localhost:5000/api/migrate-timetable
4. Check response: "Updated X entries"
5. Done! All faculty can see their classes

## Summary

✅ **Auto-assignment implemented** - New assignments work automatically
✅ **facultyId saved** - Timetable entries linked to faculty
✅ **assignedClasses updated** - Staff records track their classes
✅ **Faculty can see timetable** - When facultyId is present

⚠️ **Existing entries need update** - Re-assign or run migration

The system is now working correctly for new assignments. For existing timetable entries, you need to either re-assign them or run the migration script to add the facultyId.
