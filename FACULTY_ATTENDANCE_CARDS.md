# Faculty Attendance - Class Cards Interface

## New Design

The Faculty Attendance page now has a **two-step interface**:

### Step 1: Class Selection (Card View)
Faculty sees **cards for each class** they teach, showing:
- Class name
- Number of periods
- Number of students
- Subjects taught
- "Mark Attendance" button

### Step 2: Attendance Marking (After clicking a card)
After selecting a class, faculty can:
- Select the period
- Mark attendance for each student
- Save attendance

## User Flow

```
Faculty Attendance Page
        ↓
┌─────────────────────────────────┐
│   Select Date: [2026-02-09]     │
└─────────────────────────────────┘
        ↓
┌─────────────────────────────────┐
│        Your Classes             │
│                                 │
│  ┌──────────────────────┐      │
│  │  D.Pharm 1 - A       │      │
│  │  2 periods           │      │
│  │  30 Students         │      │
│  │  Pharmacology, ...   │      │
│  │  [Mark Attendance]   │      │
│  └──────────────────────┘      │
│                                 │
│  ┌──────────────────────┐      │
│  │  D.Pharm 2 - B       │      │
│  │  3 periods           │      │
│  │  25 Students         │      │
│  │  Pharmaceutics, ...  │      │
│  │  [Mark Attendance]   │      │
│  └──────────────────────┘      │
└─────────────────────────────────┘
        ↓ (Click on a card)
┌─────────────────────────────────┐
│  [← Back] D.Pharm 1 - A         │
│                                 │
│  Select Period:                 │
│  [Period 1 - Pharmacology ▼]    │
│                                 │
│  Stats: 30 Total, 28 Present... │
│                                 │
│  Student Attendance Table       │
│  Roll | Name    | Status        │
│  001  | John    | [P][A][L]     │
│  002  | Jane    | [P][A][L]     │
│  ...                            │
│                                 │
│  [Save Attendance]              │
└─────────────────────────────────┘
```

## Features

### Class Cards View
✅ **Visual class cards** - Easy to see all classes at a glance
✅ **Student count** - See how many students in each class
✅ **Period count** - See how many periods you teach
✅ **Subject list** - See what subjects you teach in that class
✅ **Click to select** - Click any card to mark attendance

### Attendance Marking View
✅ **Back button** - Return to class selection
✅ **Class name displayed** - Clear which class you're marking
✅ **Period dropdown** - Select which period to mark
✅ **Student list** - All students in the class
✅ **Quick marking** - Present/Absent/Late buttons
✅ **Stats** - See totals at a glance
✅ **Save button** - Save attendance for the period

## How to Use

### Step 1: Select Date
1. Open **Faculty Attendance** page
2. Select the date (defaults to today)

### Step 2: Choose Class
1. See cards for all your classes
2. Click on the class card you want to mark attendance for

### Step 3: Select Period
1. Choose the period from dropdown
2. See all students in the class

### Step 4: Mark Attendance
1. For each student, click:
   - **Present** (green)
   - **Absent** (red)
   - **Late** (yellow)
2. Click **"Save Attendance"**

### Step 5: Mark Another Class
1. Click **"Back to Classes"**
2. Select another class card
3. Repeat

## Example Scenario

**Faculty: Dr. John Smith**
**Date: 2026-02-09**

### View 1: Class Cards
```
Your Classes:

┌────────────────────┐  ┌────────────────────┐
│ D.Pharm 1 - A      │  │ D.Pharm 2 - B      │
│ 2 periods          │  │ 3 periods          │
│ 30 Students        │  │ 25 Students        │
│ Pharmacology       │  │ Pharmaceutics      │
│ [Mark Attendance]  │  │ [Mark Attendance]  │
└────────────────────┘  └────────────────────┘
```

### View 2: After clicking "D.Pharm 1 - A"
```
[← Back to Classes]  D.Pharm 1 - A

Select Period: [Period 1 - Pharmacology ▼]

┌─────────┬─────────┬─────────┬─────────┐
│ Total   │ Present │ Absent  │ Late    │
│   30    │   28    │    1    │    1    │
└─────────┴─────────┴─────────┴─────────┘

Student Attendance:
Roll | Name          | Status
001  | John Doe      | [Present] [Absent] [Late]
002  | Jane Smith    | [Present] [Absent] [Late]
...

[Save Attendance]
```

## Benefits

### For Faculty:
✅ **Easy navigation** - See all classes at once
✅ **Quick selection** - Click card to start
✅ **Clear organization** - One class at a time
✅ **Visual feedback** - Cards show important info
✅ **Efficient workflow** - Mark → Save → Next class

### Design:
✅ **Card-based UI** - Modern, intuitive
✅ **Hover effects** - Cards highlight on hover
✅ **Responsive** - Works on all screen sizes
✅ **Color-coded** - Easy to distinguish status
✅ **Clean layout** - Not overwhelming

## Technical Details

### State Management:
- `selectedClass`: null = show cards, string = show attendance
- `classesInfo`: Array of class data with student counts
- `assignedPeriods`: All periods assigned to faculty

### Navigation:
- Click card → `setSelectedClass(className)`
- Click back → `setSelectedClass(null)`

### Data Loading:
1. Fetch faculty profile
2. Fetch assigned periods
3. Group by class
4. Fetch student counts for each class
5. Display cards

## UI Components

### Class Card:
```tsx
<Card onClick={() => handleClassClick(className)}>
  <CardHeader>
    <CardTitle>
      {className}
      <Badge>{periods.length} periods</Badge>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <Users /> {studentCount} Students
    <BookOpen /> {subjects}
    <Button>Mark Attendance</Button>
  </CardContent>
</Card>
```

### Attendance View:
```tsx
<Button onClick={handleBackToClasses}>
  <ArrowLeft /> Back to Classes
</Button>
<Select period>...</Select>
<Table students>...</Table>
<Button onClick={handleSaveAttendance}>
  Save Attendance
</Button>
```

## Summary

The new Faculty Attendance page provides a **card-based interface** where:
1. **First**, faculty sees cards for all their classes
2. **Then**, they click a card to mark attendance for that class
3. **Finally**, they can go back and select another class

This makes it much easier and more intuitive to mark attendance for multiple classes! 🎉
