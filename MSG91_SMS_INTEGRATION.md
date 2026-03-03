# MSG91 SMS Integration - Complete Guide

## Overview

Send SMS notifications to parents and students for:
1. **Attendance** - When student is marked absent
2. **Marks Update** - When grades are entered/updated
3. **Student Report** - Complete report with marks and attendance %

## Step 1: Get MSG91 API Credentials

### Sign Up for MSG91

1. **Visit**: https://msg91.com/
2. **Click**: "Sign Up" or "Get Started Free"
3. **Fill Details**:
   - Name
   - Email
   - Phone Number
   - Company Name
   - Password
4. **Verify**: Email and Phone OTP
5. **Login**: to MSG91 Dashboard

### Get API Key (Auth Key)

1. **Login** to MSG91 Dashboard
2. Go to **"API"** section in left menu
3. Click **"Auth Key"** or **"API Keys"**
4. **Copy** your Auth Key (looks like: `123456ABCDEFabcdef123456`)
5. **Save** this key securely

### Get Sender ID

1. In MSG91 Dashboard, go to **"Sender ID"**
2. Click **"Add Sender ID"**
3. Enter:
   - Sender ID: `AKSHARA` (6 characters, alphanumeric)
   - Purpose: Transactional
   - Sample Content: "Your attendance notification"
4. **Submit** for approval
5. **Wait** for approval (usually 24-48 hours)
6. Once approved, you can use this Sender ID

### Get Template IDs (Important!)

MSG91 requires pre-approved templates for DLT compliance.

1. Go to **"SMS"** → **"Templates"**
2. Click **"Add Template"**
3. Create templates:

**Template 1: Attendance Absent**
```
Dear Parent, your child {#var#} (Roll: {#var#}) was marked ABSENT on {#var#} for {#var#} class. - AKSHARA
```
- Submit and get Template ID (e.g., `1234567890123456789`)

**Template 2: Marks Update**
```
Dear Parent, {#var#} scored {#var#}/{#var#} in {#var#} exam for {#var#}. - AKSHARA
```
- Submit and get Template ID

**Template 3: Student Report**
```
Dear Parent, {#var#}'s report: Attendance: {#var#}%, Total Marks: {#var#}/{#var#}. Login to view details. - AKSHARA
```
- Submit and get Template ID

4. **Wait** for template approval
5. **Copy** Template IDs once approved

## Step 2: Install MSG91 Package

```bash
cd backend
npm install msg91-sms
```

Or use axios for direct API calls:
```bash
npm install axios
```

## Step 3: Create MSG91 Service

Create `backend/services/smsService.js`:

```javascript
const axios = require('axios');

// MSG91 Configuration
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || 'YOUR_AUTH_KEY';
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'AKSHARA';
const MSG91_ROUTE = '4'; // 4 = Transactional

// Template IDs (get from MSG91 dashboard after approval)
const TEMPLATES = {
    ATTENDANCE_ABSENT: process.env.MSG91_TEMPLATE_ATTENDANCE || 'TEMPLATE_ID_1',
    MARKS_UPDATE: process.env.MSG91_TEMPLATE_MARKS || 'TEMPLATE_ID_2',
    STUDENT_REPORT: process.env.MSG91_TEMPLATE_REPORT || 'TEMPLATE_ID_3'
};

/**
 * Send SMS using MSG91 API
 */
async function sendSMS(mobileNumber, message, templateId) {
    try {
        const url = 'https://api.msg91.com/api/v5/flow/';
        
        const payload = {
            template_id: templateId,
            sender: MSG91_SENDER_ID,
            short_url: '0',
            mobiles: mobileNumber,
            authkey: MSG91_AUTH_KEY
        };

        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'authkey': MSG91_AUTH_KEY
            }
        });

        console.log('SMS sent successfully:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending SMS:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send Attendance Absent SMS
 */
async function sendAttendanceAbsentSMS(studentName, rollNo, date, className, parentPhone, studentPhone) {
    const message = `Dear Parent, your child ${studentName} (Roll: ${rollNo}) was marked ABSENT on ${date} for ${className} class. - AKSHARA`;
    
    // Send to parent
    if (parentPhone) {
        await sendSMS(parentPhone, message, TEMPLATES.ATTENDANCE_ABSENT);
    }
    
    // Send to student
    if (studentPhone) {
        await sendSMS(studentPhone, message, TEMPLATES.ATTENDANCE_ABSENT);
    }
}

/**
 * Send Marks Update SMS
 */
async function sendMarksUpdateSMS(studentName, obtainedMarks, totalMarks, subjectName, examName, parentPhone, studentPhone) {
    const message = `Dear Parent, ${studentName} scored ${obtainedMarks}/${totalMarks} in ${subjectName} exam for ${examName}. - AKSHARA`;
    
    // Send to parent
    if (parentPhone) {
        await sendSMS(parentPhone, message, TEMPLATES.MARKS_UPDATE);
    }
    
    // Send to student
    if (studentPhone) {
        await sendSMS(studentPhone, message, TEMPLATES.MARKS_UPDATE);
    }
}

/**
 * Send Student Report SMS
 */
async function sendStudentReportSMS(studentName, attendancePercentage, totalObtained, totalMarks, parentPhone, studentPhone) {
    const message = `Dear Parent, ${studentName}'s report: Attendance: ${attendancePercentage}%, Total Marks: ${totalObtained}/${totalMarks}. Login to view details. - AKSHARA`;
    
    // Send to parent
    if (parentPhone) {
        await sendSMS(parentPhone, message, TEMPLATES.STUDENT_REPORT);
    }
    
    // Send to student
    if (studentPhone) {
        await sendSMS(studentPhone, message, TEMPLATES.STUDENT_REPORT);
    }
}

