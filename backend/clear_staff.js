const mongoose = require('mongoose');
require('dotenv').config();

const clearStaff = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');

        const Staff = mongoose.model('Staff', new mongoose.Schema({}, { strict: false })); // Generic model

        const result = await Staff.deleteMany({});
        console.log(`Deleted ${result.deletedCount} staff members.`);

        process.exit(0);
    } catch (error) {
        console.error('Error clearing staff:', error);
        process.exit(1);
    }
};

clearStaff();
