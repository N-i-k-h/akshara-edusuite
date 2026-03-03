# Exam Management - Admin Creates, Faculty Grades

## System Design

### Roles & Permissions

**Super Admin**:
- ✅ Create exams
- ✅ Define exam name, class, subjects
- ✅ Assign faculty to each subject
- ✅ View all exams and grades
- ✅ Generate reports

**Faculty**:
- ❌ Cannot create exams
- ✅ View exams where they're assigned
- ✅ Add/edit grades ONLY for their assigned subjects
- ✅ View student results for their subjects

## Workflow

```
┌─────────────────────────────────────────┐
│          SUPER ADMIN                    │
├─────────────────────────────────────────┤
│ 1. Create Exam                          │
│    - Name: "Mid-Term Exam"              │
│    - Class: "D.Pharm 1 - A"             │
│                                         │
│ 2. Add Subjects:                        │
│    - Pharmacology                       │
│      • Date: 2026-02-15                 │
│      • Total Marks: 100                 │
│      • Assign Faculty: Dr. John Smith   │
│                                         │
│    - Pharmaceutics                      │
│      • Date: 2026-02-16                 │
│      • Total Marks: 100                 │
│      • Assign Faculty: Dr. Jane Doe     │
│                                         │
│ 3. Save Exam                            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          FACULTY (Dr. John Smith)       │
├─────────────────────────────────────────┤
│ 1. View Assigned Exams                  │
│    - Mid-Term Exam (D.Pharm 1 - A)      │
│      • Pharmacology (Your Subject)      │
│                                         │
│ 2. Click "Grade Students"               │
│                                         │
│ 3. Enter Marks:                         │
│    - Student 1: 85/100                  │
│    - Student 2: 92/100                  │
│    - ...                                │
│                                         │
│ 4. Save Grades                          │
└─────────────────────────────────────────┘
```

## Database Schema

### Exam Schema (Already Exists)
```javascript
{
  _id: ObjectId,
  name: "Mid-Term Exam",
  className: "D.Pharm 1 - A",
  subjects: [
    {
      name: "Pharmacology",
      date: "2026-02-15",
      time: "10:00 AM",
      totalMarks: 100,
      facultyId: ObjectId("faculty1") // Dr. John Smith
    },
    {
      name: "Pharmaceutics",
      date: "2026-02-16",
      time: "10:00 AM",
      totalMarks: 100,
      facultyId: ObjectId("faculty2") // Dr. Jane Doe
    }
  ],
  status: "Scheduled",
  createdAt: Date
}
```

### ExamResult Schema (Already Exists)
```javascript
{
  _id: ObjectId,
  examId: ObjectId("exam1"),
  studentId: "student1",
  studentName: "John Doe",
  rollNo: "001",
  marks: [
    {
      subjectName: "Pharmacology",
      obtainedMarks: 85,
      totalMarks: 100
    },
    {
      subjectName: "Pharmaceutics",
      obtainedMarks: 92,
      totalMarks: 100
    }
  ]
}
```

## Implementation Plan

### Phase 1: Admin Exam Creation (Update Exams.tsx)

**Current**: Admin creates exam with subjects
**New**: Admin assigns faculty to each subject

**Changes**:
1. Add faculty dropdown for each subject
2. Fetch all staff members
3. Save facultyId when creating exam

**UI**:
```
Create Exam
├── Exam Name: [Mid-Term Exam]
├── Class: [D.Pharm 1 - A ▼]
└── Subjects:
    ├── Subject 1:
    │   ├── Name: [Pharmacology]
    │   ├── Date: [2026-02-15]
    │   ├── Time: [10:00 AM]
    │   ├── Total Marks: [100]
    │   └── Assign Faculty: [Dr. John Smith ▼] ← NEW
    │
    └── Subject 2:
        ├── Name: [Pharmaceutics]
        ├── Date: [2026-02-16]
        ├── Time: [10:00 AM]
        ├── Total Marks: [100]
        └── Assign Faculty: [Dr. Jane Doe ▼] ← NEW
```

### Phase 2: Faculty Exam View (Update FacultyExams.tsx)

**Current**: Shows basic exam list
**New**: Shows only assigned exams with grading interface

**Changes**:
1. Fetch exams where faculty is assigned
2. Show only their assigned subjects
3. Add "Grade Students" button
4. Create grading interface

**UI**:
```
My Assigned Exams

┌────────────────────────────────────┐
│ Mid-Term Exam                      │
│ Class: D.Pharm 1 - A               │
│                                    │
│ Your Subjects:                     │
│ • Pharmacology                     │
│   Date: Feb 15, 2026               │
│   Total Marks: 100                 │
│   [Grade Students]                 │
└────────────────────────────────────┘
```