module.exports = {
    sendAttendanceAbsentSMS,
    sendMarksUpdateSMS,
    sendStudentReportSMS,
    sendSMS
};
```

## Step 4: Update Environment Variables

Add to `backend/.env`:

```env
# MSG91 Configuration
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=AKSHARA
MSG91_TEMPLATE_ATTENDANCE=template_id_1
MSG91_TEMPLATE_MARKS=template_id_2
MSG91_TEMPLATE_REPORT=template_id_3
```

## Step 5: Update Student Schema

Add parent and student phone numbers to Student schema:

```javascript
// In backend/server.js, update studentSchema
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollNo: { type: String, required: true },
    class: { type: String, required: true },
    email: { type: String },
    phone: { type: String }, // Student's phone
    parentPhone: { type: String }, // Parent's phone ← ADD THIS
    parentName: { type: String }, // Parent's name ← ADD THIS
    dateOfBirth: { type: String },
    address: { type: String },
    admissionDate: { type: String },
    status: { type: String, default: "Active" }
});
```

## Step 6: Integrate SMS in Attendance

Update attendance POST endpoint:

```javascript
// In backend/server.js
const { sendAttendanceAbsentSMS } = require('./services/smsService');

app.post('/api/attendance', async (req, res) => {
    try {
        const { date, className, period, subject, records } = req.body;

        // Save attendance...
        const attendance = await Attendance.findOneAndUpdate(
            { date, className, period },
            { date, className, period, subject, records },
            { new: true, upsert: true }
        );

        // Send SMS for absent students
        for (const record of records) {
            if (record.status === 'Absent') {
                // Fetch student details
                const student = await Student.findById(record.studentId);
                
                if (student) {
                    // Send SMS notification
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
        }

        res.json(attendance);
    } catch (error) {
        res.status(400).json({ message: 'Error saving attendance', error: error.message });
    }
});
```

## Step 7: Integrate SMS in Marks Update

Update exam results POST endpoint:

```javascript
const { sendMarksUpdateSMS } = require('./services/smsService');

app.post('/api/exam-results', async (req, res) => {
    try {
        const { examId, studentId, studentName, rollNo, marks } = req.body;

        // Save exam results...
        const result = await ExamResult.findOneAndUpdate(
            { examId, studentId },
            { examId, studentId, studentName, rollNo, marks },
            { new: true, upsert: true }
        );

        // Fetch student and exam details
        const student = await Student.findById(studentId);
        const exam = await Exam.findById(examId);

        // Send SMS for each subject
        if (student && exam) {
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
        }

        res.json(result);
    } catch (error) {
        res.status(400).json({ message: 'Error saving exam results', error: error.message });
    }
});
```

## Step 8: Add "Send SMS" Button in Student Profile

Create new endpoint for sending student report:

```javascript
const { sendStudentReportSMS } = require('./services/smsService');

app.post('/api/students/:id/send-report', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Fetch student
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Calculate attendance percentage
        const attendanceRecords = await Attendance.find({ 
            'records.studentId': id 
        });
        
        let totalClasses = 0;
        let presentClasses = 0;
        
        attendanceRecords.forEach(att => {
            const studentRecord = att.records.find(r => r.studentId === id);
            if (studentRecord) {
                totalClasses++;
                if (studentRecord.status === 'Present') {
                    presentClasses++;
                }
            }
        });
        
        const attendancePercentage = totalClasses > 0 
            ? ((presentClasses / totalClasses) * 100).toFixed(2) 
            : 0;

        // Calculate total marks
        const examResults = await ExamResult.find({ studentId: id });
        
        let totalObtained = 0;
        let totalMarks = 0;
        
        examResults.forEach(result => {
            result.marks.forEach(mark => {
                totalObtained += mark.obtainedMarks;
                totalMarks += mark.totalMarks;
            });
        });

        // Send SMS
        await sendStudentReportSMS(
            student.name,
            attendancePercentage,
            totalObtained,
            totalMarks,
            student.parentPhone,
            student.phone
        );

        res.json({ 
            message: 'Report sent successfully',
            attendancePercentage,
            totalObtained,
            totalMarks
        });
    } catch (error) {
        res.status(500).json({ message: 'Error sending report', error: error.message });
    }
});
```

## Step 9: Update Frontend - Add "Send SMS" Button

In `Students.tsx` or student profile view:

```tsx
const handleSendReport = async (studentId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/send-report`, {
            method: 'POST'
        });
        
        if (response.ok) {
            toast.success('Report sent to parent and student via SMS');
        } else {
            toast.error('Failed to send report');
        }
    } catch (error) {
        toast.error('Error sending report');
    }
};

// In the UI
<Button onClick={() => handleSendReport(student._id)}>
    <MessageSquare className="mr-2 h-4 w-4" />
    Send SMS Report
</Button>
```

## Step 10: Testing

### Test SMS Sending

1. **Test with your own number first**
2. **Check MSG91 dashboard** for delivery status
3. **Verify** SMS content matches template

### Test Scenarios

**Scenario 1: Attendance Absent**
1. Mark student as absent
2. Check if SMS sent to parent and student
3. Verify message content

**Scenario 2: Marks Update**
1. Enter marks for a student
2. Check if SMS sent
3. Verify marks in message

**Scenario 3: Student Report**
1. Click "Send SMS Report" in student profile
2. Check if report SMS sent
3. Verify attendance % and marks

## SMS Message Examples

### Attendance Absent
```
Dear Parent, your child John Doe (Roll: 001) was marked ABSENT on 2026-02-10 for D.Pharm 1 - A class. - AKSHARA
```

### Marks Update
```
Dear Parent, John Doe scored 85/100 in Pharmacology exam for Mid-Term Exam. - AKSHARA
```

### Student Report
```
Dear Parent, John Doe's report: Attendance: 92.5%, Total Marks: 425/500. Login to view details. - AKSHARA
```

## Cost Estimation

MSG91 Pricing (approximate):
- **Transactional SMS**: ₹0.15 - ₹0.25 per SMS
- **Free Credits**: Usually 100-500 SMS on signup
- **Monthly Plans**: Available for bulk usage

## Troubleshooting

### Common Issues

**1. SMS not sending**
- Check Auth Key is correct
- Verify Sender ID is approved
- Ensure template is approved
- Check phone number format (91XXXXXXXXXX)

**2. Template not approved**
- Wait 24-48 hours
- Ensure template follows DLT guidelines
- Contact MSG91 support

**3. Invalid phone number**
- Format: Country code + number (e.g., 919876543210)
- Remove spaces, dashes, or special characters

## Summary

✅ **Attendance**: Auto-send SMS when student is absent
✅ **Marks Update**: Auto-send SMS when grades are entered
✅ **Student Report**: Manual "Send SMS" button in profile
✅ **Dual Notification**: Send to both parent and student
✅ **Template-based**: DLT compliant messaging

This complete integration will keep parents informed about their child's attendance and academic performance! 🎉
