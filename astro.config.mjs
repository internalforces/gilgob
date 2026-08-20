import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { SITE_CONFIG } from './src/config/site';

export default defineConfig({
  site: SITE_CONFIG.site,
  base: SITE_CONFIG.base,
  output: 'static',
  integrations: [preact(), mdx(), sitemap()],
  markdown: {
    processor: unified({ remarkPlugins: [] }),
  },
});
