const mongoose = require('mongoose');
require('dotenv').config();

const clearStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');

        const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false })); // Generic model

        const result = await Student.deleteMany({});
        console.log(`Deleted ${result.deletedCount} students.`);

        // Also clear FeeStructures as they relate to students? 
        // "remove all students data" usually means the students themselves. 
        // But let's stick to students for now to be safe, unless "data" implies everything about them.
        // Given the aggressive nature of "remove all data", I'll remove students only to be precise.

        process.exit(0);
    } catch (error) {
        console.error('Error clearing students:', error);
        process.exit(1);
    }
};

clearStudents();
