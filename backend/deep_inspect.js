const mongoose = require('mongoose');
require('dotenv').config();

// Schemas
const feeSchema = new mongoose.Schema({ studentId: String, amountPaid: Number, dueAmount: Number, feeType: String });
const feeStructureSchema = new mongoose.Schema({ studentId: String, totalFee: Number, studentName: String });
const attendanceSchema = new mongoose.Schema({ className: String, records: [{ studentId: String, studentName: String, status: String }] });

const Fee = mongoose.model('Fee', feeSchema);
const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('--- DB INSPECTION ---');

        // 1. DUMP FEE STRUCTURES (What they SHOULD pay)
        const structures = await FeeStructure.find({});
        console.log(`\n[FeeStructure] Count: ${structures.length}`);
        structures.forEach(s => console.log(` - Student: ${s.studentId}, Name: ${s.studentName}, Total: ${s.totalFee}`));

        // 2. DUMP FEES (What they HAVE paid)
        const payments = await Fee.find({});
        console.log(`\n[Fee] (Transactions) Count: ${payments.length}`);
        payments.forEach(p => console.log(` - Student: ${p.studentId}, Paid: ${p.amountPaid}, DueField: ${p.dueAmount}`));

        // 3. MANUAL CALCULATION SIMULATION
        console.log('\n[Comparison]');
        for (const s of structures) {
            const paid = payments.filter(p => p.studentId === s.studentId).reduce((sum, p) => sum + (p.amountPaid || 0), 0);
            const due = s.totalFee - paid;
            console.log(` - ${s.studentName}: Total ${s.totalFee} - Paid ${paid} = Due ${due}. Defaulter? ${due > 0}`);
        }

        // 4. DUMP ATTENDANCE
        const attendance = await Attendance.find({});
        console.log(`\n[Attendance] Docs: ${attendance.length}`);
        attendance.forEach(a => {
            console.log(` - Class: ${a.className}`);
            a.records.forEach(r => console.log(`   * ${r.studentName} (${r.studentId}): ${r.status}`));
        });

        mongoose.disconnect();
    })
    .catch(err => console.error(err));
