const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: "Admin" },
    role: { type: String, default: "admin" }
});

const User = mongoose.model('User', userSchema);

// Seed Admin User if not exists
const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@akshara.com' });
        if (!adminExists) {
            const admin = new User({
                email: 'admin@akshara.com',
                password: 'admin', // Note: In production, hash this password!
                name: 'Super Admin',
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user seeded successfully');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

// Student Schema
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollNo: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    class: { type: String, required: true },
    parentName: { type: String, required: true },
    parentPhone: { type: String, required: true },
    status: { type: String, default: "Active" },
    feesPaid: { type: Boolean, default: false }
});

const Student = mongoose.model('Student', studentSchema);

// ... (existing User schema and seedAdmin logic)

// Student Routes
// Fee Schema
const feeSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    grade: { type: String, required: true },
    feeType: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    dueAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Card', 'Cash', 'UPI', 'Other'], required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, default: 'Paid' }
});

const Fee = mongoose.model('Fee', feeSchema);

// Student Routes
app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students' });
    }
});

app.get('/api/students/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student' });
    }
});

app.post('/api/students', async (req, res) => {
    try {
        const newStudent = new Student(req.body);
        await newStudent.save();
        res.status(201).json(newStudent);
    } catch (error) {
        res.status(400).json({ message: 'Error creating student', error: error.message });
    }
});

// Helper to update student fee status
const updateStudentFeeStatus = async (studentId) => {
    try {
        const fees = await Fee.find({ studentId });
        // Calculate total due amount
        const totalDue = fees.reduce((sum, fee) => sum + (fee.dueAmount || 0), 0);

        // Determine status: Paid if totalDue is 0 and there is at least one record
        const isPaid = fees.length > 0 && totalDue <= 0;

        await Student.findByIdAndUpdate(studentId, { feesPaid: isPaid });
    } catch (error) {
        console.error("Error updating student fee status:", error);
    }
};

// Fee Routes
app.get('/api/fees', async (req, res) => {
    try {
        const fees = await Fee.find().sort({ date: -1 });
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fees' });
    }
});

app.post('/api/fees', async (req, res) => {
    try {
        const newFee = new Fee(req.body);
        await newFee.save();

        // Update Student Status
        await updateStudentFeeStatus(newFee.studentId);

        res.status(201).json(newFee);
    } catch (error) {
        res.status(400).json({ message: 'Error creating fee record', error: error.message });
    }
});

app.put('/api/fees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedFee = await Fee.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedFee) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        // Update Student Status
        await updateStudentFeeStatus(updatedFee.studentId);

        res.json(updatedFee);
    } catch (error) {
        res.status(400).json({ message: 'Error updating fee record', error: error.message });
    }
});



// Staff Schema
const staffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    salary: { type: Number, required: true },
    joiningDate: { type: String, required: true },
    status: { type: String, default: "Active" }
});

const Staff = mongoose.model('Staff', staffSchema);

// Class Schema
const classSchema = new mongoose.Schema({
    grade: { type: String, required: true },
    section: { type: String, required: true },
    room: { type: String, required: true },
    classTeacher: { type: String, required: true },
    studentsCount: { type: Number, default: 0 }
});

const Class = mongoose.model('Class', classSchema);

