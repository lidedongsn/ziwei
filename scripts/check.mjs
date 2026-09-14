import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { files } from './files.mjs';

const sources = (await Promise.all(['src', 'scripts', 'tests'].map(files))).flat();
for (const file of sources.filter(name => /\.(?:mjs|js)$/.test(name))) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  const source = await readFile(file, 'utf8');
  for (const [, relative] of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
    await access(path.resolve(path.dirname(file), relative));
  }
}
const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
if (manifest.version !== pkg.version) throw new Error('package.json and manifest.json versions must match');
await access(manifest.background.service_worker);
console.log('Syntax, local module imports, extension entry and version checks passed.');
