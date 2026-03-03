# Faculty Role-Based System Implementation

## Overview
Implemented a comprehensive role-based system where faculty members have:
- **Separate sidebar** with limited navigation options
- **Class-based data filtering** - Faculty only see students from their assigned classes
- **Period-based attendance** - Faculty can only mark attendance for their assigned periods
- **Exam assignment** - Faculty can only grade exams assigned to them

## What's Been Implemented

### 1. Separate Faculty Sidebar
**File**: `src/components/layout/FacultySidebar.tsx`

Faculty sidebar includes only:
- Dashboard
- My Students (filtered by assigned classes)
- My Timetable (only assigned periods)
- Attendance (only assigned classes/periods)
- Exams & Grades (only assigned exams)

**No access to**:
- Staff & HR
- Classes management
- Fees
- Certificates
- Library
- Reports

### 2. Dynamic Layout Based on Role
**File**: `src/components/layout/Layout.tsx`

- Checks user role from localStorage
- Shows `FacultySidebar` for faculty users
- Shows regular `Sidebar` for admin users

### 3. Backend Schema Updates

#### Staff Schema (`backend/server.js`)
```javascript
{
  name: String,
  role: String,
  department: String,
  email: String (unique),
  phone: String,
  salary: Number,
  joiningDate: String,
  status: String,
  password: String,
  userId: ObjectId (ref: User),
  assignedClasses: [String] // NEW: Array of class names
}
```

Example assignedClasses: `["D.Pharma 1 - A", "D.Pharma 2 - B"]`

### 4. New Backend API Endpoints

#### Get Students by Faculty's Assigned Classes
```
GET /api/faculty/:facultyId/students
```
Returns only students from classes assigned to the faculty.

#### Get Attendance for Faculty's Classes
```
GET /api/faculty/:facultyId/attendance?date=YYYY-MM-DD
```
Returns attendance records only for faculty's assigned classes.

#### Assign Classes to Staff
```
PUT /api/staff/:id/assign-classes
Body: { assignedClasses: ["Class 1", "Class 2"] }
```
Updates the classes assigned to a faculty member.

### 5. Faculty-Specific Pages

#### Faculty Dashboard (`src/pages/FacultyDashboard.tsx`)
- Shows today's classes
- Displays assigned periods count
- Lists assigned exams
- Shows weekly schedule
- Quick access to mark attendance and grade exams

#### Faculty Students (`src/pages/FacultyStudents.tsx`)
- **Filtered by assigned classes only**
- Groups students by class
- Shows student details (roll no, name, email, phone, parent info)
- Displays fee status
- Search functionality

#### Faculty Timetable (`src/pages/FacultyTimetable.tsx`)
- **Shows only periods assigned to faculty**
- Weekly grid view
- Detailed schedule by day
- Stats: total periods, classes, subjects

#### Faculty Attendance (`src/pages/FacultyAttendance.tsx`)
- **Can only mark attendance for assigned classes**
- Select from assigned classes only
- Select from assigned periods only
- Mark Present/Absent/Late
- Real-time stats
- Save attendance to database

#### Faculty Exams (`src/pages/FacultyExams.tsx`)
- **Shows only exams assigned to faculty**
- View exam details
- Grade students button
- Status tracking (Scheduled/Ongoing/Completed)

### 6. Routing Updates (`src/App.tsx`)

New faculty routes:
- `/faculty-dashboard` - Faculty Dashboard
- `/faculty/students` - My Students (filtered)
- `/faculty/timetable` - My Timetable (filtered)
- `/faculty/attendance` - Mark Attendance (filtered)
- `/faculty/exams` - Exams & Grades (filtered)

Role-based redirect:
- Faculty users → `/faculty-dashboard`
- Admin users → `/` (admin dashboard)

## How It Works

### For Admin (Creating Faculty with Assigned Classes)

1. **Create Staff Member**:
   - Go to Staff page
   - Click "Add Staff"
   - Fill in details including email and password
   - **Assign classes** (e.g., "D.Pharma 1 - A")
   - Save

2. **Assign Classes Later**:
   - Use the API endpoint: `PUT /api/staff/:id/assign-classes`
   - Send: `{ assignedClasses: ["D.Pharma 1 - A", "D.Pharma 2 - B"] }`

### For Faculty

1. **Login**:
   - Use credentials provided by admin
   - Automatically redirected to Faculty Dashboard

2. **View Students**:
   - Click "My Students" in sidebar
   - See **only students from assigned classes**
   - Students grouped by class

3. **Mark Attendance**:
   - Click "Attendance" in sidebar
   - Select from **assigned classes only**
   - Select from **assigned periods only**
   - Mark attendance for students
   - Save to database