// Staff Routes
app.get('/api/staff', async (req, res) => {
    try {
        const staffMembers = await Staff.find();
        res.json(staffMembers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching staff' });
    }
});

app.post('/api/staff', async (req, res) => {
    try {
        const newStaff = new Staff(req.body);
        await newStaff.save();
        res.status(201).json(newStaff);
    } catch (error) {
        res.status(400).json({ message: 'Error creating staff', error: error.message });
    }
});

// Class Routes
app.get('/api/classes', async (req, res) => {
    try {
        const classes = await Class.find();
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching classes' });
    }
});

app.post('/api/classes', async (req, res) => {
    try {
        const newClass = new Class(req.body);
        await newClass.save();
        res.status(201).json(newClass);
    } catch (error) {
        res.status(400).json({ message: 'Error creating class', error: error.message });
    }
});

// Dashboard Stats Route
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalFaculty = await Staff.countDocuments();

        // Fetch all required data
        const feeStructures = await FeeStructure.find({});
        const fees = await Fee.find({});
        const attendanceRecords = await Attendance.find({});

        // 1. Calculate Revenue (Total Collected)
        const totalRevenue = fees.reduce((sum, fee) => sum + (fee.amountPaid || 0), 0);

        // 2. Calculate Defaulters and Fees Due
        // Map studentId -> Total Fee Expected
        const studentDues = {}; // { studentId: { name: "", expected: 0, paid: 0, grade: "" } }

        feeStructures.forEach(fs => {
            if (!studentDues[fs.studentId]) {
                studentDues[fs.studentId] = {
                    name: fs.studentName,
                    expected: 0,
                    paid: 0,
                    grade: fs.grade || fs.class || "N/A"
                };
            }
            studentDues[fs.studentId].expected += (fs.totalFee || 0);
        });

        // Sum up payments
        fees.forEach(fee => {
            // If we have a structure for this student, log payment. 
            // If payment exists but no structure, we might want to track it too, but mainly we care about Dues.
            if (studentDues[fee.studentId]) {
                studentDues[fee.studentId].paid += (fee.amountPaid || 0);
            } else {
                // Handle orphan payments or payments for students without structure?
                // For now, ignore for "Due" calculation but we included them in "Revenue" above.
            }
        });

        const defaultersList = [];
        let feesDue = 0;

        Object.keys(studentDues).forEach(studentId => {
            const data = studentDues[studentId];
            const due = data.expected - data.paid;
            if (due > 0) {
                feesDue += due;
                defaultersList.push({
                    studentName: data.name,
                    grade: data.grade,
                    dueAmount: due
                });
            }
        });

        // Sort by highest due amount
        defaultersList.sort((a, b) => b.dueAmount - a.dueAmount);
        const feeDefaulters = defaultersList.slice(0, 5);


        // 3. Calculate Low Attendance
        // Map studentId -> { present: 0, total: 0, name: "", class: "" }
        const attendanceStats = {};

        attendanceRecords.forEach(record => {
            if (record.records && Array.isArray(record.records)) {
                record.records.forEach(studentEntry => {
                    const sid = studentEntry.studentId;
                    if (!attendanceStats[sid]) {
                        attendanceStats[sid] = {
                            name: studentEntry.studentName,
                            className: record.className, // Take class from the record
                            present: 0,
                            total: 0
                        };
                    }

                    attendanceStats[sid].total += 1;
                    if (studentEntry.status === 'Present' || studentEntry.status === 'Late') {
                        attendanceStats[sid].present += 1;
                    }
                });
            }
        });

        const lowAttendanceList = [];
        Object.keys(attendanceStats).forEach(sid => {
            const data = attendanceStats[sid];
            const percentage = data.total > 0 ? (data.present / data.total) * 100 : 0;

            if (percentage < 85) {
                lowAttendanceList.push({
                    studentName: data.name,
                    className: data.className,
                    attendancePercentage: percentage
                });
            }
        });

        // Sort by lowest attendance
        lowAttendanceList.sort((a, b) => a.attendancePercentage - b.attendancePercentage);
        const lowAttendanceStudents = lowAttendanceList.slice(0, 5);


        const stats = {
            totalStudents,
            totalFaculty,
            totalRevenue,
            feesCollected: totalRevenue,
            feesDue,
            feeDefaulters,
            lowAttendanceStudents
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
});

// User Routes
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // For this simple example, we are storing plain text passwords as requested. 
        // In a real app, use bcrypt to compare hashed passwords.
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.password !== password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Exam Schema
const examSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    classes: { type: [String], required: true }, // Array of class names
    status: { type: String, default: "Scheduled" }
});

const Exam = mongoose.model('Exam', examSchema);

// Exam Routes
app.get('/api/exams', async (req, res) => {
    try {
        const exams = await Exam.find();
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exams' });
    }
});

app.post('/api/exams', async (req, res) => {
    try {
        const newExam = new Exam(req.body);
        await newExam.save();
        res.status(201).json(newExam);
    } catch (error) {
        res.status(400).json({ message: 'Error creating exam', error: error.message });
    }
});

// Timetable Schema
const timetableSchema = new mongoose.Schema({
    className: { type: String, required: true }, // e.g., "Grade 10-A"
    day: { type: String, required: true },
    period: { type: Number, required: true },
    subject: { type: String, required: true },
    teacher: { type: String, required: true }
});

// Composite index to ensure unique slot per class
timetableSchema.index({ className: 1, day: 1, period: 1 }, { unique: true });

const Timetable = mongoose.model('Timetable', timetableSchema);

