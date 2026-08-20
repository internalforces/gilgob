import { readFileSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ContentIndex } from './types';

export const DEFAULT_CONTENT_INDEX_PATH = '.cache/content-index.json';

export async function writeContentIndex(index: ContentIndex, path: string): Promise<void> {
  const cacheDirectory = dirname(path);
  const temporaryPath = join(cacheDirectory, 'content-index.tmp.json');

  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, path);
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
