const mongoose = require('mongoose');
require('dotenv').config();

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

const Fee = mongoose.model('Fee', feeSchema);
const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to MongoDB');

        const fees = await Fee.find({});
        console.log('Fees Count:', fees.length);
        console.log('Fees Sample:', fees.slice(0, 2));

        const structures = await FeeStructure.find({});
        console.log('Fee Structures Count:', structures.length);
        console.log('Fee Structures Sample:', structures.slice(0, 2));

        const defaulters = await Fee.find({ dueAmount: { $gt: 0 } });
        console.log('Current Defaulters Query Count:', defaulters.length);
        console.log('Current Defaulters Sample:', defaulters);

        mongoose.disconnect();
    })
    .catch(err => console.error(err));
