const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5010;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(
    "FATAL: JWT_SECRET is not set in .env file. Server cannot start.",
  );
  process.exit(1);
}

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Helmet — sets various HTTP security headers
app.use(helmet());

// CORS — restrict to allowed origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://ssscp.cloud,http://ssscp.cloud,http://localhost:5173")
  .split(",")
  .map((s) => s.trim());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (server-to-server, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Body parser with size limit to prevent payload attacks
app.use(express.json({ limit: "1mb" }));

// Rate limiting — general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per window
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", generalLimiter);

// Rate limiting — strict for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per window
  message: {
    message: "Too many login attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Akshara EduSuite API" });
});

// =============================================================================
// SCHEMAS
// =============================================================================

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    name: { type: String, default: "Admin", trim: true },
    role: { type: String, enum: ["admin", "faculty"], default: "admin" },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    admissionNumber: { type: String, required: true, unique: true, trim: true },
    rollNo: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    class: { type: String, required: true, trim: true },
    parentName: { type: String, required: true, trim: true },
    parentPhone: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    feesPaid: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Student = mongoose.model("Student", studentSchema);

const feeSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    studentName: { type: String, required: true, trim: true },
    admissionNumber: { type: String, trim: true },
    grade: { type: String, required: true, trim: true },
    feeType: { type: String, required: true, trim: true },
    amountPaid: { type: Number, required: true, min: 0 },
    dueAmount: { type: Number, required: true, min: 0 },
    totalFee: { type: Number, min: 0 },
    receiptNo: { type: String, trim: true },
    feeItems: [
      {
        name: { type: String, required: true },
        value: { type: Number, required: true, default: 0 }
      }
    ],
    paymentMethod: {
      type: String,
      enum: ["Card", "Cash", "UPI", "Other"],
      required: true,
    },
    date: { type: Date, default: Date.now },
    status: { type: String, default: "Paid" },
  },
  { timestamps: true },
);

const Fee = mongoose.model("Fee", feeSchema);

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: String, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    password: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedClasses: [{ type: String }],
  },
  { timestamps: true },
);

const Staff = mongoose.model("Staff", staffSchema);

const classSchema = new mongoose.Schema({
  grade: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true },
  room: { type: String, required: true, trim: true },
  classTeacher: { type: String, required: true, trim: true },
  studentsCount: { type: Number, default: 0, min: 0 },
});

const Class = mongoose.model("Class", classSchema);

const examSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  className: { type: String, required: true, trim: true },
  subjects: [
    {
      name: { type: String, required: true },
      date: { type: String, required: true },
      time: { type: String, required: true },
      totalMarks: { type: Number, required: true, min: 0 },
      facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    },
  ],
  status: { type: String, default: "Scheduled" },
  createdAt: { type: Date, default: Date.now },
});

const Exam = mongoose.model("Exam", examSchema);

const examResultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  studentId: { type: String, required: true },
  studentName: { type: String },
  rollNo: { type: String },
  marks: [
    {
      subjectName: { type: String, required: true },
      obtainedMarks: { type: Number, required: true, default: 0, min: 0 },
      totalMarks: { type: Number, required: true, min: 0 },
    },
  ],
});

examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });
const ExamResult = mongoose.model("ExamResult", examResultSchema);

const timetableSchema = new mongoose.Schema({
  className: { type: String, required: true, trim: true },
  day: { type: String, required: true, trim: true },
  period: { type: Number, required: true, min: 1, max: 10 },
  subject: { type: String, required: true, trim: true },
  teacher: { type: String, required: true, trim: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
});

timetableSchema.index({ className: 1, day: 1, period: 1 }, { unique: true });
const Timetable = mongoose.model("Timetable", timetableSchema);

const feeStructureSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true, trim: true },
  admissionNumber: { type: String, required: true, trim: true },
  rollNo: { type: String, trim: true },
  grade: { type: String, required: true, trim: true },
  academicYear: { type: String, required: true },
  feeItems: [
    {
      name: { type: String, required: true },
      value: { type: Number, required: true, default: 0 }
    }
  ],
  totalFee: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, default: "Cash" },
  paymentDate: { type: Date, default: Date.now },
  registeredDate: { type: Date, default: Date.now },
});

const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);

const expenditureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: "General" },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    description: { type: String, trim: true },
    paymentMethod: { type: String, default: "Cash" },
  },
  { timestamps: true },
);

const Expenditure = mongoose.model("Expenditure", expenditureSchema);

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  className: { type: String, required: true },
  period: { type: Number, required: true, min: 1, max: 10 },
  subject: { type: String },
  records: [
    {
      studentId: { type: String, required: true },
      studentName: { type: String },
      rollNo: { type: String },
      status: {
        type: String,
        enum: ["Present", "Absent", "Late"],
        default: "Present",
      },
    },
  ],
});

attendanceSchema.index({ date: 1, className: 1, period: 1 }, { unique: true });
const Attendance = mongoose.model("Attendance", attendanceSchema);

// =============================================================================
// HELPERS
// =============================================================================

// Escape regex special characters to prevent ReDoS attacks
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Validate MongoDB ObjectId format
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Seed admin user with hashed password + migrate plain-text passwords
const seedAdmin = async () => {
  try {
    const adminEmail = (
      process.env.ADMIN_EMAIL || "admin@akshara.com"
    ).toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin";
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const admin = new User({
        email: adminEmail,
        password: hashedPassword,
        name: "Super Admin",
        role: "admin",
      });
      await admin.save();
      console.log("Admin user seeded successfully");
    } else {
      // Migrate plain-text password to bcrypt if needed
      // bcrypt hashes always start with "$2"
      if (!adminExists.password.startsWith("$2")) {
        console.log("Migrating admin password to bcrypt...");
        adminExists.password = await bcrypt.hash(adminPassword, 12);
        await adminExists.save();
        console.log("Admin password migrated successfully");
      } else {
        console.log("Admin user already exists");
      }
    }

    try {
      await Student.collection.dropIndex("rollNo_1");
      console.log("Dropped old rollNo unique index");
    } catch (e) {
      // Ignored if index does not exist
    }

    // Migrate all users with plain-text passwords
    const usersWithPlainPasswords = await User.find({
      password: { $not: /^\$2/ },
    });
    for (const user of usersWithPlainPasswords) {
      const plainPassword = user.password;
      if (!plainPassword) continue;
      user.password = await bcrypt.hash(plainPassword, 12);
      await user.save();
      console.log(`Migrated password for user: ${user.email}`);
    }

    // Migrate staff passwords too
    const staffWithPlainPasswords = await Staff.find({
      password: { $not: /^\$2/ },
    });
    for (const staff of staffWithPlainPasswords) {
      const plainPassword = staff.password;
      if (!plainPassword) continue;
      staff.password = await bcrypt.hash(plainPassword, 12);
      await staff.save();
      console.log(`Migrated password for staff: ${staff.email}`);
    }

    // Remove old admin accounts that don't match current ADMIN_EMAIL
    const oldAdmins = await User.find({
      role: "admin",
      email: { $ne: adminEmail },
    });
    for (const oldAdmin of oldAdmins) {
      await User.findByIdAndDelete(oldAdmin._id);
      console.log(`Removed old admin account: ${oldAdmin.email}`);
    }
  } catch (error) {
    console.error("Error seeding admin:", error.message);
  }
};

// Update student fee status
const updateStudentFeeStatus = async (studentId) => {
  try {
    // Find all fees for the student, sorted by date descending to get the most recent one
    const latestFee = await Fee.findOne({ studentId }).sort({ date: -1 });
    
    // If there's a record and its dueAmount is 0 or less, then it's paid
    const isPaid = latestFee && latestFee.dueAmount <= 0;
    
    await Student.findByIdAndUpdate(studentId, { feesPaid: isPaid });
  } catch (error) {
    console.error("Error updating student fee status:", error.message);
  }
};

// =============================================================================
// AUTH MIDDLEWARE
// =============================================================================

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// =============================================================================
// AUTH ROUTES (Public)
// =============================================================================

app.post("/api/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// =============================================================================
// PROTECTED ROUTES — All routes below require authentication
// =============================================================================

app.use("/api/students", authenticate);
app.use("/api/staff", authenticate);
app.use("/api/classes", authenticate);
app.use("/api/fees", authenticate);
app.use("/api/fee-structures", authenticate);
app.use("/api/exams", authenticate);
app.use("/api/results", authenticate);
app.use("/api/attendance", authenticate);
app.use("/api/timetable", authenticate);
app.use("/api/dashboard", authenticate);
app.use("/api/faculty", authenticate);
app.use("/api/users", authenticate);

// =============================================================================
// STUDENT ROUTES
// =============================================================================

app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students" });
  }
});

