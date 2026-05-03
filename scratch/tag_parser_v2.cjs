const fs = require('fs');
const content = fs.readFileSync('src/components/ImageEditor.jsx', 'utf8');

const stack = [];
// Regex to find all tags, including self-closing ones
const tagRegex = /<(\/?[a-zA-Z0-9\.:]+)(\s[^>]*?)?(\/?)>/g;
let match;

while ((match = tagRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    const isClosing = tagName.startsWith('/');
    const isSelfClosing = match[3] === '/';
    
    const pureName = isClosing ? tagName.slice(1) : tagName;
    
    if (isSelfClosing) {
        // console.log(`Self-closing tag: <${pureName}/>`);
    } else if (isClosing) {
        if (stack.length === 0) {
            console.log(`Unexpected closing tag </${pureName}> at pos ${match.index}`);
        } else {
            const last = stack.pop();
            if (last.name !== pureName) {
                console.log(`Mismatched tag: expected </${last.name}> (opened at ${last.pos}), found </${pureName}> at ${match.index}`);
            }
        }
    } else {
        stack.push({ name: pureName, pos: match.index });
    }
}

console.log('--- Remaining Stack ---');
stack.forEach(s => {
    // Find line number
    const lineNum = content.substring(0, s.pos).split('\n').length;
    console.log(`Unclosed tag <${s.name}> at line ${lineNum}`);
});
