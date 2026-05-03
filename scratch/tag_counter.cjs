const fs = require('fs');
const content = fs.readFileSync('src/components/ImageEditor.jsx', 'utf8');
let divBalance = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Simple regex to count <div and </div>
    const opens = (line.match(/<div(\s|>)/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    divBalance += opens;
    divBalance -= closes;
    if (divBalance < 0) {
        console.log(`Div imbalance at line ${i + 1}: ${divBalance}`);
        console.log(line);
    }
}
console.log(`Final div balance: ${divBalance}`);

let motionDivBalance = 0;
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const opens = (line.match(/<motion.div/g) || []).length;
    const closes = (line.match(/<\/motion.div>/g) || []).length;
    motionDivBalance += opens;
    motionDivBalance -= closes;
    if (motionDivBalance < 0) {
        console.log(`Motion div imbalance at line ${i + 1}: ${motionDivBalance}`);
        console.log(line);
    }
}
console.log(`Final motion div balance: ${motionDivBalance}`);
