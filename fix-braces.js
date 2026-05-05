const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(__dirname + '/src');
let totalFixed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Step 1: Protect Angular template interpolation {{ expr }}
    // Find template: `...` blocks and protect their {{ }} interpolations
    const templatePlaceholders = [];
    let placeholderIndex = 0;

    // Extract inline templates (template: `...`)
    content = content.replace(/template:\s*`([\s\S]*?)`/g, (match) => {
        const placeholder = `__TEMPLATE_PLACEHOLDER_${placeholderIndex}__`;
        templatePlaceholders.push({ placeholder, value: match });
        placeholderIndex++;
        return placeholder;
    });

    // Also extract styles: [`...`] blocks to protect them
    content = content.replace(/styles:\s*\[\s*`([\s\S]*?)`\s*\]/g, (match) => {
        const placeholder = `__TEMPLATE_PLACEHOLDER_${placeholderIndex}__`;
        templatePlaceholders.push({ placeholder, value: match });
        placeholderIndex++;
        return placeholder;
    });

    // Step 2: Replace all double braces {{ -> { and }} -> } in TypeScript code
    content = content.replace(/\{\{/g, '{').replace(/\}\}/g, '}');

    // Step 3: Restore template and style blocks (they stay as-is with their original {{ }})
    templatePlaceholders.forEach(({ placeholder, value }) => {
        content = content.replace(placeholder, value);
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed: ${path.relative(__dirname, file)}`);
        totalFixed++;
    }
});

console.log(`\nDone! Fixed ${totalFixed} files.`);
