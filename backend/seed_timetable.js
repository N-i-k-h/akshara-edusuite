const mongoose = require('mongoose');
require('dotenv').config();

const descriptors = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];
const teachers = ['Dr. Sunita', 'Prof. Rajesh', 'Mrs. Kavitha', 'Mr. Arun', 'Ms. Priya', 'Mr. John'];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('Connected to MongoDB');

        const Class = mongoose.model('Class', new mongoose.Schema({
            grade: String,
            section: String
        }, { strict: false }));

        const Timetable = mongoose.model('Timetable', new mongoose.Schema({
            className: String,
            day: String,
            period: Number,
            subject: String,
            teacher: String
        }, { strict: false }));

        // 1. Get all classes
        const classes = await Class.find({});
        console.log(`Found ${classes.length} classes.`);

        if (classes.length === 0) {
            console.log("No classes found. Cannot seed timetable.");
            process.exit(0);
        }

        // 2. Clear existing timetable ?? Maybe not, just upsert.
        // Let's clear to be clean.
        await Timetable.deleteMany({});
        console.log("Cleared existing timetable entries.");

        // 3. Generate Timetable for each class, each day, periods 1-8
        for (const cls of classes) {
            const className = cls.grade.startsWith("D.")
                ? `${cls.grade} - ${cls.section}`
                : `Grade ${cls.grade} - ${cls.section}`;

            console.log(`Seeding for ${className}...`);

            for (const day of days) {
                for (let period = 1; period <= 8; period++) {
                    // Random subject/teacher
                    const randIdx = Math.floor(Math.random() * descriptors.length);
                    const subject = descriptors[randIdx];
                    const teacher = teachers[randIdx];

                    await Timetable.create({
                        className: className,
                        day: day,
                        period: period,
                        subject: subject,
                        teacher: teacher
                    });
                }
            }
        }

        console.log('Timetable seeded successfully for all days.');
        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
