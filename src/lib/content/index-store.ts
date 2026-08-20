import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import type { ContentIndex } from './types';

export const DEFAULT_CONTENT_INDEX_PATH = '.cache/content-index.json';

export async function writeContentIndex(index: ContentIndex, path: string): Promise<void> {
  const cacheDirectory = dirname(path);
  const temporaryPath = join(cacheDirectory, `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`);

  await mkdir(cacheDirectory, { recursive: true });
  try {
    await writeFile(temporaryPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export function readContentIndex(path = DEFAULT_CONTENT_INDEX_PATH): ContentIndex {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as ContentIndex;
  } catch (error) {
    if (isMissingFile(error)) {
      throw new Error('[content] 콘텐츠 인덱스 캐시가 없습니다. 개발 서버나 빌드를 다시 시작하세요.');
    }
    throw error;
  }
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
