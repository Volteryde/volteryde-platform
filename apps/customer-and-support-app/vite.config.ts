import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import mdx from 'fumadocs-mdx/vite';
import * as MdxConfig from './source.config';

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 3000,
    host: true,
  },
  plugins: [mdx(MdxConfig), tailwindcss(), reactRouter(), tsconfigPaths()],
  define: {
    'process.env': process.env,
  },
});
