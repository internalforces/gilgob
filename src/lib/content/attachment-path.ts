import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, join, posix, relative, sep } from 'node:path';

const ATTACHMENT_PREFIX = 'attachments/';

export function attachmentRelativePath(target: string): string | null {
  if (!target.startsWith(ATTACHMENT_PREFIX) || target.includes('\\')) return null;
  const relativePath = target.slice(ATTACHMENT_PREFIX.length);
  const segments = relativePath.split('/');
  if (
    relativePath === ''
    || segments.some((segment) => segment === '' || segment === '.' || segment === '..')
    || posix.normalize(relativePath) !== relativePath
  ) return null;
  return relativePath;
}

export async function resolveContainedAttachment(contentRoot: string, target: string): Promise<string | null> {
  const relativePath = attachmentRelativePath(target);
  if (relativePath === null) return null;

  try {
    const canonicalContentRoot = await realpath(contentRoot);
    const canonicalAttachmentRoot = await realpath(join(contentRoot, 'attachments'));
    if (!isContainedPath(canonicalAttachmentRoot, canonicalContentRoot)) return null;

    const canonicalFile = await realpath(join(canonicalAttachmentRoot, relativePath));
    if (!isContainedPath(canonicalFile, canonicalAttachmentRoot)) return null;
    return (await stat(canonicalFile)).isFile() ? canonicalFile : null;
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
}

export function isContainedPath(path: string, root: string): boolean {
  const pathFromRoot = relative(root, path);
  return pathFromRoot === ''
    || (pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot));
}

export function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
