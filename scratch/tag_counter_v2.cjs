const fs = require('fs');
const content = fs.readFileSync('src/components/ImageEditor.jsx', 'utf8');
let divBalance = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Count opening tags NOT ending with />
    const opens = (line.match(/<div(?:\s[^>]*?(?!\/)>(?:\s|$)|>)/g) || []).length;
    // Actually, let's use a simpler way: count all <div and subtract all />
    const allDivs = (line.match(/<div(\s|>)/g) || []).length;
    const selfCloses = (line.match(/<div[^>]*?\/>/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    divBalance += (allDivs - selfCloses);
    divBalance -= closes;
    if (divBalance < 0) {
        console.log(`Div imbalance at line ${i + 1}: ${divBalance}`);
        console.log(line);
    }
}
console.log(`Final div balance: ${divBalance}`);
