import { defineConfig } from 'dumi';

// const variablesPath = resolve(
//   __dirname,
//   'src/ui/styles/variables.less',
// ).replace(/\\/g, '/');

export default defineConfig({
  base: '/frontend-threads-2026/',
  publicPath: '/frontend-threads-2026/',
  outputPath: 'docs-dist',
  locales: [{ id: 'en-US', name: 'English' }],
  // Import Less variables globally via Less modifyVars hack (Ant Design recommended)
  // theme: {
  //   hack: `true; @import "${variablesPath}";`,
  // },
  themeConfig: {
    name: 'FT2026',
    footer:
      'Copyright © 2026. Built with <a href="https://d.umijs.org" target="_blank" rel="noreferrer">Dumi</a>.',
    socialLinks: {
      github: 'https://github.com/siouxvn/frontend-threads-2026',
    },
    clickToComponent: true,
    editLink: false,
    sourceLink: true,
  },
  copy: [
    'docs/public/mockServiceWorker.js',
    'docs/public/assets/4K_19m_Vietnam.webm',
  ],
});
