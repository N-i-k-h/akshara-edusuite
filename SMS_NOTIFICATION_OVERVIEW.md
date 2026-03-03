# SMS Notification System - Complete Overview

## What Gets Sent

### 1. Attendance Absent Notification
**When**: Student is marked absent
**To**: Parent + Student
**Message**:
```
Dear Parent, your child John Doe (Roll: 001) was marked ABSENT on 2026-02-10 for D.Pharm 1 - A class. - AKSHARA
```

### 2. Marks Update Notification
**When**: Grades are entered/updated
**To**: Parent + Student
**Message**:
```
Dear Parent, John Doe scored 85/100 in Pharmacology for Mid-Term Exam. - AKSHARA
```

### 3. Student Report Notification
**When**: "Send SMS" button clicked in student profile
**To**: Parent + Student
**Message**:
```
Dear Parent, John Doe's report: Attendance: 92.5%, Marks: 425/500. Login for details. - AKSHARA
```

## System Flow

```
┌─────────────────────────────────────────────────────┐
│                  ATTENDANCE                         │
├─────────────────────────────────────────────────────┤
│ Faculty marks student ABSENT                        │
│         ↓                                           │
│ System saves attendance                             │
│         ↓                                           │
│ SMS Service triggered                               │
│         ↓                                           │
│ Send SMS to Parent: "Child was absent..."          │
│ Send SMS to Student: "You were absent..."          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  MARKS UPDATE                       │
├─────────────────────────────────────────────────────┤
│ Faculty enters marks for exam                       │
│         ↓                                           │
│ System saves grades                                 │
│         ↓                                           │
│ SMS Service triggered                               │
│         ↓                                           │
│ Send SMS to Parent: "Child scored 85/100..."       │
│ Send SMS to Student: "You scored 85/100..."        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  STUDENT REPORT                     │
├─────────────────────────────────────────────────────┤
│ Admin clicks "Send SMS" in student profile          │
│         ↓                                           │
│ System calculates:                                  │
│  • Attendance percentage                            │
│  • Total marks                                      │
│         ↓                                           │
│ SMS Service triggered                               │
│         ↓                                           │
│ Send SMS to Parent: "Report: Att 92%, Marks..."    │
│ Send SMS to Student: "Your report: Att 92%..."     │
└─────────────────────────────────────────────────────┘
```

## Files Created

### 1. SMS Service
**File**: `backend/services/smsService.js`
**Purpose**: Handle all SMS sending via MSG91 API
**Functions**:
- `sendAttendanceAbsentSMS()` - Send absence notification
- `sendMarksUpdateSMS()` - Send marks notification
- `sendStudentReportSMS()` - Send complete report
- `sendSMS()` - Core SMS sending function

### 2. Documentation
**Files**:
- `MSG91_SMS_INTEGRATION.md` - Complete integration guide
- `MSG91_QUICK_SETUP.md` - Quick start guide
- `SMS_NOTIFICATION_OVERVIEW.md` - This file

## Integration Points

### Backend Integration

**1. Attendance Endpoint** (`/api/attendance`)
```javascript
// After saving attendance
for (const record of records) {
    if (record.status === 'Absent') {
        const student = await Student.findById(record.studentId);
        await sendAttendanceAbsentSMS(
            student.name,
            student.rollNo,
            date,
            className,
            student.parentPhone,
            student.phone
        );
    }
}
```

**2. Exam Results Endpoint** (`/api/exam-results`)
```javascript
// After saving grades
for (const mark of marks) {
    await sendMarksUpdateSMS(
        studentName,
        mark.obtainedMarks,
        mark.totalMarks,
        mark.subjectName,
        exam.name,
        student.parentPhone,
        student.phone
    );
}
```

**3. Student Report Endpoint** (`/api/students/:id/send-report`)
```javascript
// Calculate attendance and marks
await sendStudentReportSMS(
    student.name,
    attendancePercentage,
    totalObtained,
    totalMarks,
    student.parentPhone,
    student.phone
);
```

### Frontend Integration

**Student Profile - Add "Send SMS" Button**:
```tsx
<Button onClick={() => handleSendReport(student._id)}>
    <MessageSquare className="mr-2 h-4 w-4" />
    Send SMS Report
</Button>
```

