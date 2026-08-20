import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const pagefind = resolve('node_modules', '.bin', 'pagefind');
const result = spawnSync(pagefind, ['--site', 'dist'], { stdio: 'inherit' });

if (result.error || result.status !== 0) {
  console.error('[search] Pagefind 인덱스를 생성하지 못했습니다.');
  await mkdir(resolve('dist', 'pagefind'), { recursive: true });
  await writeFile(resolve('dist', 'pagefind', 'unavailable.json'), '{"available":false}');
}
