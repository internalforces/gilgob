import { describe, expect, it } from 'vitest';
import { SITE_CONFIG, withBase } from '../../src/config/site';

describe('site config', () => {
  it('keeps the approved Korean identity and Pages base path', () => {
    expect(SITE_CONFIG.name).toBe('gilgob');
    expect(SITE_CONFIG.author).toBe('internalforces');
    expect(SITE_CONFIG.locale).toBe('ko-KR');
    expect(withBase('/knowledge')).toBe('/gilgob/knowledge');
  });
});