// Timetable Routes
app.get('/api/timetable', async (req, res) => {
    try {
        const { className } = req.query;
        const query = className ? { className } : {};
        const entries = await Timetable.find(query);
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching timetable' });
    }
});

app.post('/api/timetable', async (req, res) => {
    try {
        // Upsert logic: if slot exists, update it; otherwise create new
        const { className, day, period, subject, teacher } = req.body;
        const entry = await Timetable.findOneAndUpdate(
            { className, day, period },
            { subject, teacher },
            { new: true, upsert: true }
        );
        res.json(entry);
    } catch (error) {
        res.status(400).json({ message: 'Error saving timetable entry', error: error.message });
    }
});

// Fee Structure Schema (Fee Registration)
const feeStructureSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    rollNo: { type: String, required: true },
    grade: { type: String, required: true }, // Class/Course
    academicYear: { type: String, required: true },
    feeComponents: {
        registrationFee: Number,
        admissionFee: Number,
        laboratoryFee: Number,
        internalExamFee: Number,
        libraryFee: Number,
        sportsFee: Number,
        tuitionFee: Number,
        annualExamFee: Number,
        booksRecordFee: Number,
        stationaryCharges: Number,
        uniformFee: Number,
        foodAccomFee: Number,
    },
    totalFee: { type: Number, required: true },
    registeredDate: { type: Date, default: Date.now }
});

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
    date: { type: String, required: true }, // Format YYYY-MM-DD
    className: { type: String, required: true },
    period: { type: Number, required: true }, // 1 to 8
    subject: { type: String }, // Snapshot of subject at that time
    records: [{
        studentId: { type: String, required: true },
        studentName: { type: String },
        rollNo: { type: String },
        status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' }
    }]
});

// Ensure unique record for a specific class, date, and period
attendanceSchema.index({ date: 1, className: 1, period: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Attendance Routes
app.get('/api/attendance', async (req, res) => {
    try {
        const { date, className, period } = req.query;
        if (!date || !className || !period) {
            return res.status(400).json({ message: 'Missing required query parameters' });
        }

        // Case-insensitive search for className
        const attendance = await Attendance.findOne({
            date,
            className: { $regex: new RegExp(`^${className}$`, 'i') },
            period
        });
        res.json(attendance || null);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance' });
    }
});

app.post('/api/attendance', async (req, res) => {
    try {
        const { date, className, period, subject, records } = req.body;

        // Case-insensitive upsert logic
        let attendanceEntry = await Attendance.findOne({
            date,
            className: { $regex: new RegExp(`^${className}$`, 'i') },
            period
        });

        if (attendanceEntry) {
            attendanceEntry.subject = subject;
            attendanceEntry.records = records;
            // Optionally update className to standardized format if needed
            // attendanceEntry.className = className; 
            await attendanceEntry.save();
        } else {
            attendanceEntry = new Attendance({
                date,
                className,
                period,
                subject,
                records
            });
            await attendanceEntry.save();
        }

        // Return the updated document
        res.json(attendanceEntry);
    } catch (error) {
        res.status(400).json({ message: 'Error saving attendance', error: error.message });
    }
});

// Get Student Attendance Stats
app.get('/api/attendance/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        // Find all attendance documents where this student appears in records
        const allAttendance = await Attendance.find({ "records.studentId": studentId });

        // Calculate stats
        let totalClasses = 0;
        let presentCount = 0;

        allAttendance.forEach(doc => {
            const record = doc.records.find(r => r.studentId === studentId);
            if (record) {
                totalClasses++;
                if (record.status === 'Present' || record.status === 'Late') {
                    presentCount++;
                }
            }
        });

        const percentage = totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100);

        res.json({
            totalClasses,
            presentCount,
            attendancePercentage: percentage
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching student attendance stats' });
    }
});

// Fee Structure Routes
app.get('/api/fee-structures', async (req, res) => {
    try {
        const structures = await FeeStructure.find().sort({ registeredDate: -1 });
        res.json(structures);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fee structures' });
    }
});

app.post('/api/fee-structures', async (req, res) => {
    try {
        const newStructure = new FeeStructure(req.body);
        await newStructure.save();
        res.status(201).json(newStructure);
    } catch (error) {
        res.status(400).json({ message: 'Error registering fee structure', error: error.message });
    }
});


// Start Server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await seedAdmin();
});
