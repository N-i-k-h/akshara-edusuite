const mongoose = require('mongoose');
require('dotenv').config();

const feeSchema = new mongoose.Schema({ studentId: String, amountPaid: Number, dueAmount: Number });
const feeStructureSchema = new mongoose.Schema({ studentId: String, totalFee: Number, studentName: String, grade: String });
const attendanceSchema = new mongoose.Schema({ className: String, records: [{ studentId: String, studentName: String, status: String }] });

const Fee = mongoose.model('Fee', feeSchema);
const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('--- CONNECTED ---');

        const defaultersAgg = await FeeStructure.aggregate([
            {
                $lookup: {
                    from: "fees",
                    let: { studentId: "$studentId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$studentId", "$$studentId"] } } },
                        { $group: { _id: null, totalPaid: { $sum: "$amountPaid" } } }
                    ],
                    as: "paymentInfo"
                }
            },
            {
                $addFields: {
                    totalPaid: { $ifNull: [{ $arrayElemAt: ["$paymentInfo.totalPaid", 0] }, 0] }
                }
            },
            {
                $addFields: {
                    pendingAmount: { $subtract: ["$totalFee", "$totalPaid"] }
                }
            },
            {
                // Only show those who ACTUALLY owe money
                $match: { pendingAmount: { $gt: 0 } }
            },
            {
                $project: { studentName: 1, pendingAmount: 1 }
            }
        ]);
        console.log('Defaulters:', JSON.stringify(defaultersAgg));

        const lowAttendance = await Attendance.aggregate([
            { $unwind: "$records" },
            {
                $group: {
                    _id: "$records.studentId",
                    studentName: { $first: "$records.studentName" },
                    totalClasses: { $sum: 1 },
                    presentCount: {
                        $sum: {
                            $cond: [{ $in: ["$records.status", ["Present", "Late"]] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    studentName: 1,
                    attendancePercentage: {
                        $multiply: [{ $divide: ["$presentCount", "$totalClasses"] }, 100]
                    }
                }
            }
        ]);
        console.log('Attendance:', JSON.stringify(lowAttendance));

        mongoose.disconnect();
    })
    .catch(err => console.error(err));