app.get("/api/students/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student" });
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const { admissionNumber } = req.body;
    if (!admissionNumber) {
      return res.status(400).json({ message: "Admission number is required" });
    }
    const existingStudent = await Student.findOne({ admissionNumber: admissionNumber.trim() });
    if (existingStudent) {
      return res
        .status(400)
        .json({ message: "Student with this Admission Number already exists" });
    }

    const newStudent = new Student(req.body);
    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Duplicate key error: Admission Number must be unique" });
    }
    res
      .status(400)
      .json({ message: "Error creating student", error: error.message });
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    // Check admission number uniqueness if it's being updated
    if (req.body.admissionNumber) {
      const existingStudent = await Student.findOne({
        admissionNumber: req.body.admissionNumber.trim(),
        _id: { $ne: studentId },
      });
      if (existingStudent) {
        return res
          .status(400)
          .json({ message: "Student with this Admission Number already exists" });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(updatedStudent);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Duplicate key error: Admission Number must be unique" });
    }
    res
      .status(400)
      .json({ message: "Error updating student", error: error.message });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const deletedStudent = await Student.findByIdAndDelete(studentId);
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Cascade delete related data
    await FeeStructure.deleteMany({ studentId });
    await Fee.deleteMany({ studentId });
    await Attendance.updateMany(
      { "records.studentId": studentId },
      { $pull: { records: { studentId: studentId } } },
    );

    res.json({ message: "Student and related data deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error.message);
    res.status(500).json({ message: "Error deleting student" });
  }
});

// =============================================================================
// FEE ROUTES
// =============================================================================

app.get("/api/fees", async (req, res) => {
  try {
    const fees = await Fee.find().sort({ date: -1 });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fees" });
  }
});

app.post("/api/fees", async (req, res) => {
  try {
    const newFee = new Fee(req.body);
    await newFee.save();
    await updateStudentFeeStatus(newFee.studentId);
    res.status(201).json(newFee);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating fee record", error: error.message });
  }
});

app.put("/api/fees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid fee ID" });
    }
    const updatedFee = await Fee.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedFee) {
      return res.status(404).json({ message: "Fee record not found" });
    }
    await updateStudentFeeStatus(updatedFee.studentId);
    res.json(updatedFee);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating fee record", error: error.message });
  }
});

// =============================================================================
// STAFF ROUTES
// =============================================================================

app.get("/api/staff", async (req, res) => {
  try {
    const staffMembers = await Staff.find().select("-password");
    res.json(staffMembers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff" });
  }
});

app.post("/api/staff", async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role,
      department,
      phone,
      salary,
      joiningDate,
      status,
      assignedClasses,
    } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Email, password, and name are required" });
    }

    const existingStaff = await Staff.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingStaff) {
      return res
        .status(400)
        .json({ message: "Staff with this email already exists" });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create User account for faculty login
    const newUser = new User({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name,
      role: "faculty",
    });
    await newUser.save();

    // Create Staff record linked to User
    const newStaff = new Staff({
      name,
      role,
      department,
      email: email.toLowerCase().trim(),
      phone,
      salary,
      joiningDate,
      status: status || "Active",
      password: hashedPassword,
      userId: newUser._id,
      assignedClasses: assignedClasses || [],
    });
    await newStaff.save();

    const staffResponse = newStaff.toObject();
    delete staffResponse.password;
    res.status(201).json(staffResponse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res
      .status(400)
      .json({ message: "Error creating staff", error: error.message });
  }
});

app.put("/api/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid staff ID" });
    }

    const updateData = { ...req.body };
    const { password, name, email } = updateData;

    // Remove password from simple update if it's empty
    if (!password) {
      delete updateData.password;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;

      const staff = await Staff.findById(id);
      if (staff && staff.userId) {
        await User.findByIdAndUpdate(staff.userId, {
          password: hashedPassword,
          name: name || staff.name,
          email: email || staff.email,
        });
      }
    } else {
      // If we are updating name or email, sync it with the linked User account as well
      const staff = await Staff.findById(id);
      if (staff && staff.userId && (name || email)) {
        await User.findByIdAndUpdate(staff.userId, {
          name: name || staff.name,
          email: email || staff.email,
        });
      }
    }

    const updatedStaff = await Staff.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedStaff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json(updatedStaff);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating staff", error: error.message });
  }
});

