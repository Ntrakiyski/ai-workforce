import { extract, pack } from 'tar-stream';

export interface TarEntry {
	name: string;
	data: Buffer;
	isDirectory: boolean;
}

/**
 * Wraps one file in a tar archive.
 *
 * The BoxLite file endpoints speak tar, not raw bytes, so even a single upload
 * has to be packed. `tar-stream` handles long names by emitting the pax
 * extended header the server expects.
 */
export function packSingleFile(name: string, data: Buffer): Promise<Buffer> {
	const archive = pack();
	const chunks: Buffer[] = [];

	const done = new Promise<Buffer>((resolve, reject) => {
		archive.on('data', (chunk: unknown) => chunks.push(Buffer.from(chunk as Uint8Array)));
		archive.on('end', () => resolve(Buffer.concat(chunks)));
		archive.on('error', reject);
	});

	archive.entry({ name, size: data.length }, data);
	archive.finalize();

	return done;
}

/**
 * Bounds both file payload bytes and entry count. The transport separately
 * caps archive bytes; neither cap is a total process-memory budget.
 */
export function unpackTar(buffer: Buffer, maxBytes: number, maxEntries = 10_000): Promise<TarEntry[]> {
	const archive = extract();
	const entries: TarEntry[] = [];
	let total = 0;
	let count = 0;

	return new Promise<TarEntry[]>((resolve, reject) => {
		archive.on('entry', (header, stream, next) => {
			const chunks: Buffer[] = [];
			stream.on('error', reject);
			let name: string;
			try {
				if (++count > maxEntries) throw new Error(`Archive exceeds the ${maxEntries} entry limit`);
				name = normalizeEntryName(header.name);
			} catch (error) {
				reject(error);
				archive.destroy(error as Error);
				return;
			}
			stream.on('data', (chunk: unknown) => {
				const bytes = Buffer.from(chunk as Uint8Array);
				total += bytes.length;
				if (total > maxBytes) {
					const error = new Error(
						`Archive is larger than the ${Math.round(maxBytes / (1024 * 1024))} MB limit`,
					);
					reject(error);
					archive.destroy(error);
					return;
				}
				chunks.push(bytes);
			});
			stream.on('end', () => {
				if (header.type === 'file' || header.type === 'directory') entries.push({
					name,
					data: Buffer.concat(chunks),
					isDirectory: header.type === 'directory',
				});
				next();
			});
			stream.resume();
		});

		archive.on('finish', () => resolve(entries));
		archive.on('error', reject);
		archive.end(buffer);
	});
}

/** Strips the `./` prefix and trailing slash tar tools like to add. */
export function normalizeEntryName(name: string): string {
	if (name.startsWith('/') || name.includes('\\') || name.includes('\0') || /^[a-z]:/i.test(name) || name.split('/').includes('..')) {
		throw new Error(`Unsafe archive path: ${JSON.stringify(name)}`);
	}
	return name.replace(/^(\.\/)+/, '').replace(/\/+$/, '');
}
