const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';
// Use the studentId found in the check_results.js output: 679a1288cba996e44588b6c0
const studentId = '679a1288cba996e44588b6c0';

async function testEndpoint() {
    try {
        console.log(`Fetching results for student: ${studentId}`);
        const response = await fetch(`${API_BASE_URL}/results/student/${studentId}`);

        if (response.ok) {
            const data = await response.json();
            console.log('Success! Data received:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(`Failed! Status: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log('Body:', text);
        }
    } catch (error) {
        console.error('Error fetching:', error);
    }
}

testEndpoint();