app.delete("/api/staff/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid staff ID" });
    }
    const deletedStaff = await Staff.findByIdAndDelete(req.params.id);
    if (!deletedStaff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Cascade delete the linked User account
    if (deletedStaff.userId) {
      await User.findByIdAndDelete(deletedStaff.userId);
    }

    res.json({ message: "Staff member deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting staff", error: error.message });
  }
});

// =============================================================================
// CLASS ROUTES
// =============================================================================

app.get("/api/classes", async (req, res) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching classes" });
  }
});

app.post("/api/classes", async (req, res) => {
  try {
    const newClass = new Class(req.body);
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating class", error: error.message });
  }
});

// =============================================================================
// DASHBOARD ROUTES
// =============================================================================

app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const [
      totalStudents,
      totalFaculty,
      feeStructures,
      fees,
      attendanceRecords,
      expenditures,
    ] = await Promise.all([
      Student.countDocuments(),
      Staff.countDocuments(),
      FeeStructure.find({}).lean(),
      Fee.find({}).lean(),
      Attendance.find({}).lean(),
      Expenditure.find({}).lean(),
    ]);

    // Calculate Financial Management metrics
    const totalFeesCollected = fees.reduce(
      (sum, fee) => sum + (fee.amountPaid || 0),
      0,
    );

    const totalExpenditure = expenditures.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0,
    );

    const netRevenue = totalFeesCollected - totalExpenditure;

    // Calculate Defaulters and Fees Due
    const studentDues = {};
    feeStructures.forEach((fs) => {
      if (!studentDues[fs.studentId]) {
        studentDues[fs.studentId] = {
          name: fs.studentName,
          expected: 0,
          paid: 0,
          grade: fs.grade || fs.class || "N/A",
        };
      }
      studentDues[fs.studentId].expected += fs.totalFee || 0;
    });

    fees.forEach((fee) => {
      if (studentDues[fee.studentId]) {
        studentDues[fee.studentId].paid += fee.amountPaid || 0;
      }
    });

    const defaultersList = [];
    let feesDue = 0;

    Object.keys(studentDues).forEach((studentId) => {
      const data = studentDues[studentId];
      const due = data.expected - data.paid;
      if (due > 0) {
        feesDue += due;
        defaultersList.push({
          studentName: data.name,
          grade: data.grade,
          dueAmount: due,
        });
      }
    });

    defaultersList.sort((a, b) => b.dueAmount - a.dueAmount);
    const feeDefaulters = defaultersList.slice(0, 5);

    // Calculate Low Attendance
    const attendanceStats = {};
    attendanceRecords.forEach((record) => {
      if (record.records && Array.isArray(record.records)) {
        record.records.forEach((studentEntry) => {
          const sid = studentEntry.studentId;
          if (!attendanceStats[sid]) {
            attendanceStats[sid] = {
              name: studentEntry.studentName,
              className: record.className,
              present: 0,
              total: 0,
            };
          }
          attendanceStats[sid].total += 1;
          if (
            studentEntry.status === "Present" ||
            studentEntry.status === "Late"
          ) {
            attendanceStats[sid].present += 1;
          }
        });
      }
    });

    const lowAttendanceList = [];
    Object.keys(attendanceStats).forEach((sid) => {
      const data = attendanceStats[sid];
      const percentage = data.total > 0 ? (data.present / data.total) * 100 : 0;
      if (percentage < 85) {
        lowAttendanceList.push({
          studentName: data.name,
          className: data.className,
          attendancePercentage: percentage,
        });
      }
    });

    lowAttendanceList.sort(
      (a, b) => a.attendancePercentage - b.attendancePercentage,
    );
    const lowAttendanceStudents = lowAttendanceList.slice(0, 5);

    res.json({
      totalStudents,
      totalFaculty,
      totalRevenue: totalFeesCollected,
      feesCollected: totalFeesCollected,
      totalExpenditure,
      netRevenue,
      feesDue,
      feeDefaulters,
      lowAttendanceStudents,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error.message);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
});

