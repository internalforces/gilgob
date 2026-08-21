import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { SITE_CONFIG } from './src/config/site';
import { contentIndexIntegration } from './src/integrations/content-index';
import { remarkObsidian } from './src/lib/markdown/remark-obsidian';

export default defineConfig({
  site: SITE_CONFIG.site,
  base: SITE_CONFIG.base,
  output: 'static',
  integrations: [
    contentIndexIntegration(),
    preact(),
    mdx(),
    sitemap({
      filter: (page) => !new URL(page).pathname.includes('/portfolio/'),
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [[remarkObsidian, {
        indexPath: '.cache/content-index.json',
        base: SITE_CONFIG.base,
        publicOnly: process.env.NODE_ENV === 'production',
      }]],
    }),
  },
});
