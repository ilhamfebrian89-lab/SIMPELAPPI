import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(projectRoot, 'public');
const staticExtensions = new Set(['.html', '.css', '.js']);

if (relative(projectRoot, outputDirectory) !== 'public') {
  throw new Error('Refusing to clean an unexpected output directory.');
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const rootEntries = await readdir(projectRoot, { withFileTypes: true });
const staticFiles = rootEntries
  .filter((entry) => entry.isFile() && staticExtensions.has(extname(entry.name)))
  .map((entry) => entry.name);

for (const fileName of staticFiles) {
  await cp(join(projectRoot, fileName), join(outputDirectory, fileName));
}

await cp(join(projectRoot, 'assets'), join(outputDirectory, 'assets'), { recursive: true });

console.log(`Built Vercel static output with ${staticFiles.length} root files.`);
