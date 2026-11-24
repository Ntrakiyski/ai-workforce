// Copies non-TypeScript assets into dist, so the n8n loader can resolve
// `file:` icons next to the compiled node.
const fs = require('node:fs');
const path = require('node:path');

const pairs = [['nodes/BoxLite/boxlite.svg', 'dist/nodes/BoxLite/boxlite.svg']];

for (const [from, to] of pairs) {
	const target = path.resolve(__dirname, '..', to);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.copyFileSync(path.resolve(__dirname, '..', from), target);
}

console.log(`copied ${pairs.length} asset(s) to dist`);
