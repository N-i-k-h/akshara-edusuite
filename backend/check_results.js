const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('MongoDB connected');

        try {
            const ExamResult = mongoose.model('ExamResult', new mongoose.Schema({
                examId: mongoose.Schema.Types.ObjectId,
                studentId: String,
                marks: Array
            }, { strict: false }));

            const results = await ExamResult.find({});
            console.log(`Total Exam Results: ${results.length}`);
            if (results.length > 0) {
                console.log('Sample Result:', JSON.stringify(results[0], null, 2));
            } else {
                console.log('No exam results found in DB.');
            }

        } catch (error) {
            console.error('Error:', error);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));
