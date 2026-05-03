const fs = require('fs');
const content = fs.readFileSync('src/components/ImageEditor.jsx', 'utf8');
const stack = [];
const tags = content.match(/<\/?([a-zA-Z0-9\.:]+)(\s|>)/g) || [];

for (let fullTag of tags) {
    const isClosing = fullTag.startsWith('</');
    const tagName = fullTag.replace(/<\/?/, '').replace(/(\s|>)/, '');
    
    if (isClosing) {
        if (stack.length === 0) {
            console.log(`Unexpected closing tag: </${tagName}>`);
        } else {
            const last = stack.pop();
            if (last !== tagName) {
                console.log(`Mismatched closing tag: expected </${last}>, found </${tagName}>`);
            }
        }
    } else {
        // Check if self-closing (very simple check, might fail for complex ones)
        // Actually, match doesn't include the trailing / if it's there
        // So we need to check the original content around the tag
    }
}
console.log(`Remaining stack: ${stack.join(', ')}`);
