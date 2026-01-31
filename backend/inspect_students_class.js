const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('MongoDB connected');

        try {
            const studentSchema = new mongoose.Schema({
                name: { type: String, required: true },
                rollNo: { type: String, required: true },
                class: { type: String, required: true },
            });

            // To access the existing collection, we need to make sure we use the same model name 'Student'
            // or explicitly specify the collection name if it differs, but usually mongoose pluralizes 'Student' to 'students'.
            const Student = mongoose.model('Student', studentSchema);

            const students = await Student.find({}, 'name rollNo class');
            console.log('--- ALL STUDENTS ---');
            console.log(JSON.stringify(students, null, 2));
            console.log('--------------------');

            const dpharma1 = students.filter(s => s.class && s.class.toLowerCase().includes('dpharma 1'));
            console.log('Students matching "dpharma 1":', dpharma1.length);

        } catch (error) {
            console.error('Error:', error);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));
