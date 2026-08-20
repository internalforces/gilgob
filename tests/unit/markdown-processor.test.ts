import { isUnifiedProcessor } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';
import astroConfig from '../../astro.config.mjs';

describe('Astro Markdown processor', () => {
  it('uses the configured Unified processor', () => {
    expect(astroConfig.markdown?.processor).toBeDefined();
    expect(isUnifiedProcessor(astroConfig.markdown!.processor!)).toBe(true);
  });

  it('registers the Obsidian remark transformation', () => {
    const processor = astroConfig.markdown?.processor;
    expect(isUnifiedProcessor(processor!)).toBe(true);
    if (!isUnifiedProcessor(processor!)) throw new Error('Unified processor required');

    expect(processor.options.remarkPlugins).toHaveLength(1);
    expect(processor.options.remarkPlugins[0]).toEqual(expect.arrayContaining([
      expect.any(Function),
      expect.objectContaining({ indexPath: '.cache/content-index.json', base: expect.any(String) }),
    ]));
  });
});
