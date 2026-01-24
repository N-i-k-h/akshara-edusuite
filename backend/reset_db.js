const mongoose = require('mongoose');
require('dotenv').config();

const resetDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        // List of Model Names to clear
        // Added 'Library' or 'Book' if it exists. 
        // Based on previous view_file of server.js, there IS NO Book/Library model in server.js yet.
        // It seems Library is currently using mock data in frontend (mockData.ts).
        // However, if the user THINKS it's in DB, or if I missed it, I should try to delete it from DB just in case.
        // I will add 'Book' and 'Issue' to the list just to be sure.

        const modelNames = [
            'Student',
            'Staff',
            'Fee',
            'FeeStructure',
            'Class',
            'Exam',
            'Timetable',
            'Attendance',
            'User',
            'Book', // Potential future model
            'Library' // Potential future model
        ];

        for (const name of modelNames) {
            try {
                // Define a generic schema to access the collection
                // This works because we just want to delete everything
                const Model = mongoose.models[name] || mongoose.model(name, new mongoose.Schema({}, { strict: false }));
                const result = await Model.deleteMany({});
                console.log(`Cleared ${name}: ${result.deletedCount} documents deleted`);
            } catch (e) {
                console.error(`Error clearing ${name}:`, e.message);
            }
        }

        // Re-seed Admin User so the app remains accessible
        console.log('Re-seeding Admin User...');
        const User = mongoose.model('User');
        await User.create({
            email: 'admin@akshara.com',
            password: 'admin',
            name: 'Super Admin',
            role: 'admin'
        });
        console.log('Admin user restored (email: admin@akshara.com, pass: admin)');

        console.log('All data has been reset successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Detailed Error:', error);
        process.exit(1);
    }
};

resetDb();