// =============================================================================
// USER PROFILE ROUTES
// =============================================================================

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Users can only update their own profile (admin can update anyone)
    if (String(req.user.id) !== String(id) && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this profile" });
    }

    const { name, email, password } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res
      .status(400)
      .json({ message: "Error updating user", error: error.message });
  }
});

// =============================================================================
// EXAM ROUTES
// =============================================================================

app.get("/api/exams", async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exams" });
  }
});

app.post("/api/exams", async (req, res) => {
  try {
    const newExam = new Exam(req.body);
    await newExam.save();
    res.status(201).json(newExam);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating exam", error: error.message });
  }
});

app.delete("/api/exams/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid exam ID" });
    }
    const deletedExam = await Exam.findByIdAndDelete(req.params.id);
    if (!deletedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    await ExamResult.deleteMany({ examId: req.params.id });
    res.json({ message: "Exam and related results deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting exam", error: error.message });
  }
});

// Exam Results Routes
app.get("/api/exams/:id/results", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid exam ID" });
    }
    const results = await ExamResult.find({ examId: req.params.id });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exam results" });
  }
});

app.post("/api/exams/:id/results", async (req, res) => {
  try {
    const examId = req.params.id;
    if (!isValidObjectId(examId)) {
      return res.status(400).json({ message: "Invalid exam ID" });
    }
    const { studentId, studentName, rollNo, marks } = req.body;
    const result = await ExamResult.findOneAndUpdate(
      { examId, studentId },
      { studentName, rollNo, marks },
      { new: true, upsert: true, runValidators: true },
    );
    res.json(result);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error saving exam result", error: error.message });
  }
});

app.post("/api/exams/:id/results/bulk", async (req, res) => {
  try {
    const examId = req.params.id;
    if (!isValidObjectId(examId)) {
      return res.status(400).json({ message: "Invalid exam ID" });
    }
    const results = req.body;
    if (!Array.isArray(results)) {
      return res.status(400).json({ message: "Request body must be an array" });
    }

    const bulkOps = results.map((result) => ({
      updateOne: {
        filter: { examId, studentId: result.studentId },
        update: { $set: { ...result, examId } },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await ExamResult.bulkWrite(bulkOps);
    }
    res.json({ message: "Bulk save successful" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error during bulk save", error: error.message });
  }
});

app.get("/api/results/student/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const results = await ExamResult.find({ studentId }).lean();

    const enhancedResults = await Promise.all(
      results.map(async (result) => {
        const exam = await Exam.findById(result.examId).lean();
        return {
          ...result,
          examName: exam ? exam.name : "Unknown Exam",
          examDate:
            exam && exam.subjects.length > 0 ? exam.subjects[0].date : "N/A",
        };
      }),
    );

    res.json(enhancedResults);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student results" });
  }
});

// =============================================================================
// TIMETABLE ROUTES
// =============================================================================

app.get("/api/timetable", async (req, res) => {
  try {
    const { className } = req.query;
    const query = className ? { className } : {};
    const entries = await Timetable.find(query);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching timetable" });
  }
});

app.post("/api/timetable", async (req, res) => {
  try {
    const { className, day, period, subject, teacher } = req.body;

    let facultyId = null;
    if (teacher) {
      const staff = await Staff.findOne({ name: teacher });
      if (staff) {
        facultyId = staff._id;
        if (className && !staff.assignedClasses.includes(className)) {
          staff.assignedClasses.push(className);
          await staff.save();
        }
      }
    }

    const entry = await Timetable.findOneAndUpdate(
      { className, day, period },
      { subject, teacher, facultyId },
      { new: true, upsert: true, runValidators: true },
    );
    res.json(entry);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error saving timetable entry", error: error.message });
  }
});

app.put("/api/timetable/:id/assign-faculty", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid timetable ID" });
    }
    const { facultyId } = req.body;
    const entry = await Timetable.findByIdAndUpdate(
      id,
      { facultyId },
      { new: true },
    );
    if (!entry) {
      return res.status(404).json({ message: "Timetable entry not found" });
    }
    res.json(entry);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error assigning faculty", error: error.message });
  }
});