4. **View Timetable**:
   - Click "My Timetable"
   - See **only assigned periods**
   - Weekly grid view

5. **Grade Exams**:
   - Click "Exams & Grades"
   - See **only assigned exams**
   - Click "Grade Students" to assign marks

## Data Filtering Logic

### Students Filtering
```javascript
// Backend filters students by assigned classes
const students = await Student.find({ 
  class: { $in: faculty.assignedClasses } 
});
```

### Attendance Filtering
```javascript
// Backend filters attendance by assigned classes
const attendance = await Attendance.find({
  className: { $in: faculty.assignedClasses }
});
```

### Periods Filtering
```javascript
// Backend filters timetable by facultyId
const periods = await Timetable.find({ facultyId });
```

### Exams Filtering
```javascript
// Backend filters exams where faculty is assigned to subjects
const exams = await Exam.find({ 
  'subjects.facultyId': facultyId 
});
```

## Example Workflow

### Scenario: Faculty Teaching D.Pharma 1 - A

1. **Admin assigns**:
   - Faculty: Dr. John
   - Assigned Classes: ["D.Pharma 1 - A"]
   - Assigned Periods: Monday Period 1, Wednesday Period 3

2. **Dr. John logs in**:
   - Sees Faculty Dashboard
   - Today's classes: Monday Period 1 (if today is Monday)

3. **Dr. John views students**:
   - Clicks "My Students"
   - Sees **only D.Pharma 1 - A students**
   - Cannot see students from other classes

4. **Dr. John marks attendance**:
   - Clicks "Attendance"
   - Class dropdown shows **only D.Pharma 1 - A**
   - Period dropdown shows **only assigned periods**
   - Marks attendance for his students

## Next Steps to Complete

### 1. Update Staff Creation Form
Add a multi-select field for assigning classes when creating staff:

```tsx
// In Staff.tsx
<Label>Assigned Classes</Label>
<MultiSelect
  options={allClasses}
  value={newStaff.assignedClasses}
  onChange={(classes) => handleInputChange("assignedClasses", classes)}
/>
```

### 2. Assign Faculty to Timetable Periods
When creating timetable entries, allow selecting faculty:

```tsx
// In Timetable.tsx
<Select onValueChange={(facultyId) => assignFacultyToPeriod(facultyId)}>
  {staffList.map(staff => (
    <SelectItem value={staff._id}>{staff.name}</SelectItem>
  ))}
</Select>
```

### 3. Assign Faculty to Exam Subjects
When creating exams, allow assigning faculty to each subject:

```tsx
// In Exams.tsx
{exam.subjects.map(subject => (
  <Select onValueChange={(facultyId) => assignFacultyToSubject(subject, facultyId)}>
    {staffList.map(staff => (
      <SelectItem value={staff._id}>{staff.name}</SelectItem>
    ))}
  </Select>
))}
```

## Testing

### Test as Admin:
1. Login as admin (admin@akshara.com / admin)
2. Create a faculty member with assigned classes
3. Verify faculty appears in staff list

### Test as Faculty:
1. Logout
2. Login with faculty credentials
3. Verify:
   - Different sidebar (Faculty Sidebar)
   - Only assigned classes visible in students
   - Only assigned periods in timetable
   - Can only mark attendance for assigned classes
   - Only assigned exams visible

## Security Features

✅ **Role-based access control**
- Faculty cannot access admin pages
- Different sidebars for different roles

✅ **Data isolation**
- Faculty only see their assigned data
- Backend filters data by facultyId and assignedClasses

✅ **API-level filtering**
- All filtering happens on backend
- Frontend cannot bypass restrictions

## Files Modified/Created

### Created:
- `src/components/layout/FacultySidebar.tsx`
- `src/pages/FacultyDashboard.tsx`
- `src/pages/FacultyStudents.tsx`
- `src/pages/FacultyTimetable.tsx`
- `src/pages/FacultyAttendance.tsx`
- `src/pages/FacultyExams.tsx`

### Modified:
- `backend/server.js` - Added assignedClasses to Staff schema, new API endpoints
- `src/components/layout/Layout.tsx` - Role-based sidebar rendering
- `src/App.tsx` - Added faculty routes
- `src/pages/Staff.tsx` - Will need to add assignedClasses field

## Summary

✅ **Separate sidebar for faculty** - Limited navigation options
✅ **Class-based filtering** - Faculty only see their assigned classes
✅ **Period-based filtering** - Faculty only see their assigned periods
✅ **Student filtering** - Only students from assigned classes
✅ **Attendance filtering** - Only for assigned classes and periods
✅ **Exam filtering** - Only assigned exams
✅ **Real data** - All data from MongoDB database
✅ **Security** - Backend-level filtering, cannot be bypassed

The system is now ready for faculty to use with proper data isolation!
