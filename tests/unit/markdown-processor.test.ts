import { isUnifiedProcessor } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';
import astroConfig from '../../astro.config.mjs';

describe('Astro Markdown processor', () => {
  it('uses the configured Unified processor', () => {
    expect(astroConfig.markdown?.processor).toBeDefined();
    expect(isUnifiedProcessor(astroConfig.markdown!.processor!)).toBe(true);
  });
});
