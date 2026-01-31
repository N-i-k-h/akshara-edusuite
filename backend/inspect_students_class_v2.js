const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {

        try {
            // Using a loose schema to catch whatever is there
            const Student = mongoose.model('Student', new mongoose.Schema({ any: {} }, { strict: false }));

            const students = await Student.find({});
            console.log(`Total Students: ${students.length}`);

            const classes = students.map(s => s._doc.class || s._doc.className || s._doc.grade || "UNDEFINED");
            console.log('Unique Classes found:', [...new Set(classes)]);

            const dpharma1 = students.filter(s => {
                const c = s._doc.class || "";
                return c.toLowerCase().includes("dpharma") || c.toLowerCase().includes("d-pharma") || c.toLowerCase().includes("d.pharma");
            });

            console.log('Students looking like DPharma:', dpharma1.map(s => `${s._doc.name} (${s._doc.class})`));

        } catch (error) {
            console.error('Error:', error);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));