// =============================================================================
// ATTENDANCE ROUTES
// =============================================================================

app.get("/api/attendance", async (req, res) => {
  try {
    const { date, className, period } = req.query;
    if (!date || !className || !period) {
      return res
        .status(400)
        .json({
          message: "Missing required query parameters: date, className, period",
        });
    }

    // Escape regex input to prevent ReDoS
    const escapedClassName = escapeRegex(className);
    const attendance = await Attendance.findOne({
      date,
      className: { $regex: new RegExp(`^${escapedClassName}$`, "i") },
      period,
    });
    res.json(attendance || null);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance" });
  }
});

app.post("/api/attendance", async (req, res) => {
  try {
    const { date, className, period, subject, records } = req.body;
    if (!date || !className || !period || !records) {
      return res
        .status(400)
        .json({
          message: "Missing required fields: date, className, period, records",
        });
    }

    const escapedClassName = escapeRegex(className);
    let attendanceEntry = await Attendance.findOne({
      date,
      className: { $regex: new RegExp(`^${escapedClassName}$`, "i") },
      period,
    });

    if (attendanceEntry) {
      attendanceEntry.subject = subject;
      attendanceEntry.records = records;
      await attendanceEntry.save();
    } else {
      attendanceEntry = new Attendance({
        date,
        className,
        period,
        subject,
        records,
      });
      await attendanceEntry.save();
    }

    res.json(attendanceEntry);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error saving attendance", error: error.message });
  }
});

app.get("/api/attendance/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const allAttendance = await Attendance.find({
      "records.studentId": studentId,
    });

    let totalClasses = 0;
    let presentCount = 0;

    allAttendance.forEach((doc) => {
      const record = doc.records.find((r) => r.studentId === studentId);
      if (record) {
        totalClasses++;
        if (record.status === "Present" || record.status === "Late") {
          presentCount++;
        }
      }
    });

    const percentage =
      totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100);
    res.json({ totalClasses, presentCount, attendancePercentage: percentage });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching student attendance stats" });
  }
});

// Subject-wise attendance breakdown for a student
app.get("/api/attendance/student/:studentId/subjects", async (req, res) => {
  try {
    const { studentId } = req.params;
    const allAttendance = await Attendance.find({
      "records.studentId": studentId,
    }).lean();

    // Group by subject
    const subjectMap = {};

    allAttendance.forEach((doc) => {
      const record = doc.records.find((r) => r.studentId === studentId);
      if (!record) return;

      const subject = doc.subject || "Unknown";

      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          subject,
          totalClasses: 0,
          attended: 0,
        };
      }

      subjectMap[subject].totalClasses += 1;
      if (record.status === "Present" || record.status === "Late") {
        subjectMap[subject].attended += 1;
      }
    });

    // Convert to array and calculate percentages
    const subjects = Object.values(subjectMap).map((s) => ({
      ...s,
      percentage:
        s.totalClasses === 0
          ? 0
          : Math.round((s.attended / s.totalClasses) * 100),
    }));

    // Sort by subject name
    subjects.sort((a, b) => a.subject.localeCompare(b.subject));

    // Calculate overall totals
    const totalClasses = subjects.reduce((sum, s) => sum + s.totalClasses, 0);
    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const overallPercentage =
      totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);

    res.json({
      subjects,
      overall: {
        totalClasses,
        totalAttended,
        percentage: overallPercentage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching subject-wise attendance" });
  }
});

// =============================================================================
// FEE STRUCTURE ROUTES
// =============================================================================

app.get("/api/fee-structures", async (req, res) => {
  try {
    const structures = await FeeStructure.find().sort({ registeredDate: -1 });
    res.json(structures);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fee structures" });
  }
});

app.get("/api/fee-structures/student/:studentId", async (req, res) => {
  try {
    const structure = await FeeStructure.findOne({
      studentId: req.params.studentId,
    }).sort({ registeredDate: -1 });
    if (!structure)
      return res.status(404).json({ message: "Fee structure not found" });
    res.json(structure);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student fee structure" });
  }
});

app.post("/api/fee-structures", async (req, res) => {
  try {
    const newStructure = new FeeStructure(req.body);
    await newStructure.save();
    res.status(201).json(newStructure);
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Error registering fee structure",
        error: error.message,
      });
  }
});