## Required Data

### Student Schema Must Have:
```javascript
{
    name: "John Doe",
    rollNo: "001",
    class: "D.Pharm 1 - A",
    phone: "919876543210",        // Student's phone
    parentPhone: "919876543211",  // Parent's phone ← REQUIRED
    parentName: "Mr. Doe"         // Parent's name ← REQUIRED
}
```

## MSG91 Setup Checklist

### Before You Start:
- [ ] Sign up at https://msg91.com/
- [ ] Get Auth Key from dashboard
- [ ] Create Sender ID: "AKSHARA"
- [ ] Wait for Sender ID approval (24-48 hours)
- [ ] Create 3 SMS templates
- [ ] Wait for template approval (24-48 hours)
- [ ] Note all Template IDs

### Configuration:
- [ ] Install `axios`: `npm install axios`
- [ ] Create `backend/services/smsService.js`
- [ ] Update `backend/.env` with credentials
- [ ] Add `parentPhone` field to Student schema
- [ ] Update students with parent phone numbers

### Integration:
- [ ] Integrate in attendance endpoint
- [ ] Integrate in exam results endpoint
- [ ] Create student report endpoint
- [ ] Add "Send SMS" button in frontend
- [ ] Test all 3 notification types

## Environment Variables

Add to `backend/.env`:
```env
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=AKSHARA
MSG91_TEMPLATE_ATTENDANCE=template_id_1
MSG91_TEMPLATE_MARKS=template_id_2
MSG91_TEMPLATE_REPORT=template_id_3
```

## Testing

### Test Attendance SMS:
1. Mark a student as absent
2. Check if SMS sent to parent and student
3. Verify message content

### Test Marks SMS:
1. Enter marks for a student
2. Check if SMS sent
3. Verify marks and subject in message

### Test Report SMS:
1. Go to student profile
2. Click "Send SMS Report"
3. Check if SMS sent with attendance % and marks

## Cost Estimate

**MSG91 Pricing**:
- Free credits: 100-500 SMS
- Per SMS: ₹0.15 - ₹0.25
- Bulk plans available

**Example Monthly Cost** (100 students):
- Attendance (20 days × 10 absents × 2 SMS): 400 SMS
- Marks (4 exams × 100 students × 2 SMS): 800 SMS
- Reports (100 students × 2 SMS): 200 SMS
- **Total**: ~1400 SMS/month = ₹210 - ₹350/month

## Benefits

### For Parents:
✅ **Instant notification** when child is absent
✅ **Immediate updates** on exam performance
✅ **Complete report** on demand
✅ **Dual notification** to parent and student

### For School:
✅ **Automated communication** - No manual SMS
✅ **Better engagement** - Parents stay informed
✅ **Transparency** - Real-time updates
✅ **Professional** - Branded SMS with school name

### For Students:
✅ **Self-awareness** - Know their attendance
✅ **Performance tracking** - Get marks updates
✅ **Accountability** - Can't hide absences

## Timeline

| Phase | Time |
|-------|------|
| MSG91 Setup | 10 min |
| Approval Wait | 2-3 days |
| Code Integration | 1 hour |
| Testing | 30 min |
| **Total** | **~3 days** |

## Support

**MSG91**:
- Website: https://msg91.com/
- Support: support@msg91.com
- Phone: +91-9650-140-140
- Docs: https://docs.msg91.com/

**Integration Help**:
- Check `MSG91_SMS_INTEGRATION.md` for detailed guide
- Check `MSG91_QUICK_SETUP.md` for quick start
- Check `backend/services/smsService.js` for code

## Summary

✅ **3 Types of SMS**:
1. Attendance absent notification
2. Marks update notification
3. Student report (on-demand)

✅ **Dual Notification**:
- Send to parent
- Send to student

✅ **Automated**:
- Attendance: Auto-send on absent
- Marks: Auto-send on grade entry
- Report: Manual button click

✅ **Ready to Use**:
- Service created: `smsService.js`
- Documentation complete
- Just need MSG91 approval

**Next Step**: Sign up for MSG91 and get templates approved! 🎉
