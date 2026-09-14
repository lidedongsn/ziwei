import { cp, mkdir, readFile, mkdtemp, rename, rm } from 'node:fs/promises';
import path from 'node:path';

// Stage a complete artifact before replacing the generated output directory.
const stage = await mkdtemp(path.resolve('.ziwei-build-'));
try {
  for (const entry of ['manifest.json', 'index.html', 'src']) {
    await cp(entry, path.join(stage, entry), { recursive: true });
  }
  const manifest = JSON.parse(await readFile(path.join(stage, 'manifest.json'), 'utf8'));
  if (manifest.manifest_version !== 3) throw new Error('Expected Manifest V3');
  await mkdir('dist', { recursive: true });
  await rm('dist/ziwei', { recursive: true, force: true });
  await rename(stage, 'dist/ziwei');
  console.log('Chrome extension ready: dist/ziwei');
} finally {
  await rm(stage, { recursive: true, force: true });
}