### Phase 3: Grading Interface (New Component or View)

**UI**:
```
Grade Students - Pharmacology
Mid-Term Exam | D.Pharm 1 - A

┌──────────────────────────────────────┐
│ Roll | Student Name | Marks (out of 100) │
├──────────────────────────────────────┤
│ 001  | John Doe     | [85]           │
│ 002  | Jane Smith   | [92]           │
│ 003  | Bob Johnson  | [78]           │
│ ...                                  │
│                                      │
│ [Cancel] [Save Grades]               │
└──────────────────────────────────────┘
```

## Backend Endpoints (Already Exist)

### Get Faculty Assigned Exams
```
GET /api/faculty/:facultyId/exams
```
Returns exams where faculty is assigned to at least one subject.

### Save Grades
```
POST /api/exam-results
Body: {
  examId, studentId, studentName, rollNo,
  marks: [{ subjectName, obtainedMarks, totalMarks }]
}
```

### Get Exam Results
```
GET /api/exam-results/:examId
```

## Security & Validation

### Admin Side:
- ✅ Must assign faculty to each subject
- ✅ Cannot save exam without faculty assignments
- ✅ Can reassign faculty if needed

### Faculty Side:
- ✅ Can only see exams where they're assigned
- ✅ Can only grade their assigned subjects
- ✅ Cannot grade other faculty's subjects
- ✅ Cannot modify exam details
- ✅ Cannot delete exams

### Backend Validation:
```javascript
// When saving grades, verify faculty is assigned
app.post('/api/exam-results', async (req, res) => {
  const { examId, subjectName, facultyId } = req.body;
  
  // Find exam
  const exam = await Exam.findById(examId);
  
  // Find subject
  const subject = exam.subjects.find(s => s.name === subjectName);
  
  // Verify faculty is assigned
  if (subject.facultyId.toString() !== facultyId) {
    return res.status(403).json({ 
      message: 'You are not authorized to grade this subject' 
    });
  }
  
  // Save grades...
});
```

## User Stories

### Story 1: Admin Creates Exam
```
As a Super Admin,
I want to create an exam and assign faculty to each subject,
So that the right faculty can grade their subjects.

Steps:
1. Go to Exams page
2. Click "Create New Exam"
3. Enter exam name: "Mid-Term Exam"
4. Select class: "D.Pharm 1 - A"
5. Add subject: "Pharmacology"
   - Date: Feb 15
   - Marks: 100
   - Faculty: Dr. John Smith
6. Add subject: "Pharmaceutics"
   - Date: Feb 16
   - Marks: 100
   - Faculty: Dr. Jane Doe
7. Click "Create Exam"
8. ✅ Exam created with faculty assignments
```

### Story 2: Faculty Views Assigned Exams
```
As Faculty (Dr. John Smith),
I want to see only exams where I'm assigned,
So I can grade my subjects.

Steps:
1. Login as Dr. John Smith
2. Go to "My Exams"
3. See "Mid-Term Exam"
   - My Subject: Pharmacology
4. ✅ Only see exams I'm assigned to
```

### Story 3: Faculty Grades Students
```
As Faculty (Dr. John Smith),
I want to enter grades for my assigned subject,
So students can see their results.

Steps:
1. Go to "My Exams"
2. Click "Grade Students" for Pharmacology
3. See list of all students in D.Pharm 1 - A
4. Enter marks for each student
5. Click "Save Grades"
6. ✅ Grades saved for Pharmacology only
```

### Story 4: Faculty Cannot Grade Other Subjects
```
As Faculty (Dr. John Smith),
I should NOT be able to grade Pharmaceutics,
Because it's assigned to Dr. Jane Doe.

Expected:
- Don't see "Grade Students" button for Pharmaceutics
- If I try to access grading URL directly, get 403 error
- ✅ Can only grade my assigned subjects
```

## Benefits

### For Admin:
- ✅ Control over exam creation
- ✅ Assign right faculty to right subjects
- ✅ Centralized exam management
- ✅ Can reassign if faculty changes

### For Faculty:
- ✅ Clear view of their responsibilities
- ✅ Only see relevant exams
- ✅ Easy grading interface
- ✅ Cannot accidentally grade wrong subject

### For Students:
- ✅ Grades entered by subject experts
- ✅ Consistent grading process
- ✅ Clear exam schedule

## Summary

**Admin Role**:
1. Creates exams
2. Defines subjects
3. Assigns faculty to each subject
4. Views all results

**Faculty Role**:
1. Views assigned exams
2. Grades students for their subjects only
3. Cannot modify exam structure
4. Cannot grade other faculty's subjects

This creates a clear separation of responsibilities and ensures proper access control! 🎉
