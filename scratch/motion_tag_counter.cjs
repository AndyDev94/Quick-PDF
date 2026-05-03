const fs = require('fs');
const content = fs.readFileSync('src/components/ImageEditor.jsx', 'utf8');
let motionDivBalance = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const opens = (line.match(/<motion.div/g) || []).length;
    const selfCloses = (line.match(/<motion.div[^>]*?\/>/g) || []).length;
    const closes = (line.match(/<\/motion.div>/g) || []).length;
    motionDivBalance += (opens - selfCloses);
    motionDivBalance -= closes;
    if (motionDivBalance < 0) {
        console.log(`Motion div imbalance at line ${i + 1}: ${motionDivBalance}`);
        console.log(line);
    }
}
console.log(`Final motion div balance: ${motionDivBalance}`);
