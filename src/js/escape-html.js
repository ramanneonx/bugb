const fs = require('fs');
let code = fs.readFileSync('e:/bugbounty/src/js/academy.js', 'utf8');

if (!code.includes('function escapeHTML')) {
  code = `function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}\n\n` + code;
}

const varsToEscape = [
  'b.title', 'b.target', 'b.type', 'b.notes',
  'n.title', 'n.body', 'n.tag',
  'tool.name', 'tool.desc',
  'p.name', 'p.desc',
  'c.title', 'c.target', 'c.body',
  'item.title', 'item.body',
  'vuln.name', 'vuln.desc',
  't.name', 't.scope', 't.domain', 't.platform',
  's', 'c.text', 'l.tool', 'l.cmd', 'l.output'
];

varsToEscape.forEach(v => {
  const regex = new RegExp(`\\$\\{` + v.replace(/\./g, '\\.') + `\\}`, 'g');
  code = code.replace(regex, `\\$\\{escapeHTML(${v})\\}`);
});

fs.writeFileSync('e:/bugbounty/src/js/academy.js', code);
console.log('Done!');
