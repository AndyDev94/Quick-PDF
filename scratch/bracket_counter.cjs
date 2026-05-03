const fs = require('fs');
const content = fs.readFileSync('src/components/ImageEditor.jsx', 'utf8');
let balance = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let char of line) {
        if (char === '{') balance++;
        if (char === '}') balance--;
    }
    if (balance < 0) {
        console.log(`Imbalance at line ${i + 1}: ${balance}`);
        console.log(line);
        // break; // Keep going to see final balance
    }
}
console.log(`Final balance: ${balance}`);
