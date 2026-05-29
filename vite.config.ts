import { defineConfig } from 'vite';

const repoBase = '/sailer-2d-felice/';
const defaultBase = process.env.GITHUB_PAGES === 'true' ? repoBase : '/';
const base = process.env.BASE_PATH || defaultBase;

export default defineConfig({
  base,
});
