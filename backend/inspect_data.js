const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        let output = 'Connected\n';

        const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
        const Timetable = mongoose.model('Timetable', new mongoose.Schema({}, { strict: false }));
        const Class = mongoose.model('Class', new mongoose.Schema({}, { strict: false }));

        const students = await Student.find({}, 'name class');
        output += '--- STUDENT CLASSES ---\n';
        students.forEach(s => output += `"${s.name}": "${s.class}"\n`);

        const timetables = await Timetable.find({}, 'className day period subject');
        output += '\n--- TIMETABLE CLASSES ---\n';
        timetables.forEach(t => output += `"${t.className}" - ${t.day} P${t.period}: ${t.subject}\n`);

        const classes = await Class.find({}, 'grade section');
        output += '\n--- DEFINED CLASSES ---\n';
        classes.forEach(c => output += `Grade: "${c.grade}", Section: "${c.section}"\n`);

        fs.writeFileSync('db_dump.txt', output);
        console.log('Done');
        mongoose.disconnect();
    })
    .catch(err => console.error(err));
