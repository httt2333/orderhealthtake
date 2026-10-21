import { cp, mkdir, rm, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('site-dist/', root);
const entries = ['index.html', 'styles.css', 'src', 'assets'];
// Check inputs before replacing the generated directory.
for (const entry of entries) await access(new URL(entry, root));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of entries) {
  await cp(new URL(entry, root), new URL(entry, output), { recursive: true });
}
console.log(`Static site prepared: ${fileURLToPath(output)}`);