// =============================================================================
// EXPENDITURE ROUTES
// =============================================================================

app.get("/api/expenditures", authenticate, async (req, res) => {
  try {
    const expenditures = await Expenditure.find().sort({ date: -1 });
    res.json(expenditures);
  } catch (error) {
    res.status(500).json({ message: "Error fetching expenditures" });
  }
});

app.post("/api/expenditures", authenticate, requireAdmin, async (req, res) => {
  try {
    const newExpenditure = new Expenditure(req.body);
    await newExpenditure.save();
    res.status(201).json(newExpenditure);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating expenditure", error: error.message });
  }
});

app.put(
  "/api/expenditures/:id",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid expenditure ID" });
      }
      const updated = await Expenditure.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated)
        return res.status(404).json({ message: "Expenditure not found" });
      res.json(updated);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error updating expenditure", error: error.message });
    }
  },
);

app.delete(
  "/api/expenditures/:id",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid expenditure ID" });
      }
      const deleted = await Expenditure.findByIdAndDelete(id);
      if (!deleted)
        return res.status(404).json({ message: "Expenditure not found" });
      res.json({ message: "Expenditure deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting expenditure", error: error.message });
    }
  },
);

// =============================================================================
// FACULTY-SPECIFIC ROUTES
// =============================================================================

app.get("/api/faculty/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    let staff = await Staff.findOne({ userId }).select("-password");

    if (!staff) {
      const user = await User.findById(userId);
      if (user) {
        staff = await Staff.findOne({ email: user.email }).select("-password");
        if (staff) {
          staff.userId = userId;
          await staff.save();
        }
      }
    }

    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: "Error fetching faculty profile" });
  }
});

app.get("/api/faculty/:facultyId/periods", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.facultyId)) {
      return res.status(400).json({ message: "Invalid faculty ID" });
    }
    const periods = await Timetable.find({ facultyId: req.params.facultyId });
    res.json(periods);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned periods" });
  }
});

app.get("/api/faculty/:facultyId/exams", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.facultyId)) {
      return res.status(400).json({ message: "Invalid faculty ID" });
    }
    const exams = await Exam.find({
      "subjects.facultyId": req.params.facultyId,
    });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned exams" });
  }
});

app.get("/api/faculty/:facultyId/students", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.facultyId)) {
      return res.status(400).json({ message: "Invalid faculty ID" });
    }
    const faculty = await Staff.findById(req.params.facultyId);
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    if (!faculty.assignedClasses || faculty.assignedClasses.length === 0) {
      return res.json([]);
    }
    const students = await Student.find({
      class: { $in: faculty.assignedClasses },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students" });
  }
});

app.get("/api/faculty/:facultyId/attendance", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.facultyId)) {
      return res.status(400).json({ message: "Invalid faculty ID" });
    }
    const { date } = req.query;
    const faculty = await Staff.findById(req.params.facultyId);
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    if (!faculty.assignedClasses || faculty.assignedClasses.length === 0) {
      return res.json([]);
    }

    const query = { className: { $in: faculty.assignedClasses } };
    if (date) query.date = date;

    const attendanceRecords = await Attendance.find(query);
    res.json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance" });
  }
});

app.put("/api/staff/:id/assign-classes", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid staff ID" });
    }
    const { assignedClasses } = req.body;
    if (!Array.isArray(assignedClasses)) {
      return res
        .status(400)
        .json({ message: "assignedClasses must be an array" });
    }

    const staff = await Staff.findByIdAndUpdate(
      id,
      { assignedClasses },
      { new: true, runValidators: true },
    ).select("-password");

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json(staff);
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Error updating assigned classes",
        error: error.message,
      });
  }
});

// =============================================================================
// GLOBAL ERROR HANDLER
// =============================================================================

app.use((err, req, res, next) => {
  // Handle CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS: Origin not allowed" });
  }
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Internal server error" });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedAdmin();
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Force close after 10 seconds
  const forceTimeout = setTimeout(() => {
    console.error(
      "Could not close connections in time. Forcefully shutting down.",
    );
    process.exit(1);
  }, 10000);

  try {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    clearTimeout(forceTimeout);
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err.message);
    clearTimeout(forceTimeout);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
