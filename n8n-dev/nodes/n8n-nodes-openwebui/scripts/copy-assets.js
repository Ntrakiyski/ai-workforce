const fs = require('node:fs');
const path = require('node:path');
const pairs = [['nodes/OpenWebUi/openwebui.svg', 'dist/nodes/OpenWebUi/openwebui.svg']];
for (const [from, to] of pairs) {
	const target = path.resolve(__dirname, '..', to);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.copyFileSync(path.resolve(__dirname, '..', from), target);
}
console.log(`copied ${pairs.length} asset(s) to dist`);
