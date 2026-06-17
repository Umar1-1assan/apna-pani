const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.jsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'apps/web/src'));
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('₨')) {
        let newContent = content.replace(/₨\s?/g, 'PKR ');
        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            changedCount++;
            console.log(`Updated: ${file}`);
        }
    }
});

console.log(`Done. Updated ${changedCount} files.`);
