# MSG91 SMS Setup - Quick Start Guide

## Step-by-Step Setup

### 1. Get MSG91 Account (5 minutes)

1. **Visit**: https://msg91.com/
2. **Click**: "Sign Up Free"
3. **Enter**:
   - Name
   - Email
   - Phone (with country code: +91XXXXXXXXXX)
   - Company: Akshara EduSuite
   - Password
4. **Verify**: Email and Phone OTP
5. **Login**: to Dashboard

### 2. Get Auth Key (1 minute)

1. In MSG91 Dashboard
2. Go to **"API"** → **"Auth Key"**
3. **Copy** your Auth Key
4. **Save** it (looks like: `123456ABCDEFabcdef123456`)

### 3. Create Sender ID (2 minutes + 24-48 hours approval)

1. Go to **"Sender ID"** → **"Add Sender ID"**
2. Enter:
   - **Sender ID**: `AKSHARA` (6 chars max)
   - **Purpose**: Transactional
   - **Sample**: "Your child was absent today"
3. **Submit** for approval
4. **Wait** for approval email (24-48 hours)

### 4. Create SMS Templates (10 minutes + 24-48 hours approval)

Go to **"SMS"** → **"Templates"** → **"Add Template"**

#### Template 1: Attendance Absent
```
Dear Parent, your child {#var#} (Roll: {#var#}) was marked ABSENT on {#var#} for {#var#} class. - AKSHARA
```
- **Type**: Transactional
- **Category**: Education
- **Submit** and note the Template ID

#### Template 2: Marks Update
```
Dear Parent, {#var#} scored {#var#}/{#var#} in {#var#} for {#var#} exam. - AKSHARA
```
- **Type**: Transactional
- **Category**: Education
- **Submit** and note the Template ID

#### Template 3: Student Report
```
Dear Parent, {#var#}'s report: Attendance: {#var#}%, Marks: {#var#}/{#var#}. Login for details. - AKSHARA
```
- **Type**: Transactional
- **Category**: Education
- **Submit** and note the Template ID

**Wait** for template approval (24-48 hours)

### 5. Install Dependencies

```bash
cd backend
npm install axios
```

### 6. Update Environment Variables

Edit `backend/.env`:

```env
# MSG91 Configuration
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=AKSHARA
MSG91_TEMPLATE_ATTENDANCE=your_template_id_1
MSG91_TEMPLATE_MARKS=your_template_id_2
MSG91_TEMPLATE_REPORT=your_template_id_3
```

### 7. Update Student Schema

The student schema needs parent phone number field.

Check if `backend/server.js` has:
```javascript
const studentSchema = new mongoose.Schema({
    // ... existing fields
    phone: { type: String },
    parentPhone: { type: String }, // Add this if missing
    parentName: { type: String }   // Add this if missing
});
```

### 8. Test SMS (After Approval)

Create test endpoint in `backend/server.js`:

```javascript
const { sendSMS } = require('./services/smsService');

app.post('/api/test-sms', async (req, res) => {
    const { phone } = req.body;
    
    const variables = {
        var1: 'John Doe',
        var2: '001',
        var3: '2026-02-10',
        var4: 'D.Pharm 1 - A'
    };
    
    const result = await sendSMS(phone, variables, process.env.MSG91_TEMPLATE_ATTENDANCE);
    res.json(result);
});
```

Test with Postman:
```
POST http://localhost:5000/api/test-sms
Body: { "phone": "919876543210" }
```

## Phone Number Format

**Important**: Phone numbers must be in format: `91XXXXXXXXXX`

Examples:
- ✅ `919876543210` (Correct)
- ✅ `91 9876543210` (Will be formatted)
- ❌ `9876543210` (Missing country code)
- ❌ `+919876543210` (Remove +)

## Template Variables

Templates use `{#var#}` placeholders:

**Attendance Template**:
- `{#var#}` = Student Name
- `{#var#}` = Roll Number
- `{#var#}` = Date
- `{#var#}` = Class Name

**Marks Template**:
- `{#var#}` = Student Name
- `{#var#}` = Obtained Marks
- `{#var#}` = Total Marks
- `{#var#}` = Subject Name
- `{#var#}` = Exam Name

**Report Template**:
- `{#var#}` = Student Name
- `{#var#}` = Attendance %
- `{#var#}` = Total Obtained
- `{#var#}` = Total Marks

## Cost

MSG91 Pricing:
- **Free Credits**: 100-500 SMS on signup
- **Transactional SMS**: ₹0.15 - ₹0.25 per SMS
- **Bulk Plans**: Available for high volume

## Timeline

| Task | Time |
|------|------|
| Sign up & get Auth Key | 5 min |
| Create Sender ID | 2 min |
| Sender ID Approval | 24-48 hours |
| Create Templates | 10 min |
| Template Approval | 24-48 hours |
| Code Integration | 30 min |
| Testing | 15 min |
| **Total** | **~2-3 days** (including approvals) |

## Checklist

Before going live:

- [ ] MSG91 account created
- [ ] Auth Key obtained
- [ ] Sender ID created and **APPROVED**
- [ ] All 3 templates created and **APPROVED**
- [ ] Template IDs noted
- [ ] `.env` file updated
- [ ] `axios` package installed
- [ ] `smsService.js` created
- [ ] Student schema has `parentPhone` field
- [ ] Test SMS sent successfully
- [ ] Students have parent phone numbers in database

## Next Steps

Once templates are approved:

1. ✅ **Attendance SMS** - Auto-send when marking absent
2. ✅ **Marks SMS** - Auto-send when entering grades
3. ✅ **Report SMS** - Manual button in student profile

All code is ready in `smsService.js`!

## Support

**MSG91 Support**:
- Email: support@msg91.com
- Phone: +91-9650-140-140
- Dashboard: Live chat available

**Documentation**:
- API Docs: https://docs.msg91.com/
- Flow API: https://docs.msg91.com/p/tf9GTextN/e/Oq5BBWtLO/MSG91

## Summary

1. **Sign up** → Get Auth Key
2. **Create** Sender ID → Wait for approval
3. **Create** Templates → Wait for approval
4. **Update** `.env` with credentials
5. **Test** SMS sending
6. **Integrate** in attendance, marks, reports
7. **Go Live** 🎉

Total setup time: **2-3 days** (mostly waiting for approvals)
